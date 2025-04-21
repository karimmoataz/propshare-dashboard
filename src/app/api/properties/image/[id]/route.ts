import { NextResponse } from 'next/server';
import Property from '../../../../../models/Property';
import dbConnect from '../../../../../lib/db';

export const revalidate = 0;

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    // Proper async params handling
    const getParams = async () => context.params;
    const { id } = await getParams();

    await dbConnect();
    const property = await Property.findById(id);
    
    if (!property || !property.image) {
      return new NextResponse(null, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    }

    return new NextResponse(property.image, {
      headers: {
        'Content-Type': property.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Image fetch error:', error);
    return new NextResponse(null, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  }
}

// CORS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'text/plain'
    }
  });
}