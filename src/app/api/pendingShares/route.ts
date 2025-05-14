import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/config';
import PendingShare from '../../../models/PendingShare';
import dbConnect from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    await dbConnect();
    
    // Find all pending shares with status 'pending'
    // Populate with user and property info for display
    const pendingShares = await PendingShare.find({ status: 'pending' })
      .populate('user', 'username fullName email')
      .populate('property', 'name currentPrice sharePrice')
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();
    
    return NextResponse.json(pendingShares);
    
  } catch (error) {
    console.error('Fetch pending shares error:', error);
    return NextResponse.json(
      { error: 'Error fetching pending shares' },
      { status: 500 }
    );
  }
}