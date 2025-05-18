import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/config';
import Withdrawal from '../../../models/Withdrawal';
import dbConnect from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all pending withdrawals
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(withdrawals);
  } catch (error) {
    console.error('Fetch withdrawals error:', error);
    return NextResponse.json(
      { error: 'Error fetching withdrawals' },
      { status: 500 }
    );
  }
}