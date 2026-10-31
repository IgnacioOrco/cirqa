/**
 * Campaña Cyber Monday - CIRQA Backend
 * Ventana temporal: 02/11/2026 00:00:00 al 06/11/2026 23:59:59 (GMT-3 / Argentina)
 * Solución hardcodeada y automática basada estrictamente en la fecha actual.
 */

/**
 * Valida si la fecha actual está dentro de la ventana de Cyber Monday (GMT-3)
 * @param {Date} [testDate] - Opcional para pruebas unitarias
 * @returns {boolean}
 */
export const isCyberMondayActive = (testDate = null) => {
  const now = testDate instanceof Date ? testDate : new Date();
  const cyberStart = new Date('2026-11-02T00:00:00-03:00');
  const cyberEnd = new Date('2026-11-06T23:59:59-03:00');
  return now >= cyberStart && now <= cyberEnd;
};

export const isCyber = isCyberMondayActive();

export const CYBER_DISCOUNT_PERCENT = 0.20;

/**
 * Calcula el precio con el 20% de descuento Cyber Monday
 * @param {number} originalPrice
 * @returns {number}
 */
export const calculateCyberPrice = (originalPrice) => {
  const price = Number(originalPrice) || 0;
  return Math.round(price * 0.8);
};
