import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import type { TradingMode } from '../types';
import { API, apiErrorMessage, authHeaders } from '../utils/api';

export interface JournalEntry {
  initialBalance: number | null;
  finalBalance: number | null;
  notes: string | null;
}

export type JournalEntryPatch = Partial<JournalEntry>;

interface ApiEntry {
  date: string;
  initialBalance: string | null;
  finalBalance: string | null;
  notes: string | null;
}

interface ApiGoal {
  weekNumber: number;
  targetAmount: string;
}

const EMPTY_ENTRY: JournalEntry = { initialBalance: null, finalBalance: null, notes: null };

const toNumber = (v: string | null) => (v === null ? null : Number(v));

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
          entryMap[e.date] = { initialBalance: toNumber(e.initialBalance), finalBalance: toNumber(e.finalBalance), notes: e.notes };
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

  const track = useCallback(async (request: Promise<unknown>) => {
    setPendingSaves((n) => n + 1);
    try {
      await request;
      setLastSavedAt(Date.now());
      return true;
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo guardar el cambio'));
      return false;
    } finally {
      setPendingSaves((n) => n - 1);
    }
  }, []);

  const saveEntry = useCallback(async (date: string, patch: JournalEntryPatch) => {
    let previous: JournalEntry | undefined;
    setEntries((prev) => {
      previous = prev[date];
      return { ...prev, [date]: { ...EMPTY_ENTRY, ...prev[date], ...patch } };
    });
    const ok = await track(axios.put(`${API}/crypto/journal/entry`, { mode, date, ...patch }, { headers: authHeaders() }));
    if (!ok) {
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
