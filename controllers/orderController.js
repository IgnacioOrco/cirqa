import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const getMpClient = () => {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MP_ACCESS_TOKEN no está configurado en las variables de entorno.');
  }
  return new MercadoPagoConfig({ accessToken: token });
};

/**
 * @desc   Crear orden en BD y generar Preference de Mercado Pago (Checkout Pro)
 * @route  POST /api/orders/create-preference
 * @access Público
 */
export const createPreference = async (req, res, next) => {
  try {
    const { customer, items, shippingCost = 0 } = req.body;

    if (!customer || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Datos de cliente y productos requeridos.' });
    }

    // Validar disponibilidad de stock y obtener precios actualizados
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const rawId = item.product || item.productId || item._id || item.id;
      let product = null;
      if (rawId) {
        product = await Product.findById(rawId).catch(() => null);
      }
      if (!product && (item.modelCode || item.name)) {
        product = await Product.findOne({
          $or: [
            { modelCode: item.modelCode || "" },
            { name: item.name || "" }
          ]
        });
      }
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `El producto ${item.name || ''} no está disponible.`,
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${product.name}. Disponibles: ${product.stock}`,
        });
      }

      calculatedTotal += product.price * item.quantity;
      validatedItems.push({
        product: product._id,
        name: product.name,
        modelCode: product.modelCode,
        price: product.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl || product.image_url || '',
        prescriptionDetails: item.prescriptionDetails || null,
      });
    }

    calculatedTotal += Number(shippingCost);

    // 1. Guardar la orden con estado 'pending'
    const newOrder = await Order.create({
      customer,
      items: validatedItems,
      totalAmount: calculatedTotal,
      shippingCost,
      status: 'pending',
    });

    // 2. Preparar los items para Mercado Pago
    const clientUrl = process.env.CLIENT_URL || 'https://cirqa.com.ar';
    const apiUrl = process.env.API_URL || 'https://api.cirqa.com.ar';

    const preferenceItems = validatedItems.map((item) => ({
      id: item.modelCode,
      title: `${item.name} (${item.modelCode})`,
      unit_price: Number(item.price),
      quantity: Number(item.quantity),
      currency_id: 'ARS',
      picture_url: item.imageUrl.startsWith('http') ? item.imageUrl : `${apiUrl}${item.imageUrl}`,
    }));

    if (shippingCost > 0) {
      preferenceItems.push({
        id: 'SHIPPING',
        title: 'Costo de Envío',
        unit_price: Number(shippingCost),
        quantity: 1,
        currency_id: 'ARS',
      });
    }

    // 3. Crear preferencia en Mercado Pago
    const client = getMpClient();
    const preference = new Preference(client);

    const preferenceResponse = await preference.create({
      body: {
        items: preferenceItems,
        payer: {
          name: customer.name,
          email: customer.email,
          phone: { number: customer.phone },
          identification: { type: 'DNI', number: customer.dni },
          address: {
            street_name: customer.shippingAddress.street,
            street_number: Number(customer.shippingAddress.number) || 0,
            zip_code: customer.shippingAddress.postalCode,
          },
        },
        back_urls: {
          success: `${clientUrl}/checkout/success?orderId=${newOrder._id}`,
          failure: `${clientUrl}/checkout/failure?orderId=${newOrder._id}`,
          pending: `${clientUrl}/checkout/pending?orderId=${newOrder._id}`,
        },
        auto_return: 'approved',
        notification_url: `${apiUrl}/api/payments/webhook`,
        external_reference: newOrder._id.toString(),
        statement_descriptor: 'CIRQA EYEWEAR',
      },
    });

    // 4. Asociar preferenceId a la orden
    newOrder.payment.preferenceId = preferenceResponse.id;
    await newOrder.save();

    res.status(200).json({
      success: true,
      orderId: newOrder._id,
      orderNumber: newOrder.orderNumber,
      preferenceId: preferenceResponse.id,
      initPoint: preferenceResponse.init_point,
      sandboxInitPoint: preferenceResponse.sandbox_init_point,
    });
  } catch (error) {
    console.error('[ORDER/MP ERROR]:', error);
    next(error);
  }
};

/**
 * @desc   Webhook receptor de notificaciones de Mercado Pago
 * @route  POST /api/payments/webhook
 * @access Público
 */
export const handleWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;
    const queryType = req.query.type || req.query.topic;
    const paymentId = (data && data.id) || req.query['data.id'] || req.query.id;

    // Responder 200 inmediatamente para cumplir protocolo MP
    res.status(200).send('OK');

    if ((type === 'payment' || queryType === 'payment') && paymentId) {
      const client = getMpClient();
      const paymentApi = new Payment(client);
      const paymentInfo = await paymentApi.get({ id: paymentId });

      if (!paymentInfo || !paymentInfo.external_reference) return;

      const order = await Order.findById(paymentInfo.external_reference);
      if (!order) return;

      // Actualizar datos del pago
      order.payment.paymentId = paymentInfo.id.toString();
      order.payment.status = paymentInfo.status;
      order.payment.statusDetail = paymentInfo.status_detail;
      order.payment.paymentType = paymentInfo.payment_type_id;

      if (paymentInfo.status === 'approved' && order.status !== 'paid') {
        order.status = 'paid';
        order.payment.dateApproved = new Date(paymentInfo.date_approved || Date.now());

        // Descontar stock atómicamente de cada producto
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
          });
        }
      } else if (['rejected', 'cancelled'].includes(paymentInfo.status)) {
        order.status = 'failed';
      }

      await order.save();
    }
  } catch (error) {
    console.error('[WEBHOOK ERROR]:', error.message);
  }
};

/**
 * @desc   Listar órdenes para el administrador
 * @route  GET /api/orders
 * @access Admin
 */
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Detalle de una orden por ID
 * @route  GET /api/orders/:id
 * @access Público / Admin
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Actualizar estado logístico o de entrega
 * @route  PATCH /api/orders/:id/shipping
 * @access Admin
 */
export const updateOrderShipping = async (req, res, next) => {
  try {
    const { status, carrier, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
    }

    if (status) order.status = status;
    if (carrier) order.shipping.carrier = carrier;
    if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
    if (status === 'shipped' && !order.shipping.shippedAt) {
      order.shipping.shippedAt = new Date();
    }

    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
