import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'El código de cupón es obligatorio'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'bogo_2x1', 'bogo_3x2', 'second_unit_percent'],
      required: true,
      default: 'percentage',
    },
    // Para 'percentage' (ej. 10, 20), 'fixed' (monto en ARS ej. 15000), o 'second_unit_percent' (ej. 50 para 50% en la 2da unidad)
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxUses: {
      type: Number,
      default: null, // null = ilimitado
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUsesPerCustomer: {
      type: Number,
      default: null,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ], // vacío = aplica a todo el catálogo
    combinableWithTransfer: {
      type: Boolean,
      default: true, // Por defecto SE ACUMULA con el 15% de transferencia
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null, // null = sin vencimiento
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageHistory: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        orderNumber: String,
        customerEmail: String,
        discountApplied: Number,
        usedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Índice para búsqueda rápida por código
couponSchema.index({ code: 1 });

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
export default Coupon;
