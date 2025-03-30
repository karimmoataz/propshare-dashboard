import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import type { Params } from 'next/dist/shared/lib/router/utils/route-matcher';
import authOptions from '../../auth/config';
import User from '../../../../models/User';
import dbConnect from '../../../../lib/db';

export async function PUT(
  req: Request,
  context: { params: Params } // Using Next.js internal Params type
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    await dbConnect();
    
    const user = await User.findByIdAndUpdate(
      context.params.id as string, // Type assertion to string
      data,
      { new: true }
    ).select('-password -oldPasswords -verificationToken -resetPasswordToken -resetPasswordExpires');

    return user 
      ? NextResponse.json(user)
      : NextResponse.json({ error: 'User not found' }, { status: 404 });
      
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Error updating user' },
      { status: 500 }
    );
  }
}