import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import authOptions from '../auth/config';
import User from '../../../models/User';
import dbConnect from '../../../lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const users = await User.find({}).select('-password -oldPasswords -verificationToken -resetPasswordToken -resetPasswordExpires').lean();
  return NextResponse.json(users);
}