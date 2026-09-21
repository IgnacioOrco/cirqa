import cron from 'node-cron';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

/**
 * Tarea programada para cancelar órdenes PENDING con más de 24 horas de antigüedad
 * y reponer el stock de los productos asociados.
 *
 * Expresión cron: '0 * * * *' -> Se ejecuta al inicio de cada hora (minuto 0).
 */
export const cancelExpiredOrdersJob = async () => {
  console.log('[Cron Orders] 🕒 Iniciando verificación de órdenes PENDING vencidas (>24hs)...');

  try {
    // Calcular el umbral de 24 horas atrás
    const expirationThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Buscar órdenes PENDING creadas hace más de 24 horas
    const expiredOrders = await Order.find({
      status: 'PENDING',
      createdAt: { $lte: expirationThreshold },
    });

    if (expiredOrders.length === 0) {
      console.log('[Cron Orders] ✅ No hay órdenes vencidas para cancelar.');
      return;
    }

    console.log(`[Cron Orders] ⚠️ Se encontraron ${expiredOrders.length} orden(es) vencida(s). Procesando cancelaciones y reposición de stock...`);

    let cancelledCount = 0;

    for (const order of expiredOrders) {
      try {
        // 2. Transición atómica a CANCELLED:
        // Se valida que la orden aún siga en PENDING para evitar condiciones de carrera si se pagó simultáneamente
        const cancelledOrder = await Order.findOneAndUpdate(
          { _id: order._id, status: 'PENDING' },
          {
            $set: {
              status: 'CANCELLED',
              notes: order.notes
                ? `${order.notes} | Cancelada automáticamente por vencimiento (>24hs sin pago)`
                : 'Cancelada automáticamente por vencimiento (>24hs sin pago)',
            },
          },
          { new: true }
        );

        // Si no se actualizó, significa que cambió de estado justo antes de esta iteración
        if (!cancelledOrder) {
          console.log(`[Cron Orders] Orden ${order._id} ya no estaba en estado PENDING. Omitiendo reposición.`);
          continue;
        }

        // 3. Incrementar el stock de cada producto asociado
        for (const item of cancelledOrder.items) {
          if (item.product && item.quantity > 0) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity },
            });
            console.log(
              `[Cron Orders] 📦 Stock repuesto para producto ID ${item.product}: +${item.quantity} un. (Orden: ${cancelledOrder._id})`
            );
          }
        }

        cancelledCount++;
        console.log(`[Cron Orders] ❌ Orden ${cancelledOrder._id} cancelada exitosamente.`);
      } catch (orderError) {
        console.error(`[Cron Orders] Error cancelando orden ${order._id}:`, orderError);
      }
    }

    console.log(`[Cron Orders] ✅ Proceso finalizado. Total órdenes canceladas y stock repuesto: ${cancelledCount}`);
  } catch (error) {
    console.error('[Cron Orders] Error crítico al ejecutar el cron job de órdenes vencidas:', error);
  }
};

/**
 * Inicializa el cron job en el servidor Express
 */
export const initCancelExpiredOrdersCron = () => {
  // '0 * * * *' = Cada hora en punto
  cron.schedule('0 * * * *', async () => {
    await cancelExpiredOrdersJob();
  });

  console.log('[Cron Orders] ⏰ Job de cancelación de órdenes automáticas registrado (Cada 1 hora: 0 * * * *)');
};
