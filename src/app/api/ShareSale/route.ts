import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/config';
import ShareSale from '@/models/ShareSale';
import dbConnect from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get all pending share sales
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const sales = await ShareSale.find({ status: 'pending' })
      .populate('user', 'username fullName email')
      .populate('property', 'name sharePrice')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Error fetching sales' }, { status: 500 });
  }
}