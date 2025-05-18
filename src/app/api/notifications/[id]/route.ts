import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/config';
import Notification from '../../../../models/Notifications';
import User from '../../../../models/User';
import dbConnect from '../../../../lib/db';
import { Expo } from 'expo-server-sdk';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Initialize Expo SDK client
const expo = new Expo();

// GET a specific notification by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;

  try {
    await dbConnect();
    
    const notification = await Notification.findById(id)
      .populate('userId', 'fullName email expoPushToken')
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
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = context.params;
  
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
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = context.params;
  
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

// Send push notification for a specific notification
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = context.params;
  
  try {
    await dbConnect();
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    // Send push notification
    let tokens: string[] = [];
    
    if (notification.isGlobal) {
      // Get all users with push tokens for global notification
      const users = await User.find({ expoPushToken: { $exists: true, $ne: null } })
        .select('expoPushToken')
        .lean<Array<{ expoPushToken?: string }>>();
      
      tokens = users
        .map((user: { expoPushToken?: string }) => user.expoPushToken)
        .filter((token: unknown): token is string => typeof token === 'string' && Expo.isExpoPushToken(token));
      
    } else if (notification.userId) {
      // Get specific user for targeted notification
      const user = await User.findById(notification.userId)
        .select('expoPushToken')
        .lean<{ expoPushToken?: string }>();
      
      if (user && user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        tokens = [user.expoPushToken];
      }
    }
    
    if (tokens.length === 0) {
      return NextResponse.json({ 
        message: 'No valid push tokens found',
        sent: 0
      });
    }
    
    // Create notification messages
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.message,
      data: { 
        notificationId: notification._id.toString(),
        propertyId: notification.propertyId ? notification.propertyId.toString() : null,
        isGlobal: notification.isGlobal
      },
    }));

    // Chunk the notifications
    const chunks = expo.chunkPushNotifications(messages);
    
    // Send the chunks
    let sendResults = [];
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        sendResults.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }
    
    const successCount = sendResults.filter(ticket => ticket.status === 'ok').length;
    
    return NextResponse.json({
      message: 'Push notifications sent',
      sent: successCount,
      total: tokens.length,
      results: sendResults
    });
    
  } catch (error) {
    console.error('Send push notification error:', error);
    return NextResponse.json(
      { error: 'Error sending push notification' },
      { status: 500 }
    );
  }
}