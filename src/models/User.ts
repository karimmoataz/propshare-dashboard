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
      data: Buffer;
      contentType: string;
      uploadDate?: Date;
    };
    backId?: {
      data: Buffer;
      contentType: string;
      uploadDate?: Date;
    };
    selfie?: {
      data: Buffer;
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
    username: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    pendingIncome: { type: Number, default: 0 },
    outcome: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    ownedShares: [
      {
        propertyId: { type: Schema.Types.ObjectId, ref: 'properties' },
        shares: { type: Number, default: 0 }
      }
    ],
    oldPasswords: [String],
    idVerification: {
      nationalId: { type: String },
      status: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
      frontId: {
        data: Buffer,
        contentType: String,
        uploadDate: { type: Date, default: Date.now }
      },
      backId: {
        data: Buffer,
        contentType: String,
        uploadDate: { type: Date, default: Date.now }
      },
      selfie: {
        data: Buffer,
        contentType: String,
        uploadDate: { type: Date, default: Date.now }
      },
      rejectionReason: String,
      verifiedDate: Date
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