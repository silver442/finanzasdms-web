import { useEffect, useState } from 'react';
import axios from 'axios';
import type { ReferenceMode } from '../types';
import { getPeriodStart } from '../utils/periods';

/**
 * Precio de apertura (USD) de cada símbolo al inicio del periodo: hoy 00:00 (Day) o lunes 00:00 (Swing), hora local.
 * Usa velas horarias de CryptoCompare; 200 horas cubren cualquier lunes de la semana en curso.
 */
export function usePeriodOpens(symbols: string[], mode: ReferenceMode) {
  const [opens, setOpens] = useState<Record<string, number>>({});
  const key = symbols.slice().sort().join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const periodStart = Math.floor(getPeriodStart(mode).getTime() / 1000);
    const apiKey = import.meta.env.VITE_CRYPTO_API_KEY;

    Promise.all(
      key.split(',').map(async (symbol) => {
        try {
          const { data } = await axios.get(
            `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${symbol}&tsym=USD&limit=200&api_key=${apiKey}`,
          );
          const candles: { time: number; open: number }[] = data?.Data?.Data ?? [];
          const candle = candles.find((c) => c.time === periodStart) ?? candles.find((c) => c.time > periodStart);
          return candle && candle.open > 0 ? ([symbol, candle.open] as const) : null;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, number> = {};
      results.forEach((r) => { if (r) map[r[0]] = r[1]; });
      setOpens(map);
    });

    return () => { cancelled = true; };
  }, [key, mode]);

  return key ? opens : {};
}
