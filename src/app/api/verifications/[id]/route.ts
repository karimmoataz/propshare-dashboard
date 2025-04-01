// src/app/api/verifications/[id]/route.ts
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import authOptions from '../../auth/config';
import User from '../../../../models/User';
import dbConnect from '../../../../lib/db';

export async function PUT(req: Request, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const getParams = async () => context.params;
  const { id } = await getParams();


  try {
    const data = await req.json();
    
    await dbConnect();

    const updateData: any = {
      'idVerification.status': data.status,
      'idVerification.verifiedDate': new Date()
    };

    if (data.status === 'rejected') {
      updateData['idVerification.rejectionReason'] = data.rejectionReason;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('idVerification fullName email');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Verification update error:', error);
    return NextResponse.json(
      { error: 'Error updating verification' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}