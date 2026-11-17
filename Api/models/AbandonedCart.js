import mongoose from 'mongoose';

const abandonedCartItemSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    filter: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    price: { type: Number, default: 0, min: 0 },
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
