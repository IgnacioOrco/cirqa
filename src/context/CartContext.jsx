import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'cirqa_cart_items';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTargetItem, setCheckoutTargetItem] = useState(null); // Direct buy item override if any

  // Persistir carrito en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('[Cart] Error guardando carrito:', e);
    }
  }, [items]);

  // Agregar producto al carrito
  const addToCart = (product, options = {}) => {
    const {
      filter = null,
      variant = null,
      variantKey = null,
      variantName = null,
      variantSubtitle = null,
      badgeColor = null,
      prescription = null,
      quantity = 1,
      image = null,
      price = null,
    } = options;

    const resolvedVariantKey = variantKey || variant?.key || filter?.id || 'standard';
    const lineId = `${product._id || product.id || 'item'}_${resolvedVariantKey}_${prescription ? 'rx' : 'std'}`;

    const resolvedPrice = Number(price ?? product.price ?? 0);

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((it) => it.id === lineId);
      if (existingIndex > -1) {
        const next = [...prevItems];
        next[existingIndex].quantity += quantity;
        return next;
      }

      const newItem = {
        id: lineId,
        productId: product._id || product.id,
        name: product.name || 'Armazón CIRQA',
        modelCode: product.modelCode || product.code || 'Q-001',
        price: resolvedPrice,
        formattedPrice: `$ ${resolvedPrice.toLocaleString('es-AR')}`,
        image: image || product.primaryImage || product.image_url || '/products/_DSC8649.webp',
        variant: variant || null,
        variantKey: resolvedVariantKey,
        variantName: variantName || variant?.name || (typeof filter === 'object' ? filter?.name : filter) || null,
        variantSubtitle: variantSubtitle || variant?.subtitle || (typeof filter === 'object' ? filter?.tag : '') || '',
        badgeColor: badgeColor || variant?.badgeColor || filter?.hexCode || '#FFFFFF',
        filter: filter || { id: 'dia', name: 'Día', tag: '84%', hexCode: '#F3B93A' },
        prescription: prescription || null,
        quantity: Math.max(1, quantity),
      };

      return [...prevItems, newItem];
    });

    if (options.openCheckout) {
      setCheckoutTargetItem(null);
      setIsCheckoutOpen(true);
    }
  };

  // Remover item del carrito
  const removeFromCart = (lineId) => {
    setItems((prev) => prev.filter((it) => it.id !== lineId));
  };

  // Modificar cantidad
  const updateQuantity = (lineId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(lineId);
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.id === lineId ? { ...it, quantity } : it))
    );
  };

  // Limpiar carrito
  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // Abrir checkout con el carrito completo o con un producto específico directamente
  const openCheckout = (directItem = null) => {
    setCheckoutTargetItem(directItem);
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setCheckoutTargetItem(null);
  };

  // Totales
  const cartCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const cartTotal = items.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCheckoutOpen,
        checkoutTargetItem,
        openCheckout,
        closeCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
};
