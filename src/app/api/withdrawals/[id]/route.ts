import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/config';
import Withdrawal from '../../../../models/Withdrawal';
import User from '../../../../models/User';
import Transaction from '../../../../models/Transaction';
import dbConnect from '../../../../lib/db';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = context.params;
  const mongooseSession = await mongoose.startSession();
  mongooseSession.startTransaction();

  try {
    await dbConnect();
    const withdrawal = await Withdrawal.findById(id).session(mongooseSession);
    
    if (!withdrawal) {
      await mongooseSession.abortTransaction();
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    // Corrected user reference
    if (!withdrawal.userId || !mongoose.Types.ObjectId.isValid(withdrawal.userId)) {
      await mongooseSession.abortTransaction();
      return NextResponse.json(
        { error: 'Invalid withdrawal: missing user reference' },
        { status: 400 }
      );
    }

    if (withdrawal.status !== 'pending') {
      await mongooseSession.abortTransaction();
      return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 });
    }

    const user = await User.findById(withdrawal.userId).session(mongooseSession);
    
    if (!user) {
      withdrawal.status = 'rejected';
      withdrawal.processedBy = session.user.id;
      withdrawal.processedAt = new Date();
      withdrawal.notes = 'Associated user account not found';
      await withdrawal.save({ session: mongooseSession });
      
      await mongooseSession.commitTransaction();
      return NextResponse.json(
        { message: 'Withdrawal rejected - user not found' },
        { status: 200 }
      );
    }

    if (user.balance < withdrawal.amount) {
      await mongooseSession.abortTransaction();
      return NextResponse.json({ error: 'Insufficient user balance' }, { status: 400 });
    }

    user.balance -= withdrawal.amount;
    await user.save({ session: mongooseSession });

    const transactionId = new mongoose.Types.ObjectId();
    const transaction = new Transaction({
      user: user._id,
      userName: user.fullName || user.email || 'Unknown User',
      amount: withdrawal.amount,
      date: new Date(),
      type: 'Withdraw',
      source: 'Bank',
      description: `Withdrawal processed via ${withdrawal.method}`,
      paymobId: `withdraw_${transactionId}`,
    });
    await transaction.save({ session: mongooseSession });

    withdrawal.status = 'completed';
    withdrawal.processedBy = session.user.id;
    withdrawal.processedAt = new Date();
    await withdrawal.save({ session: mongooseSession });

    await mongooseSession.commitTransaction();
    return NextResponse.json({ message: 'Withdrawal approved successfully' });

  } catch (error) {
    await mongooseSession.abortTransaction();
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Error approving withdrawal' },
      { status: 500 }
    );
  } finally {
    mongooseSession.endSession();
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;
  const mongooseSession = await mongoose.startSession();
  mongooseSession.startTransaction();

  try {
    await dbConnect();
    const withdrawal = await Withdrawal.findById(id).session(mongooseSession);
    
    if (!withdrawal) {
      await mongooseSession.abortTransaction();
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    // Corrected user reference
    if (!withdrawal.userId) {
      withdrawal.status = 'rejected';
      withdrawal.processedBy = session.user.id;
      withdrawal.processedAt = new Date();
      withdrawal.notes = 'Withdrawal rejected - no associated user found';
      await withdrawal.save({ session: mongooseSession });
      
      await mongooseSession.commitTransaction();
      return NextResponse.json({ 
        message: 'Withdrawal rejected - no associated user' 
      });
    }

    if (withdrawal.status !== 'pending') {
      await mongooseSession.abortTransaction();
      return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 });
    }

    withdrawal.status = 'rejected';
    withdrawal.processedBy = session.user.id;
    withdrawal.processedAt = new Date();
    withdrawal.notes = 'Withdrawal rejected by admin';
    await withdrawal.save({ session: mongooseSession });

    await mongooseSession.commitTransaction();
    return NextResponse.json({ message: 'Withdrawal rejected successfully' });

  } catch (error) {
    await mongooseSession.abortTransaction();
    console.error('Rejection error:', error);
    return NextResponse.json(
      { error: 'Error rejecting withdrawal' },
      { status: 500 }
    );
  } finally {
    mongooseSession.endSession();
  }
}