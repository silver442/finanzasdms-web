import { useCallback, useState } from 'react';
import type { Currency } from '../types';
import { readPref, writePref } from '../utils/storage';
import { useUsdMxnRate } from './useUsdMxnRate';

const CURRENCY_KEY = 'crypto.currency';

/**
 * Divisa de visualización compartida por Portafolio y Day Trading (persistida en localStorage).
 * Los montos siempre se guardan en USD: `toView` convierte para mostrar y `fromView` regresa a USD al capturar.
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>(() => readPref(CURRENCY_KEY, ['USD', 'MXN'] as const, 'USD'));
  const { rate, isManual, setOverride } = useUsdMxnRate();

  const setCurrency = useCallback((value: Currency) => {
    setCurrencyState(value);
    writePref(CURRENCY_KEY, value);
  }, []);

  const toView = (usd: number) => (currency === 'MXN' ? usd * rate : usd);
  const fromView = (value: number) => (currency === 'MXN' ? Math.round((value / rate) * 100) / 100 : value);

  return { currency, setCurrency, rate, isManual, setOverride, toView, fromView };
}

export type CurrencyState = ReturnType<typeof useCurrency>;
