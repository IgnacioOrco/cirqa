import AbandonedCart from '../models/AbandonedCart.js';
import { sendAbandonedCartEmail } from '../services/emailService.js';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/**
 * Busca carritos abandonados inactivos hace más de 2 horas y envía correo de recuperación.
 */
export const processAbandonedCartsJob = async () => {
  try {
    const threshold = new Date(Date.now() - TWO_HOURS_MS);

    const abandonedCarts = await AbandonedCart.find({
      status: 'pending',
      notifiedAt: null,
      lastActivityAt: { $lte: threshold },
    });

    if (abandonedCarts.length === 0) {
      return;
    }

    console.log(`[AbandonedCart Job] 🛒 Procesando ${abandonedCarts.length} carrito(s) abandonado(s)...`);

    for (const cart of abandonedCarts) {
      try {
        await sendAbandonedCartEmail(cart);
        await AbandonedCart.findByIdAndUpdate(cart._id, {
          $set: {
            status: 'notified',
            notifiedAt: new Date(),
          },
        });
      } catch (cartErr) {
        console.error(`[AbandonedCart Job] Error procesando carrito ${cart._id}:`, cartErr.message);
      }
    }
  } catch (error) {
    console.error('[AbandonedCart Job] Error general en el worker:', error.message);
  }
};

/**
 * Inicializa el worker periódico cada 15 minutos al arrancar el servidor.
 */
export const initAbandonedCartJob = () => {
  console.log('[AbandonedCart Job] ⏱️ Worker de carritos abandonados programado cada 15 minutos.');
  return setInterval(processAbandonedCartsJob, FIFTEEN_MINUTES_MS);
};
