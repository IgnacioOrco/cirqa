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

    // 1. Buscar órdenes pending (tolerante a mayúsculas y minúsculas) creadas hace más de 24 horas
    const expiredOrders = await Order.find({
      status: { $in: ['pending', 'PENDING'] },
      createdAt: { $lte: expirationThreshold },
    });

    if (expiredOrders.length === 0) {
      console.log('[Cron Orders] ✅ No hay órdenes vencidas para cancelar.');
      return;
    }

    console.log(
      `[Cron Orders] ⚠️ Se encontraron ${expiredOrders.length} orden(es) vencida(s). Procesando cancelaciones...`
    );

    let cancelledCount = 0;
    let stockRestoredOrdersCount = 0;

    for (const order of expiredOrders) {
      try {
        // 2. Transición atómica a CANCELLED:
        // Se valida que la orden aún siga en estado pending para evitar condiciones de carrera si se pagó simultáneamente
        const cancelledOrder = await Order.findOneAndUpdate(
          {
            _id: order._id,
            status: { $in: ['pending', 'PENDING'] },
          },
          {
            $set: {
              status: 'cancelled',
              'payment.status': 'cancelled',
              notes: order.notes
                ? `${order.notes} | Cancelada automáticamente por vencimiento (>24hs sin pago)`
                : 'Cancelada automáticamente por vencimiento (>24hs sin pago)',
            },
          },
          { new: true }
        );

        // Si no se actualizó, significa que cambió de estado justo antes de esta iteración
        if (!cancelledOrder) {
          console.log(`[Cron Orders] Orden ${order._id} ya no estaba en estado pending. Omitiendo.`);
          continue;
        }

        // 3. Regla Estricta: Solo reponer stock si el método de pago es TRANSFERENCIA
        const isTransfer =
          cancelledOrder.paymentMethod === 'TRANSFERENCIA' ||
          cancelledOrder.paymentMethod === 'transfer' ||
          cancelledOrder.payment?.provider === 'transfer' ||
          cancelledOrder.payment?.method === 'transfer' ||
          cancelledOrder.payment?.method === 'TRANSFERENCIA';

        if (isTransfer) {
          for (const item of cancelledOrder.items) {
            if (item.product && item.quantity > 0) {
              await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity },
              });
              console.log(
                `[Cron Orders] 📦 Stock repuesto para transferencia ID ${item.product}: +${item.quantity} un. (Orden: ${cancelledOrder._id})`
              );
            }
          }
          stockRestoredOrdersCount++;
        } else {
          console.log(
            `[Cron Orders] ℹ️ Orden de Mercado Pago ${cancelledOrder._id} cancelada sin alterar stock (nunca fue descontado previamente).`
          );
        }

        cancelledCount++;
        console.log(`[Cron Orders] ❌ Orden ${cancelledOrder._id} cancelada exitosamente.`);
      } catch (orderError) {
        console.error(`[Cron Orders] Error cancelando orden ${order._id}:`, orderError);
      }
    }

    console.log(
      `[Cron Orders] ✅ Proceso finalizado. Total canceladas: ${cancelledCount} (Stock repuesto en ${stockRestoredOrdersCount} transferencias).`
    );
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
