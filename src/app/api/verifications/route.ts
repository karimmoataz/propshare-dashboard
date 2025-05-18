import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import authOptions from '../auth/config';
import User from '../../../models/User';
import dbConnect from '../../../lib/db';

export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const users = await User.find({ 'idVerification.status': 'pending' })
      .select('fullName email idVerification')
      .lean();

    // Transform response for Cloudinary URLs
    const transformedUsers = users.map(user => ({
      ...user,
      idVerification: {
        ...user.idVerification,
        frontId: user.idVerification?.frontId?.data || null,
        backId: user.idVerification?.backId?.data || null,
        selfie: user.idVerification?.selfie?.data || null
      }
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Error fetching verifications' },
      { status: 500 }
    );
  }
}