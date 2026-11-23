import type { Currency } from '../types';

// narrowSymbol muestra "$" para USD y MXN: la divisa activa se indica una sola vez en el switch
export function formatMoney(amount: number, currency: Currency = 'USD') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(amount);
}

// Precios unitarios: monedas como PEPE cotizan en fracciones de centavo
export function formatPrice(amount: number, currency: Currency = 'USD') {
  const small = Math.abs(amount) > 0 && Math.abs(amount) < 1;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    ...(small ? { minimumSignificantDigits: 2, maximumSignificantDigits: 4 } : {}),
  }).format(amount);
}

export const formatPercent = (ratio: number) =>
  new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 2, signDisplay: 'exceptZero' }).format(ratio);

export const formatTokens = (quantity: number) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 8 }).format(quantity);

// Las fechas capturadas sin hora (YYYY-MM-DD) llegan como medianoche UTC: se muestran en UTC para no restar un día en México
export const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(iso.endsWith('T00:00:00.000Z') && { timeZone: 'UTC' }),
  });
