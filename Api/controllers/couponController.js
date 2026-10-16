import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';

/**
 * Función centralizada para calcular el descuento de un cupón sobre un carrito
 */
export const calculateCouponDiscount = (coupon, items = [], totalSubtotal = 0, customerEmail = '') => {
  if (!coupon || !coupon.isActive) {
    return {
      valid: false,
      discountAmount: 0,
      message: 'El código de descuento no está activo.',
    };
  }

  const now = new Date();
  if (coupon.startsAt && now < new Date(coupon.startsAt)) {
    return {
      valid: false,
      discountAmount: 0,
      message: 'El cupón aún no está vigente.',
    };
  }

  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
    return {
      valid: false,
      discountAmount: 0,
      message: 'El código de descuento ha expirado.',
    };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return {
      valid: false,
      discountAmount: 0,
      message: 'El código de descuento ha alcanzado el límite máximo de usos.',
    };
  }

  if (coupon.maxUsesPerCustomer !== null && customerEmail) {
    const cleanEmail = customerEmail.trim().toLowerCase();
    const customerUsage = (coupon.usageHistory || []).filter(
      (h) => (h.customerEmail || '').trim().toLowerCase() === cleanEmail
    ).length;
    if (customerUsage >= coupon.maxUsesPerCustomer) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Has alcanzado el límite de usos permitidos para este cupón.',
      };
    }
  }

  // Filtrar items elegibles si el cupón está restringido a productos específicos
  let eligibleItems = items;
  if (Array.isArray(coupon.applicableProducts) && coupon.applicableProducts.length > 0) {
    const applicableIds = coupon.applicableProducts.map((p) => String(p._id || p));
    eligibleItems = items.filter((item) => {
      const prodId = String(item.product?._id || item.product || item._id || item.productId || '');
      return applicableIds.includes(prodId);
    });

    if (eligibleItems.length === 0) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'El cupón no es aplicable a los productos seleccionados en el carrito.',
      };
    }
  }

  // Desglosar unidades elegibles
  const expandedUnits = [];
  let eligibleSubtotal = 0;
  let totalEligibleQuantity = 0;

  eligibleItems.forEach((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.price) || 0);
    totalEligibleQuantity += qty;
    eligibleSubtotal += price * qty;
    for (let i = 0; i < qty; i++) {
      expandedUnits.push(price);
    }
  });

  // Ordenar unidades de menor a mayor precio para bonificar las más convenientes/económicas
  expandedUnits.sort((a, b) => a - b);

  // Validar compra mínima en $
  if (coupon.minPurchaseAmount > 0 && totalSubtotal < coupon.minPurchaseAmount) {
    return {
      valid: false,
      discountAmount: 0,
      message: `El cupón requiere una compra mínima de $${Number(coupon.minPurchaseAmount).toLocaleString('es-AR')}.`,
    };
  }

  // Validar cantidad mínima de unidades
  const requiredMinQty = Math.max(
    coupon.minQuantity || 1,
    coupon.discountType === 'bogo_2x1' ? 2 : coupon.discountType === 'bogo_3x2' ? 3 : 1
  );

  if (totalEligibleQuantity < requiredMinQty) {
    return {
      valid: false,
      discountAmount: 0,
      message: `El cupón requiere al menos ${requiredMinQty} unidades elegibles en el carrito.`,
    };
  }

  let calculatedDiscount = 0;

  switch (coupon.discountType) {
    case 'percentage': {
      const pct = Math.min(100, Math.max(0, Number(coupon.discountValue) || 0));
      calculatedDiscount = Math.round(eligibleSubtotal * (pct / 100));
      break;
    }
    case 'fixed': {
      const fixedAmount = Math.max(0, Number(coupon.discountValue) || 0);
      calculatedDiscount = Math.min(eligibleSubtotal, fixedAmount);
      break;
    }
    case 'bogo_2x1': {
      // Por cada 2 unidades, la de menor valor es 100% gratis
      const freeUnitsCount = Math.floor(expandedUnits.length / 2);
      for (let i = 0; i < freeUnitsCount; i++) {
        calculatedDiscount += expandedUnits[i];
      }
      break;
    }
    case 'bogo_3x2': {
      // Por cada 3 unidades, la de menor valor es 100% gratis (llevás 3, pagás 2)
      const freeUnitsCount = Math.floor(expandedUnits.length / 3);
      for (let i = 0; i < freeUnitsCount; i++) {
        calculatedDiscount += expandedUnits[i];
      }
      break;
    }
    case 'second_unit_percent': {
      // Descuento porcentual en la 2da unidad (por cada par de unidades, aplica % a la de menor valor)
      const pct = Math.min(100, Math.max(0, Number(coupon.discountValue) || 0));
      const pairsCount = Math.floor(expandedUnits.length / 2);
      for (let i = 0; i < pairsCount; i++) {
        calculatedDiscount += Math.round(expandedUnits[i] * (pct / 100));
      }
      break;
    }
    default:
      calculatedDiscount = 0;
  }

  // El descuento no puede superar el subtotal total
  calculatedDiscount = Math.min(totalSubtotal, Math.max(0, Math.round(calculatedDiscount)));

  return {
    valid: true,
    discountAmount: calculatedDiscount,
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      combinableWithTransfer: coupon.combinableWithTransfer !== false,
    },
    message: 'Cupón aplicado exitosamente.',
  };
};

