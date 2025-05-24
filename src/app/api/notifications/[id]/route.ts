import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/config';
import Notification from '../../../../models/Notifications';
import User from '../../../../models/User';
import dbConnect from '../../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET a specific notification by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await dbConnect();
    
    const notification = await Notification.findById(id)
      .populate('userId', 'fullName email')
      .populate('propertyId', 'name');
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Fetch notification error:', error);
    return NextResponse.json(
      { error: 'Error fetching notification' },
      { status: 500 }
    );
  }
}

// Update a notification
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await context.params;
  
  try {
    await dbConnect();
    
    const body = await request.json();
    const { title, message } = body;
    
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    notification.title = title;
    notification.message = message;
    await notification.save();
    
    return NextResponse.json({
      message: 'Notification updated successfully',
      notification
    });
    
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Error updating notification' },
      { status: 500 }
    );
  }
}

// Delete a notification
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await context.params;
  
  try {
    await dbConnect();
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    await Notification.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Notification deleted successfully' });
    
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { error: 'Error deleting notification' },
      { status: 500 }
    );
  }
}

// Resend push notification for a specific notification via app backend
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  
  try {
    await dbConnect();
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    // Send to app backend for push notification processing
    try {
      const appBackendResponse = await fetch('https://admin.propshare.online/notifications/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dashboard-Auth': process.env.DASHBOARD_API_KEY || 'dashboard-secret-key'
        },
        body: JSON.stringify({
          title: notification.title,
          message: notification.message,
          propertyId: notification.propertyId ? notification.propertyId.toString() : null,
          isGlobal: notification.isGlobal,
          userId: notification.userId ? notification.userId.toString() : null,
          notificationId: notification._id.toString()
        })
      });

      if (!appBackendResponse.ok) {
        const errorText = await appBackendResponse.text();
        console.error('App backend error:', errorText);
        return NextResponse.json(
          { error: 'Failed to send push notification via app backend' },
          { status: 500 }
        );
      }

      const result = await appBackendResponse.json();
      
      return NextResponse.json({
        message: 'Push notification sent via app backend',
        result
      });
      
    } catch (pushError) {
      console.error('Error sending push notification:', pushError);
      return NextResponse.json(
        { error: 'Error sending push notification via app backend' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Resend push notification error:', error);
    return NextResponse.json(
      { error: 'Error resending push notification' },
      { status: 500 }
    );
  }
}