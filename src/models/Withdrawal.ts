import mongoose, { Document, Schema } from 'mongoose';

export interface IWithdrawal extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  method: 'Local Bank Transfer' | 'E-Wallet' | 'InstaPay';
  details: {
    bankName?: string;
    receiverName?: string;
    accountNumber?: string;
    provider?: string;
    instapayId?: string;
    mobileNumber?: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  notes?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
}

const WithdrawalSchema = new mongoose.Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  method: { 
    type: String, 
    enum: ['Local Bank Transfer', 'E-Wallet', 'InstaPay'], 
    required: true 
  },
  details: {
    // Bank Transfer fields
    bankName: String,
    receiverName: String,
    accountNumber: String,
    
    // E-Wallet fields
    provider: String,
    
    // InstaPay fields
    instapayId: String,
    mobileNumber: String
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'], 
    default: 'pending' 
  },
  notes: { 
    type: String 
  },
  processedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  processedAt: { 
    type: Date 
  }
}, { timestamps: true });

const Withdrawal = mongoose.models.Withdrawal || 
  mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);

export default Withdrawal;