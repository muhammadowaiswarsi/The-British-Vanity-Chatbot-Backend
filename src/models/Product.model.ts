import { Schema, model, Document, Types } from 'mongoose';

export interface IVariant {
  _id?: Types.ObjectId;
  options: Record<string, string>;
  stock: number;
  sku?: string;
  additionalPrice: number;
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: Types.ObjectId;
  brand: Types.ObjectId;
  variants: IVariant[];
  stock?: number;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IVariant>(
  {
    options: { type: Map, of: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String },
    additionalPrice: { type: Number, default: 0 },
  },
  { _id: true }
);

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    variants: { type: [variantSchema], default: [] },
    stock: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ category: 1, brand: 1, isActive: 1 });

export default model<IProduct>('Product', productSchema);
