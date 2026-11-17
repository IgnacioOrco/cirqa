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

    const normalizedItems = items.map((item) => ({
      name: String(item.name || 'Armazón CIRQA').trim(),
      filter: String(
        item.variantName ||
          (typeof item.filter === 'object' ? item.filter?.name : item.filter) ||
          item.variantSubtitle ||
          ''
      ).trim(),
      quantity: Math.max(1, Number(item.quantity) || 1),
      price: Math.max(0, Number(item.price) || 0),
      image: String(item.image || '').trim(),
    }));

    const numericSubtotal =
      Number(subtotal) > 0
        ? Number(subtotal)
        : normalizedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

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
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};
