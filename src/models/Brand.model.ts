import { Schema, model, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    logo: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IBrand>('Brand', brandSchema);
