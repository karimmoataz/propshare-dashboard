// models/Property.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
    _id: string;
    name: string;
    image: Buffer;
    contentType: string;
    currentPrice: number;
    previousPrices: number[];
    location: string;
    area: number;
    floors: number;
    rooms: number;
    shareId: string;
}

const PropertySchema = new Schema<IProperty>({
    name: { type: String, required: true },
    image: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    previousPrices: { type: [Number], default: [] },
    location: { type: String, required: true },
    area: { type: Number, required: true },
    floors: { type: Number, required: true },
    rooms: { type: Number, required: true },
    shareId: { type: String, required: true, unique: true }
}, { timestamps: true });

PropertySchema.pre('save', function(next) {
  if (this.isModified('currentPrice')) {
    this.previousPrices.push(this.currentPrice);
  }
  next();
});

const Property = mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);

export default Property;