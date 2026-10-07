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
    // Código legible de orden para el cliente y seguimiento (ej: CQ-849201)
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
        enum: ['PENDIENTE', 'PREPARACION', 'ENVIADO', 'ENTREGADO'],
        default: 'PENDIENTE',
      },
      cost: { type: Number, default: 0 },
    },

    // Método de pago soportado
    paymentMethod: {
      type: String,
      required: [true, 'El método de pago es obligatorio'],
      enum: {
        values: ['MERCADO_PAGO', 'TRANSFERENCIA'],
        message: '{VALUE} no es un método de pago válido. Debe ser MERCADO_PAGO o TRANSFERENCIA',
      },
      default: 'MERCADO_PAGO',
    },

    // Control de estados
    status: {
      type: String,
      required: true,
      enum: {
        values: ['PENDING', 'PAID', 'CANCELLED'],
        message: '{VALUE} no es un estado válido. Debe ser PENDING, PAID o CANCELLED',
      },
      default: 'PENDING',
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

// Índice compuesto útil para consultas de pedidos recientes por estado
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
