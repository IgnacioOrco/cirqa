import Lead from '../models/Lead.js';
import { sendLeadWelcomeEmail } from '../services/emailService.js';
import { ensureWelcomeCoupon } from './couponController.js';

/**
 * @desc    Registrar o actualizar Lead y enviar cupón BIENVENIDA5 (5% OFF)
 * @route   POST /api/leads
 * @access  Público
 */
export const createLead = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, ingresá tu nombre.',
      });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, ingresá un correo electrónico válido.',
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Asegurar que el cupón BIENVENIDA5 exista en la colección Coupon
    await ensureWelcomeCoupon();

    // Guardar o actualizar el Lead sin arrojar error si el email ya existía
    const lead = await Lead.findOneAndUpdate(
      { email: cleanEmail },
      {
        $set: {
          name: cleanName,
          email: cleanEmail,
        },
        $setOnInsert: {
          couponCode: 'BIENVENIDA5',
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Enviar email de bienvenida de forma no bloqueante
    try {
      sendLeadWelcomeEmail({
        name: lead.name,
        email: lead.email,
        couponCode: lead.couponCode || 'BIENVENIDA5',
      }).catch((err) => {
        console.error('[LeadController] Error enviando email de bienvenida:', err.message);
      });
    } catch (err) {
      console.error('[LeadController] Error enviando email de bienvenida:', err.message);
    }

    return res.status(201).json({
      success: true,
      couponCode: lead.couponCode || 'BIENVENIDA5',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener todos los Leads registrados ordenados por fecha descendente
 * @route   GET /api/leads
 * @access  Privado (Admin)
 */
export const getLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    next(error);
  }
};
