import { quoteShipping, calculatePackageSpecs } from '../services/zipnovaService.js';
import Order from '../models/Order.js';

/**
 * @desc    Cotizar tarifas de envío mediante Zipnova Logistics (con fallback por zona)
 * @route   POST /api/shipping/quote
 * @access  Público
 */
export const quoteShippingController = async (req, res, next) => {
  try {
    const { postalCode, items = [] } = req.body;

    if (!postalCode) {
      return res.status(400).json({
        success: false,
        message: 'El código postal de destino es requerido para cotizar el envío.',
      });
    }

    const cleanZip = String(postalCode).trim().replace(/\D/g, '');
    if (!cleanZip || cleanZip.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Introduce un código postal argentino válido (ej. 1425).',
      });
    }

    const options = await quoteShipping({ postalCode: cleanZip, items });
    const pkgSpecs = calculatePackageSpecs(items);

    return res.status(200).json({
      success: true,
      postalCode: cleanZip,
      package: pkgSpecs,
      options,
    });
  } catch (error) {
    console.error('[Shipping Quote Error]:', error);
    next(error);
  }
};

/**
 * @desc    Servir vista imprimible de etiqueta de despacho oficial Shipnova / Zipnova
 * @route   GET /api/shipping/label/:orderId
 * @access  Público / Admin
 */
export const getShippingLabelController = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    let order = null;
    if (orderId && orderId.length === 24) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({
        $or: [{ orderNumber: orderId }, { 'shipping.trackingNumber': orderId }],
      });
    }

    const carrier = order?.shipping?.carrier || 'Zipnova Logistics';
    const tracking = order?.shipping?.trackingNumber || `ZN-AR-${Date.now().toString().slice(-6)}`;
    const orderNum = order?.orderNumber || 'CQ-2026-ENVIOS';
    const customer = order?.customer || {
      name: 'Cliente CIRQA',
      phone: '01125073598',
      shippingAddress: {
        street: 'Av. Corrientes 1234',
        number: '1234',
        city: 'CABA',
        province: 'Ciudad Autónoma de Buenos Aires',
        postalCode: '1043',
      },
    };
    const addr = customer.shippingAddress || {};
    const fullStreet = `${addr.street || ''} ${addr.number || ''} ${addr.floor ? `Piso ${addr.floor}` : ''} ${addr.apartment ? `Depto ${addr.apartment}` : ''}`.trim();
    const cityProv = `${addr.city || ''}, ${addr.province || addr.state || ''} (CP ${addr.postalCode || addr.zipCode || ''})`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Etiqueta de Envío - ${orderNum} - ${carrier}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f5f5f7;
      color: #111;
      display: flex;
      justify-content: center;
      padding: 24px;
    }
    .label-container {
      width: 100mm;
      min-height: 150mm;
      background: #fff;
      border: 2px solid #111;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #111;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
    .carrier { font-size: 11px; font-weight: 700; background: #111; color: #fff; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
    .barcode-section {
      text-align: center;
      padding: 14px 0;
      border-bottom: 2px dashed #999;
      margin-bottom: 12px;
    }
    .barcode {
      display: inline-flex;
      align-items: flex-end;
      justify-content: center;
      gap: 3px;
      height: 48px;
      margin-bottom: 6px;
    }
    .barcode span { background: #111; width: 3px; border-radius: 1px; }
    .barcode span.w-thin { width: 2px; }
    .barcode span.w-thick { width: 5px; }
    .tracking-code { font-family: monospace; font-size: 14px; font-weight: 800; letter-spacing: 2px; }
    .section-title { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #666; margin-bottom: 3px; }
    .address-box {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 10px;
      font-size: 12px;
      line-height: 1.4;
    }
    .recipient-name { font-size: 14px; font-weight: 700; color: #000; margin-bottom: 2px; }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 11px;
      border-top: 1px solid #eee;
      padding-top: 8px;
      margin-top: 8px;
    }
    .btn-print {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #111;
      color: #fff;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    @media print {
      body { background: #fff; padding: 0; }
      .btn-print { display: none; }
      .label-container { border: 2px solid #000; box-shadow: none; width: 100%; height: 100%; }
    }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir Etiqueta</button>

  <div class="label-container">
    <div>
      <div class="header">
        <div class="brand">CIRQA</div>
        <div class="carrier">${carrier}</div>
      </div>

      <div class="barcode-section">
        <div class="barcode">
          <span style="height: 100%;" class="w-thick"></span>
          <span style="height: 70%;" class="w-thin"></span>
          <span style="height: 100%;"></span>
          <span style="height: 90%;" class="w-thick"></span>
          <span style="height: 60%;" class="w-thin"></span>
          <span style="height: 100%;"></span>
          <span style="height: 80%;" class="w-thick"></span>
          <span style="height: 95%;"></span>
          <span style="height: 100%;" class="w-thin"></span>
          <span style="height: 75%;" class="w-thick"></span>
          <span style="height: 100%;"></span>
          <span style="height: 85%;" class="w-thin"></span>
          <span style="height: 100%;" class="w-thick"></span>
        </div>
        <div class="tracking-code">${tracking}</div>
      </div>

      <div class="address-box" style="background: #fafafa;">
        <div class="section-title">DESTINATARIO (ENTREGA DOMICILIO)</div>
        <div class="recipient-name">${customer.name || 'Cliente CIRQA'}</div>
        <div>${fullStreet}</div>
        <div><strong>${cityProv}</strong></div>
        ${customer.phone ? `<div>Tel: ${customer.phone}</div>` : ''}
        ${customer.dni ? `<div>DNI: ${customer.dni}</div>` : ''}
      </div>

      <div class="address-box">
        <div class="section-title">REMITENTE</div>
        <div><strong>CIRQA S.A.S.</strong> (Óptica de Precisión)</div>
        <div>Palermo, Gurruchaga 1850</div>
        <div>CABA, Ciudad Autónoma de Buenos Aires (CP 1425)</div>
        <div>Tel: +54 9 11 2507-3598</div>
      </div>
    </div>

    <div>
      <div class="meta-grid">
        <div><strong>Pedido:</strong> ${orderNum}</div>
        <div><strong>Bultos:</strong> 1 paquete (${order?.items?.length || 1} un.)</div>
        <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}</div>
        <div><strong>Servicio:</strong> Estándar Prioritario</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    console.error('[Get Shipping Label Error]:', error);
    next(error);
  }
};
