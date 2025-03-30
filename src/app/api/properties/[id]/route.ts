import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/config';
import Property from '@/models/Property';
import dbConnect from '@/lib/db';

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } } // Exact type declaration
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate ID format
  if (!/^[0-9a-fA-F]{24}$/.test(context.params.id)) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  const formData = await request.formData();

  // Build update data
  const updateData = {
    name: formData.get('name'),
    currentPrice: Number(formData.get('currentPrice')),
    location: formData.get('location'),
    area: Number(formData.get('area')),
    floors: Number(formData.get('floors')),
    rooms: Number(formData.get('rooms')),
    ...(formData.has('image') && {
      image: Buffer.from(await (formData.get('image') as File).arrayBuffer()),
      contentType: (formData.get('image') as File).type
    })
  };

  try {
    await dbConnect();
    const updatedProperty = await Property.findByIdAndUpdate(
      context.params.id,
      updateData,
      { new: true }
    );

    return updatedProperty 
      ? NextResponse.json(updatedProperty)
      : NextResponse.json({ error: 'Property not found' }, { status: 404 });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Error updating property' },
      { status: 500 }
    );
  }
}