// app/api/properties/image/[id]/route.ts
import { NextResponse } from 'next/server';
import Property from '../../../../../models/Property';
import dbConnect from '../../../../../lib/db';
import type { Params } from 'next/dist/shared/lib/router/utils/route-matcher';

export async function GET(
  req: Request,
  context: { params: Params } // Official Next.js params type
) {
  try {
    await dbConnect();
    const property = await Property.findById(context.params.id as string);
    
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