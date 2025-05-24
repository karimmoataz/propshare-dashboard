import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/config';
import Notification from '../../../models/Notifications';
import User from '../../../models/User';
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

// Create a new notification and send to app backend
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
      
      // Send to app backend for push notification processing
      try {
        const appBackendResponse = await fetch('https://admin.propshare.online/notifications/send-push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Dashboard-Auth': process.env.DASHBOARD_API_KEY || 'dashboard-secret-key'
          },
          body: JSON.stringify({
            title,
            message,
            propertyId: propertyId || null,
            isGlobal: true,
            notificationId: notification._id.toString()
          })
        });

        if (!appBackendResponse.ok) {
          console.error('Failed to send push notification via app backend');
          const errorText = await appBackendResponse.text();
          console.error('App backend error:', errorText);
        }
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
      }
      
      return NextResponse.json({
        message: 'Global notification created and push notification sent',
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
    const pushNotificationPromises = [];
    
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

      // Send to app backend for push notification processing
      pushNotificationPromises.push(
        fetch('https://admin.propshare.online/notifications/send-push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Dashboard-Auth': process.env.DASHBOARD_API_KEY || 'dashboard-secret-key'
          },
          body: JSON.stringify({
            title,
            message,
            propertyId: propertyId || null,
            isGlobal: false,
            userId,
            notificationId: notification._id.toString()
          })
        }).catch(error => {
          console.error(`Error sending push notification for user ${userId}:`, error);
        })
      );
    }

    // Wait for all push notifications to be sent
    await Promise.allSettled(pushNotificationPromises);
    
    return NextResponse.json({
      message: 'Notifications created and push notifications sent',
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