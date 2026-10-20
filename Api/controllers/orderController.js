import mongoose from 'mongoose';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { calculateCouponDiscount } from './couponController.js';
import zipnovaService, { createShipment } from '../services/zipnovaService.js';

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

    const couponDiscount = Number(order.couponDiscount || 0);
    const netProductsTotal = Math.max(0, Number(order.subtotal || 0) - couponDiscount);

    const mpItems = couponDiscount > 0
      ? [
          {
            id: 'cirqa-order-net',
            title: `Pedido CIRQA (${order.items.length} producto${order.items.length > 1 ? 's' : ''})`,
            description: order.items.map((i) => `${i.quantity}x ${i.name}`).join(', '),
            quantity: 1,
            unit_price: netProductsTotal,
            currency_id: order.currency || 'ARS',
          },
        ]
      : order.items.map((item) => {
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
        payment_methods: {
          installments: 6,
          default_installments: 6,
        },
        shipments: {
          cost: 0,
          mode: 'not_specified',
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

    // Determinar si es transferencia o mercadopago verificando TODAS las posibles ubicaciones en req.body
    const rawMethod = req.body.paymentMethod || req.body.payment?.method || req.body.payment?.provider || 'mercadopago';
    const isTransfer = rawMethod.toString().toLowerCase().includes('transfer');
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
    // Normalizar datos del comprador y dirección de envío para garantizar compatibilidad total con Mongoose
    const rawAddr = customer.shippingAddress || {};
    const streetRaw = String(rawAddr.street || '').trim();
    const streetNumber = String(rawAddr.number || '').trim() || (streetRaw.match(/\d+/) ? streetRaw.match(/\d+/)[0] : 'S/N');
    const zip = String(rawAddr.postalCode || rawAddr.zipCode || '').trim() || 'C1000';
    const prov = String(rawAddr.province || rawAddr.state || 'Ciudad Autónoma de Buenos Aires').trim();
    const city = String(rawAddr.city || '').trim() || prov;

    // Helper de detección estricta de CABA (CABA siempre tiene costo $0 y carrier Motomensajería)
    const checkIsCABA = (cp, province) => {
      const postal = parseInt(cp, 10);
      const isPostalCABA = !isNaN(postal) && postal >= 1000 && postal <= 1499;
      const isProvCABA = (province || '').toLowerCase().includes('caba') || 
                         (province || '').toLowerCase().includes('autónoma') || 
                         (province || '').toLowerCase().includes('capital');
      return isPostalCABA || isProvCABA;
    };

    const isDestCABA = checkIsCABA(zip, prov);
    // Envío 100% bonificado para clientes a todo el país ($0 costo final al comprador)
    const numericShippingCost = 0;
    let shippingCarrier = isDestCABA ? 'Motomensajería' : (req.body.shipping?.carrier || 'Correo Andreani / OCA');
    let shippingServiceType = isDestCABA ? 'express_caba_24h' : (req.body.shipping?.service || req.body.shipping?.serviceType || 'standard');
    let shippingMethodTitle = isDestCABA
      ? 'Envío Gratis CABA · Motomensajería Express'
      : (String(req.body.shippingMethod || req.body.shipping?.name || 'Envío Bonificado a todo el país · Correo Andreani / OCA').trim());

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

    // 4. Validación y cálculo de Cupón de Descuento
    const rawCouponCode = req.body.couponCode || req.body.coupon;
    let appliedCoupon = null;
    let couponDiscount = 0;

    if (rawCouponCode && typeof rawCouponCode === 'string') {
      const cleanCode = rawCouponCode.trim().toUpperCase();
      const foundCoupon = await Coupon.findOne({ code: cleanCode });
      if (foundCoupon) {
        const calcResult = calculateCouponDiscount(foundCoupon, validatedItems, subtotal, normalizedCustomer.email);
        if (calcResult.valid && calcResult.discountAmount > 0) {
          appliedCoupon = foundCoupon;
          couponDiscount = calcResult.discountAmount;
        }
      }
    }

    // 5. Lógica de Descuento: Transferencia Bancaria (15% OFF) y Acumulación
    const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);
    let transferDiscount = 0;

    if (isTransfer) {
      if (!appliedCoupon || appliedCoupon.combinableWithTransfer !== false) {
        transferDiscount = Math.round(subtotalAfterCoupon * 0.15);
      }
    }

    const discountAmount = Math.min(subtotal, couponDiscount + transferDiscount);
    const totalAmount = Math.max(0, subtotal - discountAmount);

    const year = new Date().getFullYear();
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `CQ-${year}-${randomCode}`;

    // 6. Crear el documento de la Orden en MongoDB con los ítems validados
    const order = new Order({
      orderNumber,
      customer: normalizedCustomer,
      items: validatedItems,
      subtotal,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      couponDiscount,
      transferDiscount,
      discountAmount,
      shippingCost: numericShippingCost,
      shippingMethod: shippingMethodTitle,
      totalAmount,
      shipping: {
        carrier: shippingCarrier,
        service: shippingServiceType,
        trackingNumber: '',
        zipnovaShipmentId: '',
        labelUrl: '',
        shippedAt: null,
        deliveryStatus: 'pending',
        cost: numericShippingCost,
        status: 'PENDIENTE',
      },
      payment: {
        method: paymentMethod,
        provider: isTransfer ? 'transfer' : 'mercadopago',
        status: 'pending',
        preferenceId: '',
        paymentId: '',
        dateApproved: null,
      },
      paymentMethod: isTransfer ? 'TRANSFERENCIA' : 'MERCADO_PAGO',
      status: 'pending',
    });

    await order.save();

    // 7. Incrementar uso del cupón y registrar historial
    if (appliedCoupon) {
      appliedCoupon.usedCount = (appliedCoupon.usedCount || 0) + 1;
      if (!Array.isArray(appliedCoupon.usageHistory)) {
        appliedCoupon.usageHistory = [];
      }
      appliedCoupon.usageHistory.push({
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: normalizedCustomer.email,
        discountApplied: couponDiscount,
        usedAt: new Date(),
      });
      await appliedCoupon.save();
    }

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
        couponCode: order.couponCode,
        couponDiscount,
        transferDiscount,
        discountAmount,
        shippingCost: numericShippingCost,
        totalAmount,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          isTransfer: true,
          status: order.status,
          subtotal,
          couponCode: order.couponCode,
          couponDiscount,
          transferDiscount,
          discountAmount,
          shippingCost: numericShippingCost,
          totalAmount,
        },
      });
    }

    // =========================================================================
    // FLUJO B: MERCADO PAGO CHECKOUT PRO (Hasta 6 Cuotas Sin Interés)
    // =========================================================================
    let initPoint = '';
    let sandboxInitPoint = '';
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;

    try {
      const client = getMercadoPagoClient();
      const preference = new Preference(client);

      const netProductsTotal = Math.max(0, subtotal - couponDiscount);
      const preferenceItems = couponDiscount > 0
        ? [
            {
              id: 'cirqa-cart-net',
              title: `Pedido CIRQA (${validatedItems.length} producto${validatedItems.length > 1 ? 's' : ''})`,
              unit_price: netProductsTotal,
              quantity: 1,
              currency_id: 'ARS',
              description: validatedItems.map((item) => `${item.quantity}x ${item.name}${item.filter ? ` (${item.filter})` : ''}`).join(', '),
            },
          ]
        : validatedItems.map((item) => ({
            id: item.product.toString(),
            title: item.name,
            unit_price: Number(item.price),
            quantity: Number(item.quantity),
            currency_id: 'ARS',
            picture_url: item.image || undefined,
            description: `Armazón CIRQA: ${item.name}${item.filter ? ` · Cristal ${item.filter}` : ''}`,
          }));

      const preferencePayload = {
        items: preferenceItems,
        shipments: {
          cost: 0,
          mode: 'not_specified',
        },
        payment_methods: {
          installments: 6,
          default_installments: 6,
        },
        back_urls: {
          success: `${clientUrl}/checkout/success?orderId=${order._id}`,
          failure: `${clientUrl}/checkout/failure?orderId=${order._id}`,
          pending: `${clientUrl}/checkout/pending?orderId=${order._id}`,
        },
        auto_return: 'approved',
        external_reference: order._id.toString(),
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
        notification_url: `${apiUrl}/api/webhooks/mercadopago`,
        statement_descriptor: 'CIRQA',
        metadata: {
          order_id: order._id.toString(),
          order_number: order.orderNumber,
          customer_email: normalizedCustomer.email,
        },
      };

      const response = await preference.create({ body: preferencePayload });
      order.gateway_id = response.id;
      if (!order.payment) order.payment = {};
      order.payment.preferenceId = response.id;
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
      couponCode: order.couponCode,
      couponDiscount,
      transferDiscount,
      discountAmount,
      shippingCost: numericShippingCost,
      totalAmount,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        initPoint,
        sandboxInitPoint,
        subtotal,
        couponCode: order.couponCode,
        couponDiscount,
        transferDiscount,
        discountAmount,
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

      if (!order.payment) order.payment = {};
      order.payment.status = 'paid';
      if (!order.payment.dateApproved) order.payment.dateApproved = new Date();
    }

    // Si pasa a preparación, gestionar despacho (Motomensajería local vs Zipnova nacional)
    if (
      (newStatusNormalized === 'preparacion' || newStatusNormalized === 'preparación') &&
      (!order.shipping?.trackingNumber || !order.shipping?.labelUrl)
    ) {
      try {
        if (!order.shipping) order.shipping = {};

        const isMoto =
          order.shipping.carrier === 'Motomensajería' ||
          (order.shipping.service || '').includes('express_caba') ||
          (order.shippingMethod || '').toLowerCase().includes('motomensajería');

        if (isMoto) {
          const orderNumClean = order.orderNumber
            ? order.orderNumber.replace(/^CQ-/, '')
            : (order._id?.toString().slice(-6).toUpperCase() || 'EXPRESS');
          order.shipping.carrier = 'Motomensajería';
          order.shipping.service = 'express_caba_24h';
          order.shipping.trackingNumber = `MOTO-CQ-${orderNumClean}`;
          order.shipping.status = 'PREPARACION';
        } else {
          // Destino nacional: llamar a Zipnova
          const shipmentData = await createShipment(order);
          if (shipmentData.carrier) order.shipping.carrier = shipmentData.carrier;
          if (shipmentData.service) order.shipping.service = shipmentData.service;
          if (shipmentData.trackingNumber) order.shipping.trackingNumber = shipmentData.trackingNumber;
          if (shipmentData.zipnovaShipmentId) order.shipping.zipnovaShipmentId = shipmentData.zipnovaShipmentId;
          if (shipmentData.labelUrl) order.shipping.labelUrl = shipmentData.labelUrl;
          order.shipping.status = 'PREPARACION';
        }
      } catch (shipErr) {
        console.warn('[Auto-Shipment Notice in updateOrderStatus]:', shipErr.message);
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
      } else if (norm === 'PREPARACION' || norm === 'PROCESSING') {
        // Si no tiene guía ni etiqueta emitida, gestionar despacho
        if (!order.shipping.trackingNumber || !order.shipping.labelUrl) {
          try {
            const isMoto =
              order.shipping?.carrier === 'Motomensajería' ||
              (order.shipping?.service || '').includes('express_caba') ||
              (order.shippingMethod || '').toLowerCase().includes('motomensajería');

            if (isMoto) {
              const orderNumClean = order.orderNumber
                ? order.orderNumber.replace(/^CQ-/, '')
                : (order._id?.toString().slice(-6).toUpperCase() || 'EXPRESS');
              order.shipping.carrier = 'Motomensajería';
              order.shipping.service = 'express_caba_24h';
              order.shipping.trackingNumber = `MOTO-CQ-${orderNumClean}`;
            } else {
              const shipmentData = await createShipment(order);
              if (shipmentData.carrier) order.shipping.carrier = shipmentData.carrier;
              if (shipmentData.service) order.shipping.service = shipmentData.service;
              if (shipmentData.trackingNumber) order.shipping.trackingNumber = shipmentData.trackingNumber;
              if (shipmentData.zipnovaShipmentId) order.shipping.zipnovaShipmentId = shipmentData.zipnovaShipmentId;
              if (shipmentData.labelUrl) order.shipping.labelUrl = shipmentData.labelUrl;
            }
          } catch (shipErr) {
            console.warn('[Auto-Shipment Notice in updateOrderShipping]:', shipErr.message);
          }
        }
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

/**
 * @desc    Emitir despacho logístico mediante Shipnova/Zipnova y generar guía y etiqueta
 * @route   POST /api/orders/:id/generate-shipment
 * @access  Privado (Admin) / Público
 */
export const generateShipment = async (req, res, next) => {
  try {
    const targetId = req.params.id || req.params.orderId;

    const order = await Order.findById(targetId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la orden con ID: ${targetId}`,
      });
    }

    if (!order.shipping) {
      order.shipping = {};
    }

    // 1. Envío local por motomensajería (CABA)
    if (order.shipping.carrier === 'Motomensajería') {
      const motoSuffix = order.orderNumber || order._id.toString().slice(-4);
      order.shipping.trackingNumber = `MOTO-CQ-${motoSuffix}`;
      order.shipping.status = 'PREPARACION';
      order.status = 'preparacion';
      await order.save();

      return res.status(200).json({
        success: true,
        message: 'Envío local por motomensajería generado',
        order,
      });
    }

    // 2. Correo nacional (carrier !== 'Motomensajería')
    const result = await zipnovaService.createShipment(order);
    order.shipping.trackingNumber = result.trackingNumber;
    order.shipping.zipnovaShipmentId = result.shipmentId || result.zipnovaShipmentId;
    order.shipping.labelUrl = result.labelUrl;
    order.shipping.status = 'PREPARACION';
    order.status = 'preparacion';
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Guía de Shipnova emitida con éxito',
      order,
    });
  } catch (error) {
    console.error('[generateShipment Error]:', error);
    next(error);
  }
};

export const generateOrderShipping = generateShipment;

