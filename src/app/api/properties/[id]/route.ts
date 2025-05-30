import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/config';
import Property from '../../../../models/Property';
import dbConnect from '../../../../lib/db';
import { uploadToCloudinary, deleteFromCloudinary, uploadDocumentToCloudinary, deleteDocumentFromCloudinary } from '../../../../lib/cloudinary';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

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
      name: string;
      currentPrice: number;
      currentPriceDate: Date;
      sharePrice: number;
      location: string;
      developer: string;
      area: number;
      floors: number;
      rooms: number;
      balance: number;
      monthlyRent: number;
    }

    const addToBalance = Number(formData.get('addToBalance')) || 0;
    
    // Get current property first
    await dbConnect();
    const currentProperty = await Property.findById(id);
    if (!currentProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const updateData: UpdateData = {
      name: formData.get('name')?.toString() || currentProperty.name,
      currentPrice: Number(formData.get('currentPrice')) || currentProperty.currentPrice,
      currentPriceDate: new Date(),
      sharePrice: 0, // Will be calculated below
      location: formData.get('location')?.toString() || currentProperty.location,
      developer: formData.get('developer')?.toString() || currentProperty.developer,
      area: Number(formData.get('area')) || currentProperty.area,
      floors: Number(formData.get('floors')) || currentProperty.floors,
      rooms: Number(formData.get('rooms')) || currentProperty.rooms,
      balance: currentProperty.balance + addToBalance,
      monthlyRent: Number(formData.get('monthlyRent')) || currentProperty.monthlyRent,
    };
    
    // Handle image updates (if any)
    const shouldReplaceImages = formData.get('replaceImages') === 'true';
    let images = [...currentProperty.images]; // Start with current images
    
    if (shouldReplaceImages) {
      // Delete all existing images from Cloudinary
      for (const image of currentProperty.images) {
        try {
          await deleteFromCloudinary(image.publicId);
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue even if some deletions fail
        }
      }
      images = []; // Clear existing images
    }
    
    // Process new images (if any)
    const imageFiles = formData.getAll('images') as File[];
    if (imageFiles && imageFiles.length > 0 && imageFiles[0].size > 0) {
      for (const imageFile of imageFiles) {
        if (imageFile.type.startsWith('image/')) {
          const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
          const uploadedUrl = await uploadToCloudinary(imageBuffer, imageFile.type);
          
          // Extract public ID from the URL
          const publicId = uploadedUrl.split('/').slice(-1)[0].split('.')[0];
          const fullPublicId = `properties/${publicId}`;
          
          images.push({
            url: uploadedUrl,
            publicId: fullPublicId
          });
        }
      }
    }
    
    // Handle document updates
    const shouldReplaceDocuments = formData.get('replaceDocuments') === 'true';
    let documents: { url: string; publicId: string; filename: string; contentType: string }[] = currentProperty.documents || []; // Start with current documents
    
    if (shouldReplaceDocuments) {
      // Delete all existing documents from Cloudinary
      if (documents.length > 0) {
        for (const doc of documents) {
          try {
            await deleteDocumentFromCloudinary(doc.publicId);
          } catch (error) {
            console.error('Error deleting document:', error);
            // Continue even if some deletions fail
          }
        }
        documents = []; // Clear existing documents
      }
    }
    
    // Process new documents (if any)
    const documentFiles = formData.getAll('documents') as File[];
    if (documentFiles && documentFiles.length > 0 && documentFiles[0].size > 0) {
      for (const docFile of documentFiles) {
        if (docFile.type === 'application/pdf') {
          const docBuffer = Buffer.from(await docFile.arrayBuffer());
          const uploadResult = await uploadDocumentToCloudinary(
            docBuffer, 
            docFile.type,
            docFile.name
          );
          
          documents.push({
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            filename: docFile.name,
            contentType: docFile.type
          });
        }
      }
    }
    
    // Remove specific images if requested
    const imagesToRemove = formData.getAll('removeImages') as string[];
    if (imagesToRemove && imagesToRemove.length > 0) {
      for (const imagePublicId of imagesToRemove) {
        try {
          await deleteFromCloudinary(imagePublicId);
          images = images.filter(img => img.publicId !== imagePublicId);
        } catch (error) {
          console.error(`Error removing image ${imagePublicId}:`, error);
        }
      }
    }
    
    // Remove specific documents if requested
    const docsToRemove = formData.getAll('removeDocuments') as string[];
    if (docsToRemove && docsToRemove.length > 0) {
      for (const docPublicId of docsToRemove) {
        try {
          await deleteDocumentFromCloudinary(docPublicId);
          documents = documents.filter((doc: { publicId: string }) => doc.publicId !== docPublicId);
        } catch (error) {
          console.error(`Error removing document ${docPublicId}:`, error);
        }
      }
    }
    
    // Calculate share price using the formula: currentPrice / numberOfShares
    updateData.sharePrice = updateData.currentPrice / currentProperty.numberOfShares;
    
    // Check if price changed
    const priceChanged = updateData.currentPrice !== currentProperty.currentPrice;
    
    let updatedProperty;
    
    if (priceChanged) {
      // Update operation that pushes the old price with its timestamp to previousPrices array
      updatedProperty = await Property.findByIdAndUpdate(
        id,
        {
          ...updateData,
          images: images,
          documents: documents,
          $push: { 
            previousPrices: { 
              price: currentProperty.currentPrice,
              date: currentProperty.currentPriceDate || new Date() // Use existing timestamp or fallback
            } 
          }
        },
        { new: true }
      );
    } else {
      // No price change
      updatedProperty = await Property.findByIdAndUpdate(
        id,
        {
          ...updateData,
          images: images,
          documents: documents
        },
        { new: true }
      );
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
    
    // Find the property first to get image and document references
    const property = await Property.findById(id);
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Delete all associated images from Cloudinary
    if (property.images && property.images.length > 0) {
      for (const image of property.images) {
        try {
          await deleteFromCloudinary(image.publicId);
        } catch (error) {
          console.error(`Error deleting image ${image.publicId}:`, error);
          // Continue deletion process even if some image deletions fail
        }
      }
    }
    
    // Delete all associated documents from Cloudinary
    if (property.documents && property.documents.length > 0) {
      for (const doc of property.documents) {
        try {
          await deleteDocumentFromCloudinary(doc.publicId);
        } catch (error) {
          console.error(`Error deleting document ${doc.publicId}:`, error);
          // Continue deletion process even if some document deletions fail
        }
      }
    }
    
    // Now delete the property from database
    await Property.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Property deleted successfully' });
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Error deleting property' },
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