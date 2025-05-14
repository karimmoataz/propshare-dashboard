import mongoose, { Document, Schema } from 'mongoose';

// Define the PendingShare document interface

export interface IPendingShare extends Document {
  user: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  shares: number;
  totalCost: number;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const PendingShareSchema = new Schema<IPendingShare>(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    property: { 
      type: Schema.Types.ObjectId, 
      ref: 'Property',
      required: true 
    },
    shares: { 
      type: Number, 
      required: true,
      min: 1
    },
    totalCost: { 
      type: Number, 
      required: true,
      min: 0
    },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'rejected'], 
      default: 'pending'
    }
  },
  { timestamps: true }
);

const PendingShare = mongoose.models.PendingShare || 
  mongoose.model<IPendingShare>('PendingShare', PendingShareSchema);

export default PendingShare;