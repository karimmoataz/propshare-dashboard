import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  userName: string;
  paymobId?: string;
  amount: number;
  date: Date;
  type: 'Deposit' | 'Withdraw';
  source: 'Card' | 'Bank' | 'Cash' | 'Investment' | 'Dividend' | 'rent';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    paymobId: {
      type: String,
      required: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['Deposit', 'Withdraw'],
      required: true,
    },
    source: {
      type: String,
      enum: ['Card', 'Bank', 'Cash', 'Investment', 'Dividend', 'rent', 'Share Sale'],
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);