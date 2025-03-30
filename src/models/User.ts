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
  oldPasswords: string[];
  comparePassword(candidatePassword: string): Promise<boolean>;
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
    oldPasswords: [String],
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