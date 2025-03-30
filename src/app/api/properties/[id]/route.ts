import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../api/auth/config';
import Property from '@/models/Property';
import dbConnect from '@/lib/db';

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Proper async params handling
  const getParams = async () => context.params;
  const { id } = await getParams();

  try {
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

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}