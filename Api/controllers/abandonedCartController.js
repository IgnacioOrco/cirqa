import crypto from 'node:crypto';
import AbandonedCart from '../models/AbandonedCart.js';

/**
 * @desc    Guardar o actualizar carrito abandonado en estado pending
 * @route   POST /api/abandoned-carts
 * @access  Público
 */
export const saveAbandonedCart = async (req, res, next) => {
  try {
    const { name = '', email, phone = '', items = [], subtotal = 0 } = req.body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito debe contener al menos un producto.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const normalizedItems = items.map((item, idx) => {
      const rawProductId = item.productId || item._id || item.product || item.id || `item-${idx}`;
      const productId = String(rawProductId).includes('_')
        ? String(rawProductId).split('_')[0]
        : String(rawProductId);
      const variantKey = item.variantKey
        ? String(item.variantKey).trim()
        : (typeof item.filter === 'object' ? item.filter?.id : '') || 'standard';
      const lineId = item.id ? String(item.id).trim() : `${productId}_${variantKey}_std`;
      const modelCode = String(item.modelCode || item.code || 'Q-001').trim();
      const slug = String(item.slug || modelCode.toLowerCase()).trim();

      return {
        id: lineId,
        productId,
        modelCode,
        slug,
        name: String(item.name || 'Armazón CIRQA').trim(),
        price: Math.max(0, Number(item.price) || 0),
        quantity: Math.max(1, Number(item.quantity) || 1),
        variantKey,
        variantName: item.variantName ? String(item.variantName).trim() : '',
        variantSubtitle: item.variantSubtitle ? String(item.variantSubtitle).trim() : '',
        badgeColor: item.badgeColor ? String(item.badgeColor).trim() : '#FFFFFF',
        filter:
          item.filter !== undefined && item.filter !== null
            ? item.filter
            : item.variantName || item.variantSubtitle || '',
        image: String(item.image || '').trim(),
      };
    });

    const numericSubtotal =
      Number(subtotal) > 0
        ? Number(subtotal)
        : normalizedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

    const newRecoveryToken = crypto.randomBytes(24).toString('hex');

    const cart = await AbandonedCart.findOneAndUpdate(
      { email: cleanEmail, status: 'pending' },
      {
        $set: {
          name: String(name || '').trim(),
          phone: String(phone || '').trim(),
          items: normalizedItems,
          subtotal: numericSubtotal,
          lastActivityAt: new Date(),
        },
        $setOnInsert: {
          email: cleanEmail,
          status: 'pending',
          notifiedAt: null,
          recoveryToken: newRecoveryToken,
        },
      },
      { upsert: true, new: true }
    );

    // Si ya existía un carrito pending previo sin recoveryToken, asignarle uno
    if (cart && !cart.recoveryToken) {
      cart.recoveryToken = crypto.randomBytes(24).toString('hex');
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recuperar carrito abandonado a partir de su token seguro
 * @route   GET /api/abandoned-carts/recover/:token
 * @access  Público
 */
export const recoverAbandonedCart = async (req, res, next) => {
  try {
    const token = String(req.params.token || '').trim();

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no disponible o ya completado',
      });
    }

    const cart = await AbandonedCart.findOne({ recoveryToken: token });

    if (!cart || cart.status === 'recovered') {
      return res.status(404).json({
        success: false,
        message: 'Carrito no disponible o ya completado',
      });
    }

    return res.status(200).json({
      success: true,
      items: Array.isArray(cart.items) ? cart.items : [],
      customerName: cart.name || '',
    });
  } catch (error) {
    next(error);
  }
};
