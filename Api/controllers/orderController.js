import mongoose from 'mongoose';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

/**
 * Inicializar cliente de Mercado Pago con el Access Token
 */
const getMercadoPagoClient = () => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no está definido en las variables de entorno.');
  }
  return new MercadoPagoConfig({ accessToken });
};

/**
 * @desc    Crear una preferencia de pago en Mercado Pago para una orden existente
 * @route   POST /api/orders/:orderId/preference
 * @access  Público / Autenticado
 */
export const createOrderPreference = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('items.product', 'name basePrice images stock');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la orden con ID: ${orderId}`,
      });
    }

    const normStatus = (order.status || '').toLowerCase();
    if (normStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'La orden ya ha sido pagada previamente.',
      });
    }

    if (normStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'La orden se encuentra cancelada.',
      });
    }

    const mpItems = order.items.map((item) => {
      const pictureUrl = item.product?.images?.[0]?.url || item.image || undefined;

      return {
        id: item.product?._id ? item.product._id.toString() : String(item.modelCode || 'cirqa-item'),
        title: item.name,
        description: `Armazón CIRQA: ${item.name}`,
        picture_url: pictureUrl,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.price),
        currency_id: order.currency || 'ARS',
      };
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;

    const client = getMercadoPagoClient();
    const preference = new Preference(client);

    const preferenceData = {
      body: {
        items: mpItems,
        payer: {
          name: order.customer?.name || 'Cliente CIRQA',
          email: order.customer?.email,
          phone: order.customer?.phone ? { number: order.customer.phone } : undefined,
          identification: order.customer?.dni
            ? {
                type: 'DNI',
                number: String(order.customer.dni),
              }
            : undefined,
          address: order.customer?.shippingAddress
            ? {
                street_name: order.customer.shippingAddress.street || '',
                zip_code: order.customer.shippingAddress.zipCode || '',
              }
            : undefined,
        },
        back_urls: {
          success: `${clientUrl}/checkout/success?orderId=${order._id}`,
          failure: `${clientUrl}/checkout/failure?orderId=${order._id}`,
          pending: `${clientUrl}/checkout/pending?orderId=${order._id}`,
        },
        auto_return: 'approved',
        external_reference: order._id.toString(),
        notification_url: `${apiUrl}/api/webhooks/mercadopago`,
        statement_descriptor: 'CIRQA',
        metadata: {
          order_id: order._id.toString(),
          order_number: order.orderNumber,
          customer_email: order.customer?.email,
        },
      },
    };

    const response = await preference.create(preferenceData);

    order.gateway_id = response.id;
    order.payment = {
      method: 'mercadopago',
      provider: 'mercadopago',
    };
    order.paymentMethod = 'MERCADO_PAGO';
    await order.save();

    return res.status(200).json({
      success: true,
      data: {
        preferenceId: response.id,
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point,
      },
    });
  } catch (error) {
    console.error('[MercadoPago] Error al crear preferencia:', error);
    next(error);
  }
};

/**
 * @desc    Subir comprobante de transferencia bancaria para una orden
 * @route   POST /api/orders/:orderId/receipt
 * @access  Público
 */
export const uploadOrderReceipt = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha adjuntado ningún archivo.',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la orden con ID: ${orderId}`,
      });
    }

    const relativeUrl = `/uploads/receipts/${req.file.filename}`;
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fullReceiptUrl = `${apiUrl}${relativeUrl}`;

    order.receipt_url = fullReceiptUrl;
    order.payment = {
      method: 'transfer',
      provider: 'manual',
    };
    order.paymentMethod = 'TRANSFERENCIA';
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Comprobante de transferencia subido correctamente.',
      data: {
        orderId: order._id,
        receiptUrl: order.receipt_url,
        fileName: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear orden con soporte dual: Mercado Pago Checkout Pro o Transferencia Bancaria
 * @route   POST /api/orders/create-preference
 * @access  Público
 */
export const createPreference = async (req, res, next) => {
  try {
    const {
      customer,
      items,
      shippingCost = 0,
      paymentMethod: rawPaymentMethod,
      payment: rawPayment,
    } = req.body;

    // 1. Validaciones básicas de entrada
    if (!customer || !customer.email || !customer.name) {
      return res.status(400).json({
        success: false,
        message: 'Los datos del comprador (nombre y email) son obligatorios.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El pedido debe incluir al menos un producto.',
      });
    }

    // Determinar si es transferencia o mercadopago
    const requestedMethod = String(
      rawPaymentMethod || rawPayment?.method || 'mercadopago'
    ).toLowerCase();
    const isTransfer = requestedMethod.includes('transfer');
    const paymentMethod = isTransfer ? 'transfer' : 'mercadopago';

    // 2. Validación Robusta de Productos en MongoDB
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const rawId = item.productId || item._id || item.product || item.id;
      let product = null;

      // 1. Búsqueda por ObjectId si es válido
      if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
        product = await Product.findById(rawId);
      }

      // 2. Fallback por modelCode, slug o nombre si no se encontró por ID
      if (!product && (item.modelCode || item.slug || item.id || rawId || item.name)) {
        const lookupCode = (item.modelCode || item.slug || item.id || rawId || '')
          .toString()
          .split('_')[0]
          .trim();

        const cleanLookup = lookupCode.replace(/\s+/g, '-');
        const regexPattern = lookupCode ? lookupCode.replace(/[- ]/g, '[- ]?') : '';

        const orConditions = [];
        if (regexPattern) {
          orConditions.push({ modelCode: new RegExp(`^${regexPattern}$`, 'i') });
          orConditions.push({ name: new RegExp(`^${regexPattern}$`, 'i') });
        }
        if (lookupCode) {
          orConditions.push({ slug: lookupCode.toLowerCase() });
        }
        if (cleanLookup) {
          orConditions.push({ slug: cleanLookup.toLowerCase() });
        }
        if (item.name) {
          orConditions.push({ name: new RegExp(`^${item.name.trim()}$`, 'i') });
        }

        if (orConditions.length > 0) {
          product = await Product.findOne({ $or: orConditions });
        }
      }

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `El producto ${item.name || item.modelCode || 'solicitado'} no existe en la base de datos.`,
        });
      }

      if (product.isActive === false) {
        return res.status(400).json({
          success: false,
          message: `El producto ${product.name} se encuentra momentáneamente pausado.`,
        });
      }

      const reqQty = Number(item.quantity) || 1;
      if (product.stock < reqQty) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${product.name}. Disponibles: ${product.stock}`,
        });
      }

      const unitPrice = Number(product.price ?? product.basePrice ?? item.price ?? 0);
      calculatedSubtotal += unitPrice * reqQty;

      validatedItems.push({
        product: product._id,
        name: product.name,
        modelCode: product.modelCode,
        price: unitPrice,
        quantity: reqQty,
        filter: item.filter || 'Día (84%)',
        variantKey: item.variantKey || undefined,
        variantName: item.variantName || undefined,
        variantSubtitle: item.variantSubtitle || undefined,
        prescription: item.prescription || undefined,
        image: item.image || product.images?.[0]?.url || undefined,
      });
    }

    // 3. Subtotal estricto calculado desde los precios oficiales de la base de datos
    const subtotal = calculatedSubtotal;
    const numericShippingCost = Number(shippingCost) || 0;
    const shippingMethodTitle = String(
      req.body.shippingMethod || req.body.shipping?.name || 'standard'
    ).trim();

    // 4. Lógica de Descuento: 15% OFF EXCLUSIVO sobre el valor de productos para Transferencia Bancaria
    // El cálculo del 15% se efectúa estrictamente sobre el subtotal de productos, NUNCA sobre el costo de envío.
    const discountAmount = isTransfer ? Math.round(subtotal * 0.15) : 0;
    const totalAmount = (subtotal - discountAmount) + numericShippingCost;

    const year = new Date().getFullYear();
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `CQ-${year}-${randomCode}`;

    // Normalizar datos del comprador y dirección de envío para garantizar compatibilidad total con Mongoose
    const rawAddr = customer.shippingAddress || {};
    const streetRaw = String(rawAddr.street || '').trim();
    const streetNumber = String(rawAddr.number || '').trim() || (streetRaw.match(/\d+/) ? streetRaw.match(/\d+/)[0] : 'S/N');
    const zip = String(rawAddr.postalCode || rawAddr.zipCode || '').trim() || 'C1000';
    const prov = String(rawAddr.province || rawAddr.state || 'Ciudad Autónoma de Buenos Aires').trim();
    const city = String(rawAddr.city || '').trim() || prov;

    const normalizedCustomer = {
      name: String(customer.name || '').trim(),
      email: String(customer.email || '').trim().toLowerCase(),
      phone: String(customer.phone || '').trim(),
      dni: String(customer.dni || '').trim(),
      shippingAddress: {
        street: streetRaw,
        number: streetNumber,
        floor: rawAddr.floor || undefined,
        apartment: rawAddr.apartment || undefined,
        city: city,
        province: prov,
        state: prov,
        postalCode: zip,
        zipCode: zip,
      },
    };

    // 5. Crear el documento de la Orden en MongoDB con los ítems validados
    const order = new Order({
      orderNumber,
      customer: normalizedCustomer,
      items: validatedItems,
      subtotal,
      discountAmount,
      shippingCost: numericShippingCost,
      shippingMethod: shippingMethodTitle,
      totalAmount,
      shipping: {
        carrier: req.body.shipping?.carrier || 'Zipnova',
        trackingNumber: '',
        zipnovaShipmentId: '',
        deliveryStatus: 'pending',
        cost: numericShippingCost,
        status: 'PENDIENTE',
      },
      payment: {
        method: paymentMethod,
        provider: isTransfer ? 'manual' : 'mercadopago',
      },
      paymentMethod: isTransfer ? 'TRANSFERENCIA' : 'MERCADO_PAGO',
      status: 'pending',
    });

    await order.save();

    // =========================================================================
    // FLUJO A: TRANSFERENCIA BANCARIA (Con 15% OFF, reserva de stock y retorno)
    // =========================================================================
    if (isTransfer) {
      // Descontar o reservar stock en MongoDB para evitar sobreventa usando ObjectId garantizado
      for (const vItem of validatedItems) {
        if (vItem.product && mongoose.Types.ObjectId.isValid(vItem.product)) {
          await Product.findByIdAndUpdate(vItem.product, {
            $inc: { stock: -vItem.quantity },
          });
        }
      }

      return res.status(201).json({
        success: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
        isTransfer: true,
        subtotal,
        discountAmount,
        shippingCost: numericShippingCost,
        totalAmount,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          isTransfer: true,
          status: order.status,
          subtotal,
          discountAmount,
          shippingCost: numericShippingCost,
          totalAmount,
        },
      });
    }

    // =========================================================================
    // FLUJO B: MERCADO PAGO CHECKOUT PRO
    // =========================================================================
    let initPoint = '';
    let sandboxInitPoint = '';
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;

    try {
      const client = getMercadoPagoClient();
      const preference = new Preference(client);

      const mpItems = validatedItems.map((vItem) => ({
        id: String(vItem.product || vItem.modelCode || 'cirqa-item'),
        title: `${vItem.name}${vItem.filter ? ` · Cristal ${vItem.filter}` : ''}`,
        description: `Armazón óptico CIRQA ${vItem.name}`,
        picture_url: vItem.image || undefined,
        quantity: vItem.quantity,
        unit_price: vItem.price,
        currency_id: 'ARS',
      }));

      if (numericShippingCost > 0) {
        mpItems.push({
          id: 'shipping-cost',
          title: `Costo de Envío (${shippingMethodTitle || 'Zipnova'})`,
          quantity: 1,
          unit_price: numericShippingCost,
          currency_id: 'ARS',
        });
      }

      const preferenceData = {
        body: {
          items: mpItems,
          payer: {
            name: normalizedCustomer.name,
            email: normalizedCustomer.email,
            phone: normalizedCustomer.phone ? { number: normalizedCustomer.phone } : undefined,
            identification: normalizedCustomer.dni
              ? { type: 'DNI', number: String(normalizedCustomer.dni) }
              : undefined,
            address: normalizedCustomer.shippingAddress
              ? {
                  street_name: normalizedCustomer.shippingAddress.street || '',
                  zip_code: normalizedCustomer.shippingAddress.postalCode || normalizedCustomer.shippingAddress.zipCode || '',
                }
              : undefined,
          },
          back_urls: {
            success: `${clientUrl}/checkout/success?orderId=${order._id}`,
            failure: `${clientUrl}/checkout/failure?orderId=${order._id}`,
            pending: `${clientUrl}/checkout/pending?orderId=${order._id}`,
          },
          auto_return: 'approved',
          external_reference: order._id.toString(),
          notification_url: `${apiUrl}/api/webhooks/mercadopago`,
          statement_descriptor: 'CIRQA',
          metadata: {
            order_id: order._id.toString(),
            order_number: order.orderNumber,
            customer_email: normalizedCustomer.email,
          },
        },
      };

      const response = await preference.create(preferenceData);
      order.gateway_id = response.id;
      await order.save();

      initPoint = response.init_point;
      sandboxInitPoint = response.sandbox_init_point;
    } catch (mpError) {
      console.warn(
        '[MercadoPago Warning] Creación con simulación de entorno local:',
        mpError.message
      );
      initPoint = `${clientUrl}/checkout/success?orderId=${order._id}&simulated=true`;
      sandboxInitPoint = `${clientUrl}/checkout/success?orderId=${order._id}&simulated=true`;
    }

    return res.status(201).json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      initPoint,
      sandboxInitPoint,
      subtotal,
      discountAmount: 0,
      shippingCost: numericShippingCost,
      totalAmount,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        initPoint,
        sandboxInitPoint,
        subtotal,
        discountAmount: 0,
        shippingCost: numericShippingCost,
        totalAmount,
      },
    });
  } catch (error) {
    console.error('[createPreference Error]:', error);
    next(error);
  }
};

/**
 * @desc    Actualizar estado de una orden (Admin) - Confirmar Pago de Transferencia
 * @route   PATCH /api/orders/:orderId/status
 * @access  Privado (Admin)
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'El nuevo estado (status) es requerido.',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la orden con ID: ${orderId}`,
      });
    }

    const previousStatus = (order.status || '').toLowerCase();
    const newStatusNormalized = String(status).toLowerCase();

    // Si pasa a 'paid' y antes no estaba paga, asegurar que el stock esté debidamente descontado
    if (newStatusNormalized === 'paid' && previousStatus !== 'paid') {
      const isTransfer =
        order.payment?.method === 'transfer' ||
        order.paymentMethod === 'TRANSFERENCIA';

      // Si no fue descontado previamente (por ejemplo si la orden era mercadopago pendiente que se cobró manual)
      if (!isTransfer) {
        for (const item of order.items) {
          if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: -(Number(item.quantity) || 1) },
            });
          }
        }
      }
    }

    order.status = newStatusNormalized;
    if (note) {
      order.notes = order.notes ? `${order.notes}\n${note}` : note;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Estado de la orden ${order.orderNumber} actualizado a "${newStatusNormalized}".`,
      data: order,
      order,
    });
  } catch (error) {
    console.error('[updateOrderStatus Error]:', error);
    next(error);
  }
};

/**
 * @desc    Obtener todas las órdenes (Admin)
 * @route   GET /api/orders
 * @access  Privado (Admin)
 */
export const getOrders = async (req, res, next) => {
  try {
    const { status, paymentMethod } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status.toLowerCase();
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      const isTransfer = paymentMethod.toLowerCase().includes('transfer');
      if (isTransfer) {
        filter.$or = [
          { 'payment.method': 'transfer' },
          { paymentMethod: 'TRANSFERENCIA' },
        ];
      } else {
        filter.$or = [
          { 'payment.method': 'mercadopago' },
          { paymentMethod: 'MERCADO_PAGO' },
        ];
      }
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener una orden por ID o orderNumber
 * @route   GET /api/orders/:orderId
 * @access  Público / Admin
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    let order;

    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    } else {
      order = await Order.findOne({ orderNumber: orderId });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la orden con ID o código: ${orderId}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
      ...order.toObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar logística y estado de envío de una orden
 * @route   PATCH /api/orders/:orderId/shipping
 * @access  Privado (Admin)
 */
export const updateOrderShipping = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { carrier, trackingNumber, status, shippingStatus } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la orden con ID: ${orderId}`,
      });
    }

    if (!order.shipping) {
      order.shipping = {};
    }

    const effectiveShippingStatus = shippingStatus || status;

    if (carrier !== undefined) order.shipping.carrier = carrier;
    if (trackingNumber !== undefined) order.shipping.trackingNumber = trackingNumber;
    if (effectiveShippingStatus !== undefined) order.shipping.status = effectiveShippingStatus;

    if (effectiveShippingStatus) {
      const norm = String(effectiveShippingStatus).toUpperCase();
      if (norm === 'ENVIADO' || norm === 'SHIPPED') {
        order.status = 'shipped';
        order.shipping.shippedAt = new Date();
      } else if (norm === 'ENTREGADO' || norm === 'DELIVERED') {
        order.status = 'delivered';
      }
    } else if (status) {
      const norm = String(status).toLowerCase();
      if (norm === 'shipped' || norm === 'delivered' || norm === 'pending') {
        order.status = norm;
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Logística de envío actualizada correctamente.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
