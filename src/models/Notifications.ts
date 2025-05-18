import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  propertyId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  isGlobal: boolean;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: false,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
notificationSchema.index({ userId: 1 });
notificationSchema.index({ propertyId: 1 });
notificationSchema.index({ isGlobal: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notifications || mongoose.model<INotification>('Notifications', notificationSchema);