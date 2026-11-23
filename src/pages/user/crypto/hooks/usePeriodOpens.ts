import { useEffect, useState } from 'react';
import axios from 'axios';
import type { ReferenceMode } from '../types';
import { API, authHeaders } from '../utils/api';
import { getPeriodStart } from '../utils/periods';

/**
 * Precio de apertura (USD) de cada símbolo al inicio del periodo: hoy 00:00 (Day) o lunes 00:00 (Swing), hora local.
 * El backend toma la apertura de la vela horaria de ese instante (Bitget, con CryptoCompare de respaldo).
 */
export function usePeriodOpens(symbols: string[], mode: ReferenceMode) {
  const [opens, setOpens] = useState<Record<string, number>>({});
  const key = symbols.slice().sort().join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    axios
      .get<Record<string, number>>(`${API}/market/opens`, {
        params: { symbols: key, at: getPeriodStart(mode).getTime() },
        headers: authHeaders(),
      })
      .then(({ data }) => {
        if (!cancelled) setOpens(data);
      })
      .catch(() => {
        if (!cancelled) setOpens({});
      });

    return () => { cancelled = true; };
  }, [key, mode]);

  return key ? opens : {};
}
