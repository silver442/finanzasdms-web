import { useEffect, useState } from 'react';
import axios from 'axios';
import { API, authHeaders } from '../utils/api';

export interface Holding {
  symbol: string;
  quantity: number;
}

export interface HistoryPoint {
  time: number;
  value: number;
}

const HISTORY_DAYS = 30;

/**
 * Valor diario (USD) de las tenencias actuales durante los últimos 30 días, con velas diarias del backend (Bitget).
 * Es una reconstrucción con las cantidades de hoy (no considera compras/ventas pasadas); no incluye el efectivo.
 */
export function usePortfolioHistory(holdings: Holding[]) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const key = holdings
    .filter((h) => h.quantity > 0)
    .map((h) => `${h.symbol}:${h.quantity}`)
    .sort()
    .join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const entries = key.split(',').map((e) => {
      const [symbol, qty] = e.split(':');
      return { symbol, quantity: Number(qty) };
    });

    Promise.all(
      entries.map(async ({ symbol, quantity }) => {
        try {
          const { data: candles } = await axios.get<{ time: number; close: number }[]>(`${API}/market/candles`, {
            params: { symbol, interval: '1D', limit: HISTORY_DAYS + 1 },
            headers: authHeaders(),
          });
          return candles.map((c) => ({ time: c.time, value: c.close * quantity }));
        } catch {
          return [];
        }
      }),
    ).then((series) => {
      if (cancelled) return;
      const totals = new Map<number, number>();
      series.flat().forEach((p) => totals.set(p.time, (totals.get(p.time) ?? 0) + p.value));
      setHistory(Array.from(totals, ([time, value]) => ({ time, value })).sort((a, b) => a.time - b.time));
    });

    return () => { cancelled = true; };
  }, [key]);

  return key ? history : [];
}
