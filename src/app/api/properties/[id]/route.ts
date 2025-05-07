import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../api/auth/config';
import Property from '../../../../models/Property';
import dbConnect from '../../../../lib/db';

export const revalidate = 0;

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
      currentPriceDate: Date; // Add timestamp for current price
      sharePrice: number;
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
      currentPriceDate: new Date(), // Set current timestamp
      sharePrice: 0, // Will be calculated below
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
    
    // First, get the current property to check if price is changing
    const currentProperty = await Property.findById(id);
    if (!currentProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Calculate share price using the formula: currentPrice / numberOfShares
    const newPrice = updateData.currentPrice;
    updateData.sharePrice = newPrice / currentProperty.numberOfShares;
    
    if (newPrice !== currentProperty.currentPrice) {
      // Update operation that pushes the old price with its timestamp to previousPrices array
      const updatedProperty = await Property.findByIdAndUpdate(
        id,
        {
          ...updateData,
          $push: { 
            previousPrices: { 
              price: currentProperty.currentPrice,
              date: currentProperty.currentPriceDate || new Date() // Use existing timestamp or fallback
            } 
          }
        },
        { new: true }
      );
      
      return NextResponse.json(updatedProperty);
    } else {
      // No price change, but we still update the share price in case numberOfShares has changed
      const updatedProperty = await Property.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      
      return NextResponse.json(updatedProperty);
    }
    
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

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get property ID from params
  const getParams = async () => context.params;
  const { id } = await getParams();
  
  try {
    await dbConnect();
    
    // Find and delete the property
    const deletedProperty = await Property.findByIdAndDelete(id);
    
    if (!deletedProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Property deleted successfully' });
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Error deleting property' },
      { status: 500 }
    );
  }
}