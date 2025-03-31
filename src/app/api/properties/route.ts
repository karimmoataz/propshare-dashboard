import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import authOptions from '../auth/config';
import Property from '../../../models/Property';
import dbConnect from '../../../lib/db';
import { File } from 'buffer';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const properties = await Property.find({})
            .select('-image -__v')
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

        // Validate image
        const imageFile = formData.get('image') as File;
        if (!imageFile || !imageFile.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Valid image file required' },
                { status: 400 }
            );
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
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

        const propertyData = {
            name: formData.get('name')!.toString(),
            image: imageBuffer,
            contentType: imageFile.type,
            currentPrice: fieldValues.currentPrice,
            previousPrices: [],
            location: formData.get('location')!.toString(),
            area: fieldValues.area,
            floors: fieldValues.floors,
            rooms: fieldValues.rooms,
            numberOfShares: fieldValues.numberOfShares,
            sharePrice: Number(sharePrice.toFixed(2)),
            availableShares: fieldValues.numberOfShares,
            balance: 0,
            shares: []
        };

        const newProperty = await Property.create(propertyData);
        const responseData = newProperty.toObject();
        delete responseData.image;

        return NextResponse.json(responseData, { status: 201 });

    } catch (error) {
        console.error('Creation error:', error);
        return NextResponse.json(
            { error: 'Server error processing request' },
            { status: 500 }
        );
    }
}