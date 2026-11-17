/**
 * Helper seguro para Meta Pixel (ID: 845297015571044)
 * Verifica que `window` y `window.fbq` existan antes de disparar eventos.
 */

export const trackPageView = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

export const trackAddToCart = ({ value = 0, currency = 'ARS', content_name = '' } = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', {
      value: Number(value) || 0,
      currency: currency || 'ARS',
      content_name,
    });
  }
};

export const trackInitiateCheckout = ({ value, currency = 'ARS', ...rest } = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const payload = {
      currency: currency || 'ARS',
      ...rest,
    };

    if (value !== undefined && value !== null) {
      payload.value = Number(value) || 0;
    }

    window.fbq('track', 'InitiateCheckout', payload);
  }
};

export const trackPurchase = ({ value = 0, currency = 'ARS', ...rest } = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      value: Number(value) || 0,
      currency: currency || 'ARS',
      ...rest,
    });
  }
};
