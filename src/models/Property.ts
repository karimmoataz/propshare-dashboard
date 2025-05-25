import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
    _id: string;
    name: string;
    images: { url: string; publicId: string }[];
    documents: { url: string; publicId: string; filename: string; contentType: string }[];
    contentType: string;
    currentPrice: number;
    currentPriceDate: Date;
    previousPrices: [
        {
            price: number;
            date: Date;
        }
    ];
    location: string;
    developer:string;
    area: number;
    floors: number;
    rooms: number;
    numberOfShares: number;
    sharePrice: number;
    availableShares: number;
    balance: number;
    monthlyRent: number;
    shares: Array<{
        userId: mongoose.Types.ObjectId;
        shares: number;
    }>;
}

const PropertySchema = new Schema<IProperty>({
    name: { type: String, required: true },
    images: [{
    url: {
        type: String,
        required: true
        },
        publicId: {
        type: String,
        required: true
        }
     }],
//    documents: [{
//       url: {
//         type: String,
//         required: true
//       },
//       publicId: {
//         type: String,
//         required: true
//       },
//       filename: {
//         type: String,
//         required: true
//       },
//       contentType: {
//         type: String,
//         required: true
//       }
//     }],
    contentType: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    currentPriceDate: { type: Date, default: Date.now },
    previousPrices: [{
        price: { type: Number, required: true },
        date: { type: Date, required: true }
    }],
    location: { type: String, required: true },
    developer: { type: String, required: false },
    area: { type: Number, required: true },
    floors: { type: Number, required: true },
    rooms: { type: Number, required: true },
    numberOfShares: { type: Number, required: true },
    sharePrice: { type: Number, required: true },
    availableShares: { type: Number, required: true },
    balance: { type: Number, default: 0 },
    monthlyRent: { type: Number, default: 0 },
    shares: [{
        userId: { 
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true 
        },
        shares: { 
            type: Number,
            required: true,
            min: 0
        }
    }]
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true } 
});

const Property = mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);
export default Property;