// src/app/api/verifications/route.ts
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

  await dbConnect();
  
  const users = await User.find({ 'idVerification.status': 'pending' })
    .select('fullName email idVerification')
    .lean();

  // Convert Buffer to base64 strings for images
  const usersWithBase64 = users.map(user => ({
    ...user,
    idVerification: {
      ...user.idVerification,
      frontId: user.idVerification?.frontId ? {
        ...user.idVerification.frontId,
        data: user.idVerification.frontId.data.toString('base64')
      } : null,
      backId: user.idVerification?.backId ? {
        ...user.idVerification.backId,
        data: user.idVerification.backId.data.toString('base64')
      } : null,
      selfie: user.idVerification?.selfie ? {
        ...user.idVerification.selfie,
        data: user.idVerification.selfie.data.toString('base64')
      } : null
    }
  }));

  return NextResponse.json(usersWithBase64);
}