import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import authOptions from '../../auth/config';
import User from '../../../../models/User';
import dbConnect from '../../../../lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const data = await req.json();

  await dbConnect();
  try {
    const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-password -oldPasswords -verificationToken -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (_error) {
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}