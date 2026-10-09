import React from 'react';
import CheckoutDrawer from './CheckoutDrawer';
import OrderReceiptModal from './OrderReceiptModal';
import { useCart } from '../context/CartContext';

/**
 * Contenedor Global de Checkout y Comprobante de Compra
 * - Maneja de forma totalmente desacoplada el Drawer de pago y el Modal de confirmación.
 * - Al completar una orden por transferencia, el drawer se cierra y el comprobante
 *   permanece visible en su propio modal con backdrop persistente.
 */
export default function CheckoutModal() {
  const { receiptOrder, closeReceipt } = useCart();

  return (
    <>
      <CheckoutDrawer />
      <OrderReceiptModal
        isOpen={Boolean(receiptOrder)}
        order={receiptOrder}
        onClose={closeReceipt}
      />
    </>
  );
}

export { CheckoutDrawer };
