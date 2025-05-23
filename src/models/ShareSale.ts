import mongoose, { Document, Schema } from 'mongoose';

export interface IShareSale extends Document {
  user: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  shares: number;
  totalValue: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ShareSaleSchema = new Schema<IShareSale>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    shares: { type: Number, required: true, min: 1 },
    totalValue: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const ShareSale = mongoose.models.ShareSale || mongoose.model<IShareSale>('ShareSale', ShareSaleSchema);
export default ShareSale;