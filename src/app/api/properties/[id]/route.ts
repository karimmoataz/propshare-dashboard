import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/config';
import Property from '@/models/Property';
import dbConnect from '@/lib/db';
import type { Params } from 'next/dist/shared/lib/router/utils/route-matcher';

export async function PUT(
  request: NextRequest,
  context: { params: Params }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = context.params.id as string;
  const formData = await request.formData();

  // Build update data with type safety
  const updateData = {
    name: formData.get('name')?.toString(),
    currentPrice: Number(formData.get('currentPrice')),
    location: formData.get('location')?.toString(),
    area: Number(formData.get('area')),
    floors: Number(formData.get('floors')),
    rooms: Number(formData.get('rooms')),
  };

  // Handle image upload
  const imageFile = formData.get('image');
  if (imageFile instanceof File && imageFile.size > 0) {
    Object.assign(updateData, {
      image: Buffer.from(await imageFile.arrayBuffer()),
      contentType: imageFile.type
    });
  }

  try {
    await dbConnect();
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return updatedProperty 
      ? NextResponse.json(updatedProperty)
      : NextResponse.json({ error: 'Property not found' }, { status: 404 });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}