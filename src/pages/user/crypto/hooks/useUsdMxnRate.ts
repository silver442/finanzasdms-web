import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { readNumberPref, writePref } from '../utils/storage';

const OVERRIDE_KEY = 'crypto.fxOverride';
const LAST_API_KEY = 'crypto.fxLastApi';
const DEFAULT_RATE = 18;

/** Tipo de cambio USD→MXN: ExchangeRate-API con ajuste manual del usuario (guardado en localStorage). */
export function useUsdMxnRate() {
  const [apiRate, setApiRate] = useState<number | null>(() => readNumberPref(LAST_API_KEY));
  const [override, setOverrideState] = useState<number | null>(() => readNumberPref(OVERRIDE_KEY));

  useEffect(() => {
    const key = import.meta.env.VITE_FX_API_KEY;
    if (!key) return;
    axios
      .get(`https://v6.exchangerate-api.com/v6/${key}/latest/USD`)
      .then(({ data }) => {
        const mxn = Number(data?.conversion_rates?.MXN);
        if (mxn > 0) {
          setApiRate(mxn);
          writePref(LAST_API_KEY, String(mxn));
        }
      })
      .catch(() => {
        // Sin API se usa el último valor conocido o el manual
      });
  }, []);

  const setOverride = useCallback((value: number | null) => {
    setOverrideState(value);
    writePref(OVERRIDE_KEY, value === null ? null : String(value));
  }, []);

  return {
    rate: override ?? apiRate ?? DEFAULT_RATE,
    apiRate,
    isManual: override !== null,
    setOverride,
  };
}
