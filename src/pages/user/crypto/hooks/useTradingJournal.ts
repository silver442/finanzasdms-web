import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import type { TradingMode } from '../types';
import { API, apiErrorMessage, authHeaders } from '../utils/api';

/**
 * Saldos del periodo calculados por el backend con el valor del portafolio a las 00:00 (México):
 * inicial ya incluye depósitos − retiros del periodo; un saldo capturado a mano reemplaza al automático.
 */
export interface JournalEntry {
  initialBalance: number | null;
  finalBalance: number | null;
  initialIsManual: boolean;
  finalIsManual: boolean;
  netCashFlow: number;
  /** Periodo en curso: el saldo final es el valor actual del portafolio */
  isLive: boolean;
  notes: string | null;
}

export type JournalEntryPatch = Partial<Pick<JournalEntry, 'initialBalance' | 'finalBalance' | 'notes'>>;

interface ApiEntry extends JournalEntry {
  date: string;
}

interface ApiGoal {
  weekNumber: number;
  targetAmount: string;
}

const EMPTY_ENTRY: JournalEntry = { initialBalance: null, finalBalance: null, initialIsManual: false, finalIsManual: false, netCashFlow: 0, isLive: false, notes: null };

export function entryResult(entry: JournalEntry | undefined) {
  if (!entry || entry.initialBalance === null || entry.finalBalance === null) return null;
  return entry.finalBalance - entry.initialBalance;
}

/** Bitácora de un mes (DAY o SWING) con auto-guardado optimista. */
export function useTradingJournal(mode: TradingMode, year: number, month: number) {
  const [entries, setEntries] = useState<Record<string, JournalEntry>>({});
  const [goals, setGoals] = useState<Record<number, number>>({});
  // Clave del mes ya cargado: isLoading se deriva de ella en vez de alternarse dentro del efecto
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const monthKey = `${mode}-${year}-${month}`;
  const [pendingSaves, setPendingSaves] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const current = ++requestId.current;
    axios
      .get<{ entries: ApiEntry[]; goals: ApiGoal[] }>(`${API}/crypto/journal`, {
        params: { mode, year, month },
        headers: authHeaders(),
      })
      .then(({ data }) => {
        if (current !== requestId.current) return;
        const entryMap: Record<string, JournalEntry> = {};
        data.entries.forEach((e) => {
          const { date, ...entry } = e;
          entryMap[date] = entry;
        });
        const goalMap: Record<number, number> = {};
        data.goals.forEach((g) => { goalMap[g.weekNumber] = Number(g.targetAmount); });
        setEntries(entryMap);
        setGoals(goalMap);
      })
      .catch(() => {
        if (current === requestId.current) toast.error('Error al cargar la bitácora');
      })
      .finally(() => {
        if (current === requestId.current) setLoadedKey(`${mode}-${year}-${month}`);
      });
  }, [mode, year, month]);

  const track = useCallback(async <T,>(request: Promise<T>): Promise<T | null> => {
    setPendingSaves((n) => n + 1);
    try {
      const result = await request;
      setLastSavedAt(Date.now());
      return result;
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo guardar el cambio'));
      return null;
    } finally {
      setPendingSaves((n) => n - 1);
    }
  }, []);

  const saveEntry = useCallback(async (date: string, patch: JournalEntryPatch) => {
    let previous: JournalEntry | undefined;
    setEntries((prev) => {
      previous = prev[date];
      const optimistic = { ...EMPTY_ENTRY, ...prev[date], ...patch };
      // Un valor capturado se marca manual al instante; borrarlo espera el saldo automático del servidor
      if (patch.initialBalance !== undefined) optimistic.initialIsManual = patch.initialBalance !== null;
      if (patch.finalBalance !== undefined) optimistic.finalIsManual = patch.finalBalance !== null;
      return { ...prev, [date]: optimistic };
    });
    const response = await track(axios.put<ApiEntry>(`${API}/crypto/journal/entry`, { mode, date, ...patch }, { headers: authHeaders() }));
    if (response) {
      const { date: savedDate, ...saved } = response.data;
      setEntries((prev) => ({ ...prev, [savedDate]: saved }));
    } else {
      setEntries((prev) => {
        const next = { ...prev };
        if (previous) next[date] = previous;
        else delete next[date];
        return next;
      });
    }
  }, [mode, track]);

  const saveGoal = useCallback(async (weekNumber: number, targetAmount: number) => {
    let previous: number | undefined;
    setGoals((prev) => {
      previous = prev[weekNumber];
      return { ...prev, [weekNumber]: targetAmount };
    });
    const ok = await track(
      axios.put(`${API}/crypto/journal/goal`, { mode, year, month, weekNumber, targetAmount }, { headers: authHeaders() }),
    );
    if (!ok) {
      setGoals((prev) => {
        const next = { ...prev };
        if (previous !== undefined) next[weekNumber] = previous;
        else delete next[weekNumber];
        return next;
      });
    }
  }, [mode, year, month, track]);

  return { entries, goals, isLoading: loadedKey !== monthKey, isSaving: pendingSaves > 0, lastSavedAt, saveEntry, saveGoal };
}