/**
 * @desc    Validar cupón desde checkout (Público)
 * @route   POST /api/coupons/validate
 * @access  Público
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, items, subtotal, customerEmail } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Por favor, ingresá un código de cupón.',
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'El código de cupón ingresado no existe.',
      });
    }

    const calculatedSubtotal = subtotal !== undefined ? Number(subtotal) : (
      Array.isArray(items) ? items.reduce((acc, it) => acc + (Number(it.price || 0) * (Number(it.quantity) || 1)), 0) : 0
    );

    const result = calculateCouponDiscount(coupon, items || [], calculatedSubtotal, customerEmail);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      coupon: result.coupon,
      discountAmount: result.discountAmount,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Listar todos los cupones (Admin)
 * @route   GET /api/coupons
 * @access  Privado (Admin)
 */
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear un cupón (Admin)
 * @route   POST /api/coupons
 * @access  Privado (Admin)
 */
export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      minQuantity,
      maxUses,
      maxUsesPerCustomer,
      applicableProducts,
      combinableWithTransfer,
      startsAt,
      expiresAt,
      isActive,
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El código de cupón es obligatorio.',
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un cupón con el código '${cleanCode}'.`,
      });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description: (description || '').trim(),
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue) || 0,
      minPurchaseAmount: Number(minPurchaseAmount) || 0,
      minQuantity: Number(minQuantity) || 1,
      maxUses: maxUses !== undefined && maxUses !== '' && maxUses !== null ? Number(maxUses) : null,
      maxUsesPerCustomer: maxUsesPerCustomer !== undefined && maxUsesPerCustomer !== '' && maxUsesPerCustomer !== null ? Number(maxUsesPerCustomer) : null,
      applicableProducts: Array.isArray(applicableProducts) ? applicableProducts : [],
      combinableWithTransfer: combinableWithTransfer !== undefined ? Boolean(combinableWithTransfer) : true,
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      usedCount: 0,
      usageHistory: [],
    });

    return res.status(201).json({
      success: true,
      message: 'Cupón creado exitosamente.',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar un cupón (Admin)
 * @route   PUT /api/coupons/:id
 * @access  Privado (Admin)
 */
export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado.',
      });
    }

    if (req.body.code) {
      const cleanCode = req.body.code.trim().toUpperCase();
      if (cleanCode !== coupon.code) {
        const clash = await Coupon.findOne({ code: cleanCode, _id: { $ne: id } });
        if (clash) {
          return res.status(400).json({
            success: false,
            message: `El código '${cleanCode}' ya está siendo usado por otro cupón.`,
          });
        }
        coupon.code = cleanCode;
      }
    }

    if (req.body.description !== undefined) coupon.description = req.body.description.trim();
    if (req.body.discountType !== undefined) coupon.discountType = req.body.discountType;
    if (req.body.discountValue !== undefined) coupon.discountValue = Number(req.body.discountValue);
    if (req.body.minPurchaseAmount !== undefined) coupon.minPurchaseAmount = Number(req.body.minPurchaseAmount);
    if (req.body.minQuantity !== undefined) coupon.minQuantity = Number(req.body.minQuantity);
    if (req.body.maxUses !== undefined) {
      coupon.maxUses = req.body.maxUses === '' || req.body.maxUses === null ? null : Number(req.body.maxUses);
    }
    if (req.body.maxUsesPerCustomer !== undefined) {
      coupon.maxUsesPerCustomer = req.body.maxUsesPerCustomer === '' || req.body.maxUsesPerCustomer === null ? null : Number(req.body.maxUsesPerCustomer);
    }
    if (req.body.applicableProducts !== undefined) {
      coupon.applicableProducts = Array.isArray(req.body.applicableProducts) ? req.body.applicableProducts : [];
    }
    if (req.body.combinableWithTransfer !== undefined) {
      coupon.combinableWithTransfer = Boolean(req.body.combinableWithTransfer);
    }
    if (req.body.startsAt !== undefined) {
      coupon.startsAt = req.body.startsAt ? new Date(req.body.startsAt) : new Date();
    }
    if (req.body.expiresAt !== undefined) {
      coupon.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    }
    if (req.body.isActive !== undefined) {
      coupon.isActive = Boolean(req.body.isActive);
    }
    if (req.body.resetUsedCount) {
      coupon.usedCount = 0;
    }

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: 'Cupón actualizado exitosamente.',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar un cupón (Admin)
 * @route   DELETE /api/coupons/:id
 * @access  Privado (Admin)
 */
export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cupón eliminado exitosamente.',
      data: { id: coupon._id, code: coupon.code },
    });
  } catch (error) {
    next(error);
  }
};
