import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/config';
import PendingShare from '../../../../models/PendingShare';
import Property from '../../../../models/Property';
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
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get pendingShare ID from params
  const getParams = async () => context.params;
  const { id } = await getParams();
  
  // Start a MongoDB session for transaction
  const mongooseSession = await mongoose.startSession();
  mongooseSession.startTransaction();
  
  try {
    await dbConnect();
    
    // 1. Find the pending share
    const pendingShare = await PendingShare.findById(id).session(mongooseSession);
    
    if (!pendingShare) {
      await mongooseSession.abortTransaction();
      mongooseSession.endSession();
      return NextResponse.json({ error: 'Pending share not found' }, { status: 404 });
    }
    
    if (pendingShare.status !== 'pending') {
      await mongooseSession.abortTransaction();
      mongooseSession.endSession();
      return NextResponse.json({ error: 'Share has already been processed' }, { status: 400 });
    }
    
    // 2. Find the property
    const property = await Property.findById(pendingShare.property).session(mongooseSession);
    
    if (!property) {
      await mongooseSession.abortTransaction();
      mongooseSession.endSession();
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // 3. Check if there are enough available shares
    if (property.availableShares < pendingShare.shares) {
      await mongooseSession.abortTransaction();
      mongooseSession.endSession();
      return NextResponse.json({ 
        error: 'Not enough available shares in the property' 
      }, { status: 400 });
    }
    
    // 4. Find the user
    const user = await User.findById(pendingShare.user).session(mongooseSession) as mongoose.Document & { _id: mongoose.Types.ObjectId; pendingInvestment: number; ownedShares: { propertyId: mongoose.Types.ObjectId; shares: number }[]; email: string };
    
    if (!user) {
      await mongooseSession.abortTransaction();
      mongooseSession.endSession();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user has enough pending investment
    if (user.pendingInvestment < pendingShare.totalCost) {
      await mongooseSession.abortTransaction();
      mongooseSession.endSession();
      return NextResponse.json({ 
        error: 'User does not have enough pending investment funds' 
      }, { status: 400 });
    }
    
    // 5. Start updating models
    
    // 5.1 Update property - decrease available shares & add user to shares array
    const userShareIndex: number = property.shares.findIndex((share: { userId: mongoose.Types.ObjectId; shares: number }) => 
      share.userId.toString() === user._id.toString()
    );
    
    if (userShareIndex >= 0) {
      // User already owns shares in this property, update the count
      property.shares[userShareIndex].shares += pendingShare.shares;
    } else {
      // Add new entry for this user
      property.shares.push({
        userId: user._id,
        shares: pendingShare.shares
      });
    }
    
    // Update available shares
    property.availableShares -= pendingShare.shares;
    // property.balance += pendingShare.totalCost;
    await property.save({ session: mongooseSession });
    
    // 5.2 Update user - decrease pending income, add to owned shares or update
    user.pendingInvestment -= pendingShare.totalCost;
    
    interface UserOwnedShare {
      propertyId: mongoose.Types.ObjectId;
      shares: number;
    }

    const userOwnedShareIndex: number = user.ownedShares.findIndex((share: UserOwnedShare) => 
      share.propertyId.toString() === property._id.toString()
    );
    
    if (userOwnedShareIndex >= 0) {
      // User already owns shares of this property, update count
      user.ownedShares[userOwnedShareIndex].shares += pendingShare.shares;
    } else {
      // Add new entry
      user.ownedShares.push({
        propertyId: property._id,
        shares: pendingShare.shares
      });
    }
    
    await user.save({ session: mongooseSession });
    
    // 5.3 Update pending share status to 'completed'
    pendingShare.status = 'completed';
    await pendingShare.save({ session: mongooseSession });
    
    // 5.4 Create a new withdrawal transaction for the user
    // Generate a unique transaction ID to avoid duplicate key errors
    const transactionId = new mongoose.Types.ObjectId();
    
    const newTransaction = new Transaction({
      _id: transactionId,
      user: user._id,
      userName: user.email,
      amount: pendingShare.totalCost,
      date: new Date(),
      type: 'Withdraw',
      source: 'Investment',
      description: `Purchase of ${pendingShare.shares} shares for property ${property.name || property._id}`,
      // Ensure a unique or non-null paymobId if it's a required field
      paymobId: `share_purchase_${transactionId}`,
    });
    
    await newTransaction.save({ session: mongooseSession });
    
    // 6. Commit the transaction
    await mongooseSession.commitTransaction();
    mongooseSession.endSession();
    
    return NextResponse.json({ 
      message: 'Share processed successfully',
      pendingShare: pendingShare,
      transaction: newTransaction
    });
    
  } catch (error) {
    // If an error occurred, abort the transaction
    await mongooseSession.abortTransaction();
    mongooseSession.endSession();
    
    console.error('Process pending share error:', error);
    return NextResponse.json(
      { error: 'Error processing pending share' },
      { status: 500 }
    );
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

  const getParams = async () => context.params;
  const { id } = await getParams();
  
  const mongooseSession = await mongoose.startSession();
  mongooseSession.startTransaction();


  try {
    await dbConnect();

    const pendingShare = await PendingShare.findById(id).session(mongooseSession);
    if (!pendingShare) {
      await mongooseSession.abortTransaction();
      mongooseSession.endSession();
      return NextResponse.json({ error: 'Pending share not found' }, { status: 404 });
    }

    if (pendingShare.status !== 'pending') {
      await mongooseSession.abortTransaction();
      mongooseSession.endSession();
      return NextResponse.json({ error: 'Share already processed' }, { status: 400 });
    }

    const user = await User.findById(pendingShare.user).session(mongooseSession) as mongoose.Document & { pendingInvestment: number; balance: number; email: string };
    if (!user) {
      await mongooseSession.abortTransaction();
      mongooseSession.endSession();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Refund logic
    user.pendingInvestment -= pendingShare.totalCost;
    user.balance += pendingShare.totalCost; // Ensure User model has 'balance' field
    pendingShare.status = 'rejected';


    await Promise.all([
      pendingShare.save({ session: mongooseSession }),
      user.save({ session: mongooseSession }),
    ]);

    await mongooseSession.commitTransaction();
    mongooseSession.endSession();

    return NextResponse.json({ 
      message: 'Share refused and funds refunded',
      pendingShare,
    });

  } catch (error) {
    await mongooseSession.abortTransaction();
    mongooseSession.endSession();
    console.error('Refusal error:', error);
    return NextResponse.json(
      { error: 'Error refusing share' },
      { status: 500 }
    );
  }
}