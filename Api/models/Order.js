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

    // Subtotal: Suma de productos a precio regular (sin descuentos ni costos de envío)
    subtotal: {
      type: Number,
      required: [true, 'El subtotal de la orden es obligatorio'],
      min: [0, 'El subtotal no puede ser negativo'],
    },

    // Descuento: 15% OFF para transferencia bancaria (0 para Mercado Pago)
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'El monto de descuento no puede ser negativo'],
    },

    // Costo de envío tarifado por Zipnova
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'El costo de envío no puede ser negativo'],
    },

    // Método de envío elegido ('Envío a Domicilio - Zipnova', 'Retiro en Punto / Sucursal', etc.)
    shippingMethod: {
      type: String,
      default: 'standard',
      trim: true,
    },

    // Total final de la orden: (subtotal - discountAmount + shippingCost)
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
        number: { type: String, trim: true, default: 'S/N' },
        floor: { type: String, trim: true },
        apartment: { type: String, trim: true },
        city: { type: String, trim: true },
        province: { type: String, trim: true, default: 'Ciudad Autónoma de Buenos Aires' },
        state: { type: String, trim: true, default: 'Ciudad Autónoma de Buenos Aires' },
        postalCode: { type: String, trim: true, default: '' },
        zipCode: { type: String, trim: true, default: '' },
      },
    },

    // Logística y Envío (Integración Zipnova)
    shipping: {
      carrier: { type: String, trim: true, default: 'Zipnova' },
      trackingNumber: { type: String, trim: true, default: '' },
      zipnovaShipmentId: { type: String, trim: true, default: '' },
      deliveryStatus: {
        type: String,
        enum: ['pending', 'in_transit', 'delivered', 'failed', 'cancelled'],
        default: 'pending',
      },
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

// Middleware pre-validate para auto-generación de orderNumber, cálculo consistente y sincronización
orderSchema.pre('validate', function (next) {
  // 0. Sincronización robusta de dirección de envío y sinónimos (postalCode <-> zipCode, province <-> state, number)
  if (this.customer && this.customer.shippingAddress) {
    const addr = this.customer.shippingAddress;
    const zip = addr.postalCode || addr.zipCode || '';
    addr.postalCode = zip;
    addr.zipCode = zip;

    const prov = addr.province || addr.state || 'Ciudad Autónoma de Buenos Aires';
    addr.province = prov;
    addr.state = prov;

    if (!addr.number && addr.street) {
      const match = String(addr.street).match(/\d+/);
      addr.number = match ? match[0] : 'S/N';
    } else if (!addr.number) {
      addr.number = 'S/N';
    }
  }

  // 1. Auto-generación de orderNumber con formato CQ-AÑO-RANDOM (ej: CQ-2026-784912)
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    this.orderNumber = `CQ-${year}-${randomCode}`;
  }

  // 2. Si subtotal no fue establecido explícitamente, calcularlo desde items
  if (this.subtotal === undefined && Array.isArray(this.items)) {
    this.subtotal = this.items.reduce(
      (acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );
  }

  // 3. Sincronizar shippingCost y shipping.cost
  if (this.shippingCost === undefined) {
    this.shippingCost = Number(this.shipping?.cost) || 0;
  }
  if (this.shipping) {
    this.shipping.cost = this.shippingCost;
  }

  // 4. Si totalAmount no fue establecido, calcularlo como subtotal - discountAmount + shippingCost
  if (this.totalAmount === undefined && this.subtotal !== undefined) {
    this.totalAmount = Math.max(0, (this.subtotal - (this.discountAmount || 0)) + (this.shippingCost || 0));
  }

  // 5. Normalización de payment y retrocompatibilidad con paymentMethod
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

  // Sincronizar paymentMethod en formato compatible
  this.paymentMethod = this.payment.method === 'transfer' ? 'TRANSFERENCIA' : 'MERCADO_PAGO';

  // 6. Normalizar status si viene en mayúsculas
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
