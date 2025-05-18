import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the user document interface
export interface IUser extends Document {
  fullName: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  balance: number;
  pendingIncome: number;
  pendingInvestment: number;
  outcome: number;
  verified: boolean;
  role: 'admin' | 'user';
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  ownedShares: Array<{
    propertyId: mongoose.Types.ObjectId;
    shares: number;
  }>;
  oldPasswords: string[];
  comparePassword(candidatePassword: string): Promise<boolean>;
  idVerification?: {
    nationalId?: string;
    status?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
    frontId?: {
      data: String;
      contentType: string;
      uploadDate?: Date;
    };
    backId?: {
      data: String;
      contentType: string;
      uploadDate?: Date;
    };
    selfie?: {
      data: String;
      contentType: string;
      uploadDate?: Date;
    };
    rejectionReason?: string;
    verifiedDate?: Date;
  };
}

// Check if the model already exists to prevent overwrite during hot reloads
const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  pendingIncome: { type: Number, required: true, default: 0 },
  pendingInvestment: { type: Number, required: true, default: 0 },
  outcome: { type: Number, required: true, default: 0 },
  verified: { type: Boolean, default: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  oldPasswords: [{ type: String }],
  ownedShares: [
    {
      propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
      shares: { type: Number, default: 0 }
    }
  ],
  idVerification: {
    nationalId: { type: String },
    status: { 
      type: String, 
      enum: ['not_submitted', 'pending', 'verified', 'rejected'], 
      default: 'not_submitted' 
    },
    frontId: {
      url: String,
      publicId: String,
      uploadDate: { type: Date }
    },
    backId: {
      url: String,
      publicId: String,
      uploadDate: { type: Date }
    },
    selfie: {
      url: String,
      publicId: String,
      uploadDate: { type: Date }
    },
    rejectionReason: String,
    verifiedDate: Date,
    submittedDate: Date
    }
  },
  { timestamps: true }
);

// Password comparison method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Use existing models if available, otherwise create new ones
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User as Model<IUser>;