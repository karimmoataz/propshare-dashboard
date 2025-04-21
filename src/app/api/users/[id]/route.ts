// src/app/api/users/[id]/route.ts
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

  // Proper async params handling
  const getParams = async () => context.params;
  const { id } = await getParams();

  try {
    // Parse request body
    const data = await req.json();
    
    // Database connection
    await dbConnect();

    // Update user
    const user = await User.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).select('-password -oldPasswords -verificationToken -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Error updating user' },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}