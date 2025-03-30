import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import authOptions from '@/app/api/auth/config';
import Property from '@/models/Property';
import dbConnect from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = params.id;
  const formData = await request.formData();
  interface UpdateData {
    name: FormDataEntryValue | null;
    currentPrice: number;
    location: FormDataEntryValue | null;
    area: number;
    floors: number;
    rooms: number;
    image?: Buffer;
    contentType?: string;
  }

  const updateData: UpdateData = {
    name: formData.get('name'),
    currentPrice: Number(formData.get('currentPrice')),
    location: formData.get('location'),
    area: Number(formData.get('area')),
    floors: Number(formData.get('floors')),
    rooms: Number(formData.get('rooms'))
  };

  const imageFile = formData.get('image') as File | null;
  if (imageFile && imageFile.size > 0) {
    updateData.image = Buffer.from(await imageFile.arrayBuffer());
    updateData.contentType = imageFile.type;
  }

  try {
    await dbConnect();
    const updatedProperty = await Property.findByIdAndUpdate(id, updateData, {
      new: true
    });
    
    if (!updatedProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    return NextResponse.json(updatedProperty);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Error updating property' },
      { status: 500 }
    );
  }
}