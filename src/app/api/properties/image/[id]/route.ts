// app/api/properties/image/[id]/route.ts
import { NextResponse } from 'next/server';
import Property from '../../../../../models/Property';
import dbConnect from '../../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  const property = await Property.findById(params.id);
  
  if (!property || !property.image) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(property.image, {
    headers: {
      'Content-Type': property.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}