// app/api/properties/route.ts
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';
import Property from '../../../models/Property';
import dbConnect from '../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const properties = await Property.find({});
  return NextResponse.json(properties);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const formData = await req.formData();
  
  const imageFile = formData.get('image') as File;
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
  
  const propertyData = {
    name: formData.get('name'),
    image: imageBuffer,
    contentType: imageFile.type,
    currentPrice: Number(formData.get('currentPrice')),
    location: formData.get('location'),
    area: Number(formData.get('area')),
    floors: Number(formData.get('floors')),
    rooms: Number(formData.get('rooms')),
    shareId: uuidv4()
  };

  try {
    const newProperty = await Property.create(propertyData);
    return NextResponse.json(newProperty);
  } catch (_error) {
    return NextResponse.json({ error: 'Error creating property' }, { status: 500 });
  }
}