import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/config';
import Notification from '../../../models/Notifications';
import dbConnect from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all notifications for admin dashboard
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = parseInt(url.searchParams.get('skip') || '0');
    
    // Build query based on status
    let query = {};
    if (status !== 'all') {
      if (status === 'global') {
        query = { isGlobal: true };
      } else if (status === 'user') {
        query = { isGlobal: false };
      }
    }
    
    const notifications = await Notification.find(query)
      .populate('userId', 'fullName email')
      .populate('propertyId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { error: 'Error fetching notifications' },
      { status: 500 }
    );
  }
}

// Create a new notification
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const body = await request.json();
    const { title, message, propertyId, isGlobal, userIds } = body;
    
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }
    
    // Create global notification
    if (isGlobal) {
      const notification = new Notification({
        title,
        message,
        propertyId: propertyId || null,
        isGlobal: true
      });
      
      await notification.save();
      
      return NextResponse.json({
        message: 'Global notification created successfully',
        notification
      }, { status: 201 });
    }
    
    // Create notifications for specific users
    if (!userIds || userIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one user ID is required for targeted notifications' },
        { status: 400 }
      );
    }
    
    const notifications = [];
    
    // Create a notification for each user
    for (const userId of userIds) {
      const notification = new Notification({
        title,
        message,
        propertyId: propertyId || null,
        userId,
        isGlobal: false
      });
      
      await notification.save();
      notifications.push(notification);
    }
    
    return NextResponse.json({
      message: 'Notifications created successfully',
      count: notifications.length
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Error creating notification' },
      { status: 500 }
    );
  }
}