import { MercadoPagoConfig, Preference } from 'mercadopago';
import Order from '../models/Order.js';

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

    // 1. Buscar la orden y poblar la referencia si fuera necesario
    const order = await Order.findById(orderId).populate('items.product', 'name basePrice images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la orden con ID: ${orderId}`,
      });
    }

    // Validar estado de la orden
    if (order.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'La orden ya ha sido pagada previamente.',
      });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'La orden se encuentra cancelada.',
      });
    }

    // 2. Mapear los items de la orden al formato requerido por el SDK de Mercado Pago
    const mpItems = order.items.map((item) => {
      // Tomar imagen si está disponible en el producto poblado
      const pictureUrl = item.product?.images?.[0] || undefined;

      return {
        id: item.product?._id ? item.product._id.toString() : item.product?.toString(),
        title: item.name,
        description: `Armazón CIRQA: ${item.name}`,
        picture_url: pictureUrl,
        quantity: Number(item.quantity),
        unit_price: Number(item.price),
        currency_id: order.currency || 'ARS',
      };
    });

    // 3. URLs de retorno y Webhooks
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;

    // 4. Instanciar Preference usando el SDK oficial v2
    const client = getMercadoPagoClient();
    const preference = new Preference(client);

    // 5. Construir cuerpo de la preferencia
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
          success: `${clientUrl}/checkout/success?order_id=${order._id}`,
          failure: `${clientUrl}/checkout/failure?order_id=${order._id}`,
          pending: `${clientUrl}/checkout/pending?order_id=${order._id}`,
        },
        auto_return: 'approved',
        // external_reference vincula el pago de Mercado Pago con el ID de la orden en MongoDB
        external_reference: order._id.toString(),
        notification_url: `${apiUrl}/api/webhooks/mercadopago`,
        statement_descriptor: 'CIRQA',
        metadata: {
          order_id: order._id.toString(),
          customer_email: order.customer?.email,
        },
      },
    };

    // 6. Crear la preferencia en Mercado Pago
    const response = await preference.create(preferenceData);

    // 7. Guardar el ID de la preferencia en el campo gateway_id de la orden
    order.gateway_id = response.id;
    order.paymentMethod = 'MERCADO_PAGO';
    await order.save();

    return res.status(200).json({
      success: true,
      data: {
        preferenceId: response.id,
        init_point: response.init_point, // URL para Checkout Pro (Producción)
        sandbox_init_point: response.sandbox_init_point, // URL para Checkout Pro (Pruebas)
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

    // Construir URL pública para acceso al comprobante
    const relativeUrl = `/uploads/receipts/${req.file.filename}`;
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fullReceiptUrl = `${apiUrl}${relativeUrl}`;

    order.receipt_url = fullReceiptUrl;
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

