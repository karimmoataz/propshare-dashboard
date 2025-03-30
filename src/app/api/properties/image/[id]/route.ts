// app/api/properties/image/[id]/route.ts
import { NextResponse } from 'next/server';
import Property from '../../../../../models/Property';
import dbConnect from '../../../../../lib/db';

export async function GET(
  req: Request,
  { params }: { params: Record<string, string> } // Next.js compatible type
) {
  try {
    await dbConnect();
    const property = await Property.findById(params.id);
    
    if (!property?.image) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(property.image, {
      headers: {
        'Content-Type': property.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Image fetch error:', error);
    return new NextResponse(null, { status: 500 });
  }
}