import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../auth/config';
import dbConnect from '../../../../../lib/db';
import Property from '../../../../../models/Property';
import User from '../../../../../models/User';
import Transaction from '../../../../../models/Transaction';
import mongoose from 'mongoose';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get property ID from params
  const getParams = async () => context.params;
  const { id } = await getParams();
  
  try {
    const { rentAmount } = await request.json();
    
    if (!rentAmount || isNaN(Number(rentAmount)) || Number(rentAmount) <= 0) {
      return NextResponse.json(
        { error: 'Valid rent amount is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // Use a MongoDB session for transactions
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    
    try {
      // Find the property with its shares
      const property = await Property.findById(id).session(mongoSession);
      if (!property) {
        await mongoSession.abortTransaction();
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }

      if (property.balance < rentAmount) {
        await mongoSession.abortTransaction();
        return NextResponse.json(
          { error: 'Property balance insufficient for distribution' },
          { status: 400 }
        );
      }
      
      // Check if property has any shareholders
      if (!property.shares || property.shares.length === 0) {
        await mongoSession.abortTransaction();
        return NextResponse.json(
          { error: 'Property has no shareholders' },
          { status: 400 }
        );
      }
      
      // Calculate total shares (just in case some shares are not owned)
    interface ShareHolder {
      userId: mongoose.Types.ObjectId;
      shares: number;
    }

    interface PropertyWithShares extends mongoose.Document {
      shares: ShareHolder[];
      name: string;
      balance: number;
    }

    const propertyTyped = property as PropertyWithShares;
    const totalOwnedShares = propertyTyped.shares.reduce(
      (sum: number, share: ShareHolder) => sum + share.shares,
      0
    );
      if (totalOwnedShares === 0) {
        await mongoSession.abortTransaction();
        return NextResponse.json(
          { error: 'No shares are owned by users' },
          { status: 400 }
        );
      }
      
      // Process each shareholder
      const updatePromises = [];
      const transactionPromises = [];
      
      for (const shareHolder of property.shares) {
        if (shareHolder.shares <= 0) continue;
        
        // Calculate this user's share of the rent
        const shareamount = rentAmount / property.numberOfShares;
       // const sharePercentage = shareHolder.shares / totalOwnedShares;
        const userRentAmount = shareamount * totalOwnedShares;
        
        // Update user balance
        updatePromises.push(
          User.updateOne(
            { _id: shareHolder.userId },
            { $inc: { balance: userRentAmount } },
            { session: mongoSession }
          )
        );
        
        // Get user information for transaction record
        const user = await User.findById(shareHolder.userId).session(mongoSession);
        if (!user) continue;

        const transactionId = new mongoose.Types.ObjectId();
        // Create transaction record
        const transaction = new Transaction({
          user: shareHolder.userId,
          userName: user.fullName || user.username,
          amount: userRentAmount,
          date: new Date(),
          type: 'Deposit',
          source: 'rent',
          description: `Rent income from ${property.name} (${shareHolder.shares} shares)`,
          paymobId: `rent_${transactionId}`,
        });
        
        transactionPromises.push(transaction.save({ session: mongoSession }));
      }
      
      // Update property balance
      updatePromises.push(
          Property.updateOne(
            { _id: id },
            { $inc: { balance: -Number(rentAmount) } },
            { session: mongoSession }
          )
        );


      // Wait for all operations to complete
      await Promise.all([...updatePromises, ...transactionPromises]);
      
      // Commit the transaction
      await mongoSession.commitTransaction();
      
      return NextResponse.json({
        success: true,
        message: `Rent of $${rentAmount} successfully distributed among ${property.shares.length} shareholders`,
        distributed: rentAmount,
        shareholders: property.shares.length
      });
      
    } catch (error) {
      // If anything goes wrong, abort the transaction
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      // End the session
      mongoSession.endSession();
    }
    
  } catch (error) {
    console.error('Error distributing rent:', error);
    return NextResponse.json(
      { error: 'Error distributing rent' },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}