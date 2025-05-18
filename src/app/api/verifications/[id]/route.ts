import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import authOptions from '../../auth/config';
import User from '../../../../models/User';
import dbConnect from '../../../../lib/db';

export const revalidate = 0;

export async function PUT(req: Request, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;

  try {
    const data = await req.json();
    
    // Validate request
    if (!data.status || !['verified', 'rejected'].includes(data.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (data.status === 'rejected' && !data.rejectionReason) {
      return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 });
    }

    await dbConnect();

    const updateData: any = {
      'idVerification.status': data.status,
      'verified': data.status === 'verified'
    };

    // Conditionally set verification date
    if (data.status === 'verified') {
      updateData['idVerification.verifiedDate'] = new Date();
    }

    // Handle rejection
    if (data.status === 'rejected') {
      updateData['idVerification.rejectionReason'] = data.rejectionReason;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('idVerification fullName email verified');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Safe response format
    const responseData = {
      idVerification: {
        status: user.idVerification?.status,
        verifiedDate: user.idVerification?.verifiedDate,
        rejectionReason: user.idVerification?.rejectionReason,
        frontId: user.idVerification?.frontId?.url,
        backId: user.idVerification?.backId?.url,
        selfie: user.idVerification?.selfie?.url
      },
      fullName: user.fullName,
      email: user.email,
      verified: user.verified
    };

    return NextResponse.json(responseData);
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