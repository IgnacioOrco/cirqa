import { quoteShipping, calculatePackageSpecs } from '../services/zipnovaService.js';

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
