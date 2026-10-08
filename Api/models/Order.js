import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    name: {
      type: String,
      required: [true, 'El nombre del producto al momento de la compra es obligatorio'],
      trim: true,
    },
    modelCode: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'El precio unitario es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad mínima es 1'],
      default: 1,
    },
    filter: {
      type: String,
      trim: true,
    },
    variantKey: {
      type: String,
      trim: true,
    },
    variantName: {
      type: String,
      trim: true,
    },
    variantSubtitle: {
      type: String,
      trim: true,
    },
    prescription: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Código legible de orden para el cliente y seguimiento (ej: CQ-2026-849201)
    orderNumber: {
      type: String,
      trim: true,
      index: true,
    },

    // Items comprados con referencia a Product
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'La orden debe contener al menos un producto',
      },
    },

    // Total de la orden
    totalAmount: {
      type: Number,
      required: [true, 'El monto total de la orden es obligatorio'],
      min: [0, 'El total no puede ser negativo'],
    },

    // Moneda de la transacción
    currency: {
      type: String,
      default: 'ARS',
      uppercase: true,
      trim: true,
    },

    // Datos del comprador
    customer: {
      name: {
        type: String,
        required: [true, 'El nombre del cliente es obligatorio'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'El email del cliente es obligatorio'],
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      dni: {
        type: String,
        trim: true,
      },
      shippingAddress: {
        street: { type: String, trim: true },
        floor: { type: String, trim: true },
        apartment: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
      },
    },

    // Logística y Envío
    shipping: {
      carrier: { type: String, trim: true, default: '' },
      trackingNumber: { type: String, trim: true, default: '' },
      status: {
        type: String,
        enum: ['PENDIENTE', 'PREPARACION', 'ENVIADO', 'ENTREGADO', 'pending', 'preparacion', 'enviado', 'entregado'],
        default: 'PENDIENTE',
      },
      cost: { type: Number, default: 0 },
    },

    // Método de pago estructurado
    payment: {
      method: {
        type: String,
        required: [true, 'El método de pago es obligatorio'],
        enum: {
          values: ['mercadopago', 'transfer'],
          message: '{VALUE} no es un método de pago válido. Debe ser mercadopago o transfer',
        },
        default: 'mercadopago',
      },
      provider: {
        type: String,
        default: 'mercadopago',
      },
      details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },

    // Campo de retrocompatibilidad con frontend existente y queries
    paymentMethod: {
      type: String,
      default: 'MERCADO_PAGO',
    },

    // Control de estados de la orden
    status: {
      type: String,
      required: true,
      enum: {
        values: [
          'pending',
          'paid',
          'failed',
          'cancelled',
          'shipped',
          'delivered',
          'PENDING',
          'PAID',
          'FAILED',
          'CANCELLED',
          'SHIPPED',
          'DELIVERED',
        ],
        message: '{VALUE} no es un estado válido de orden',
      },
      default: 'pending',
      index: true,
    },

    // Identificador de la pasarela para transacciones externas (ej: Mercado Pago payment/preference ID)
    gateway_id: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    // Comprobante de pago para transferencias bancarias (URL del archivo subido)
    receipt_url: {
      type: String,
      trim: true,
      default: null,
    },

    // Notas adicionales o de seguimiento
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware pre-validate para auto-generación de orderNumber y sincronización payment / paymentMethod
orderSchema.pre('validate', function (next) {
  // 1. Auto-generación de orderNumber con formato CQ-AÑO-RANDOM (ej: CQ-2026-784912)
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    this.orderNumber = `CQ-${year}-${randomCode}`;
  }

  // 2. Normalización de payment y retrocompatibilidad con paymentMethod
  if (!this.payment) {
    this.payment = {
      method: 'mercadopago',
      provider: 'mercadopago',
    };
  }

  if (this.paymentMethod) {
    const pmLower = String(this.paymentMethod).toLowerCase();
    if (pmLower.includes('transfer')) {
      this.payment.method = 'transfer';
      this.payment.provider = this.payment.provider || 'manual';
    } else {
      this.payment.method = 'mercadopago';
      this.payment.provider = this.payment.provider || 'mercadopago';
    }
  } else if (this.payment?.method) {
    const mLower = String(this.payment.method).toLowerCase();
    this.payment.method = mLower.includes('transfer') ? 'transfer' : 'mercadopago';
  }

  if (!this.payment.provider) {
    this.payment.provider = this.payment.method === 'transfer' ? 'manual' : 'mercadopago';
  }

  // 3. Sincronizar paymentMethod en formato compatible
  this.paymentMethod = this.payment.method === 'transfer' ? 'TRANSFERENCIA' : 'MERCADO_PAGO';

  // 4. Normalizar status si viene en mayúsculas
  if (this.status) {
    this.status = this.status.toLowerCase();
  } else {
    this.status = 'pending';
  }

  next();
});

// Índice compuesto útil para consultas de pedidos recientes por estado
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
