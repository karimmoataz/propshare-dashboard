import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/config';
import ShareSale from '@/models/ShareSale';
import User from '@/models/User';
import Property from '@/models/Property';
import Transaction from '@/models/Transaction';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// Approve Share Sale
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
)  {
  const userSession = await getServerSession(authOptions);
  if (!userSession || userSession.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const getParams = async () => context.params;
  const { id } = await getParams();
  
  await dbConnect();
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Get the share sale request
    const sale = await ShareSale.findById(id).session(session);
    if (!sale) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    if (sale.status !== 'pending') {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Sale already processed' }, { status: 400 });
    }

    // 2. Get related documents
    const [user, property] = await Promise.all([
      User.findById(sale.user).session(session),
      Property.findById(sale.property).session(session)
    ]);

    if (!user || !property) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'User or Property not found' }, { status: 404 });
    }

    // 3. Verify user shares and pending income
    const userShare = user.ownedShares.find(s => 
        s.propertyId.toString() === sale.property.toString()
        );

        // Check if user has enough shares
        if (!userShare || userShare.shares < sale.shares) {
        await session.abortTransaction();
        return NextResponse.json({ error: 'Insufficient shares' }, { status: 400 });
        }

        // Check if pending income matches sale value
        if (user.pendingIncome < sale.totalValue) {
        await session.abortTransaction();
        return NextResponse.json(
            { error: 'Pending income mismatch - possible data inconsistency' },
            { status: 409 }
        );
    }

    // 4. Update User - Add pending income handling
    user.pendingIncome -= sale.totalValue;
    user.balance += sale.totalValue;
    user.ownedShares = user.ownedShares.map(share => 
    share.propertyId.toString() === sale.property.toString()
        ? { ...share, shares: share.shares - sale.shares }
        : share
    ).filter(share => share.shares > 0);

    // 5. Update Property
    property.availableShares += sale.shares;
    const propertyShareIndex = property.shares.findIndex((s: { userId: mongoose.Types.ObjectId, shares: number }) => 
      s.userId.toString() === (user as { _id: mongoose.Types.ObjectId })._id.toString()
    );
    
    if (propertyShareIndex !== -1) {
      property.shares[propertyShareIndex].shares -= sale.shares;
      if (property.shares[propertyShareIndex].shares <= 0) {
        property.shares.splice(propertyShareIndex, 1);
      }
    }

    const transactionId = new mongoose.Types.ObjectId();
    // 6. Create Transaction
    const transaction = new Transaction({
      user: user._id,
      userName: user.username,
      amount: sale.totalValue,
      date: new Date(),
      type: 'Deposit',
      source: 'Share Sale',
      description: `Sold ${sale.shares} shares of ${property.name}`,
      paymobId: `share_Sell_${transactionId}`,
    });

    // 7. Update sale status
    sale.status = 'approved';
    sale.approvedAt = new Date();

    await Promise.all([
      user.save({ session }),
      property.save({ session }),
      sale.save({ session }),
      transaction.save({ session })
    ]);

    await session.commitTransaction();
    return NextResponse.json({ message: 'Sale approved successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Approval error:', error);
  } finally {
    await session.endSession();
  }
}

// Reject Share Sale
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;
  const mongooseSession = await mongoose.startSession();
  mongooseSession.startTransaction();

  try {
    await dbConnect();

    // 1. Find and lock the share sale document
    const sale = await ShareSale.findById(id).session(mongooseSession);
    if (!sale) {
      await mongooseSession.abortTransaction();
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    if (sale.status !== 'pending') {
      await mongooseSession.abortTransaction();
      return NextResponse.json({ error: 'Sale already processed' }, { status: 400 });
    }

    // 2. Find and lock the user document
    const user = await User.findById(sale.user).session(mongooseSession);
    if (!user) {
      await mongooseSession.abortTransaction();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Update pending income
    if (user.pendingIncome < sale.totalValue) {
      await mongooseSession.abortTransaction();
      return NextResponse.json({ 
        error: 'Pending income mismatch - possible data inconsistency' 
      }, { status: 409 });
    }

    user.pendingIncome -= sale.totalValue;
    user.pendingIncome = Math.max(user.pendingIncome, 0); // Prevent negative values

    // 4. Update sale status
    sale.status = 'rejected';
    sale.rejectedAt = new Date();

    // 5. Save changes atomically
    await Promise.all([
      user.save({ session: mongooseSession }),
      sale.save({ session: mongooseSession })
    ]);

    // 6. Commit transaction
    await mongooseSession.commitTransaction();
    mongooseSession.endSession();

    return NextResponse.json({ 
      message: 'Sale rejected and pending income updated',
      updatedPendingIncome: user.pendingIncome
    });

  } catch (error) {
    await mongooseSession.abortTransaction();
    mongooseSession.endSession();
    console.error('Rejection error:', error);
    return NextResponse.json(
      { error: 'Error processing sale rejection' },
      { status: 500 }
    );
  }
}