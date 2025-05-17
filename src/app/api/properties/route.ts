import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import authOptions from '../auth/config';
import Property from '../../../models/Property';
import dbConnect from '../../../lib/db';
import { uploadToCloudinary, uploadDocumentToCloudinary } from '../../../lib/cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const properties = await Property.find({})
            .select('-__v')
            .lean();
        return NextResponse.json(properties);
    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json(
            { error: 'Error fetching properties' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const formData = await req.formData();

        // Process image files (multiple)
        const imageUrls = [];
        const imageFiles = formData.getAll('images') as File[];
        
        if (!imageFiles || imageFiles.length === 0 || !imageFiles[0].size) {
            return NextResponse.json(
                { error: 'At least one image file is required' },
                { status: 400 }
            );
        }

        // Upload each image to Cloudinary
        for (const imageFile of imageFiles) {
            if (!imageFile.type.startsWith('image/')) {
                return NextResponse.json(
                    { error: 'All files must be valid images' },
                    { status: 400 }
                );
            }
            
            const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
            const uploadedUrl = await uploadToCloudinary(imageBuffer, imageFile.type);
            
            // Extract public ID from the URL
            const publicId = uploadedUrl.split('/').slice(-1)[0].split('.')[0];
            const fullPublicId = `properties/${publicId}`;
            
            imageUrls.push({
                url: uploadedUrl,
                publicId: fullPublicId
            });
        }
        
        // Process document files (multiple)
        const documentUrls = [];
        const documentFiles = formData.getAll('documents') as File[];
        
        // Process documents if any are uploaded
        if (documentFiles && documentFiles.length > 0 && documentFiles[0].size > 0) {
            for (const docFile of documentFiles) {
                // Check if file is a PDF
                if (docFile.type === 'application/pdf') {
                    const docBuffer = Buffer.from(await docFile.arrayBuffer());
                    const uploadResult = await uploadDocumentToCloudinary(
                        docBuffer, 
                        docFile.type,
                        docFile.name
                    );
                    
                    documentUrls.push({
                        url: uploadResult.url,
                        publicId: uploadResult.publicId,
                        filename: docFile.name,
                        contentType: docFile.type
                    });
                } else {
                    console.warn('Skipping non-PDF document:', docFile.name);
                    // Continue processing other files even if one is not a PDF
                }
            }
        }

        // Parse numeric fields
        const numericFields = [
            'currentPrice',
            'numberOfShares',
            'area',
            'floors',
            'rooms'
        ];
        const fieldValues: { [key: string]: number } = {};

        for (const field of numericFields) {
            const value = Number(formData.get(field));
            if (isNaN(value) || value <= 0) {
                return NextResponse.json(
                    { error: `Invalid ${field} value` },
                    { status: 400 }
                );
            }
            fieldValues[field] = value;
        }

        // Validate text fields
        const textFields = ['name', 'location'];
        for (const field of textFields) {
            if (!formData.get(field)?.toString().trim()) {
                return NextResponse.json(
                    { error: `${field} is required` },
                    { status: 400 }
                );
            }
        }

        // Calculate derived values
        const sharePrice = fieldValues.currentPrice / fieldValues.numberOfShares;

        const propertyData = {
            name: formData.get('name')!.toString(),
            images: imageUrls,
            documents: documentUrls,
            currentPrice: fieldValues.currentPrice,
            currentPriceDate: new Date(),
            previousPrices: [],
            location: formData.get('location')!.toString(),
            area: fieldValues.area,
            floors: fieldValues.floors,
            rooms: fieldValues.rooms,
            numberOfShares: fieldValues.numberOfShares,
            sharePrice: Number(sharePrice.toFixed(2)),
            availableShares: fieldValues.numberOfShares,
            balance: 0,
            shares: [],
            contentType: imageFiles[0].type,
            monthlyRent: Number(formData.get('monthlyRent')) || 0
        };

        const newProperty = await Property.create(propertyData);
        return NextResponse.json(newProperty, { status: 201 });

    } catch (error) {
        console.error('Creation error:', error);
        return NextResponse.json(
            { error: 'Server error processing request' },
            { status: 500 }
        );
    }
}