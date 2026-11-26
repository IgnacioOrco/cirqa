import mongoose from 'mongoose';

const abandonedCartItemSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true },
    productId: { type: String, trim: true },
    modelCode: { type: String, trim: true },
    slug: { type: String, trim: true },
    name: { type: String, trim: true },
    price: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, default: 1, min: 1 },
    variantKey: { type: String, trim: true },
    variantName: { type: String, trim: true },
    variantSubtitle: { type: String, trim: true },
    badgeColor: { type: String, trim: true },
    filter: { type: mongoose.Schema.Types.Mixed, default: null },
    image: { type: String, trim: true },
  },
  { _id: false }
);

const abandonedCartSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      index: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    recoveryToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    items: {
      type: [abandonedCartItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'recovered', 'notified'],
      default: 'pending',
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const AbandonedCart = mongoose.model('AbandonedCart', abandonedCartSchema);

export default AbandonedCart;
