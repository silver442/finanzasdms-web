import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API, apiErrorMessage, authHeaders } from '../crypto/utils/api';
import type { BudgetType } from './categories';

export interface BudgetItem {
  id: string;
  year: number;
  month: number;
  type: BudgetType;
  category: string;
  label: string | null;
  amount: number;
  createdAt: string;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface BudgetMonthResponse {
  items: BudgetItem[];
  summary: BudgetSummary;
}

export interface NewBudgetItem {
  type: BudgetType;
  category: string;
  label: string | null;
  amount: number;
}

const round = (v: number) => Math.round(v * 100) / 100;

/** Ítems del mes; el resumen se recalcula en el cliente para reflejar al instante altas, ediciones y bajas. */
export function useBudget(year: number, month: number) {
  const periodKey = `${year}-${month}`;
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const isLoading = loadedKey !== periodKey;

  // Mes en pantalla, para que "Deshacer" no meta un ítem de otro mes en la lista actual
  const periodRef = useRef(periodKey);
  useEffect(() => {
    periodRef.current = periodKey;
  }, [periodKey]);

  useEffect(() => {
    let cancelled = false;
    axios
      .get<BudgetMonthResponse>(`${API}/budget`, { params: { year, month }, headers: authHeaders() })
      .then(({ data }) => {
        if (!cancelled) setItems(data.items);
      })
      .catch((e) => {
        if (!cancelled) toast.error(apiErrorMessage(e, 'Error al cargar el presupuesto'));
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(`${year}-${month}`);
      });
    return () => { cancelled = true; };
  }, [year, month]);

  // El ítem lleva su propio mes: "Deshacer" lo recrea en su mes aunque ya se haya navegado a otro
  const createItem = useCallback(async (item: NewBudgetItem & { year: number; month: number }) => {
    try {
      const { data } = await axios.post<BudgetItem>(`${API}/budget`, { ...item, label: item.label ?? undefined }, { headers: authHeaders() });
      if (`${data.year}-${data.month}` === periodRef.current) setItems((prev) => [...prev, data]);
      return true;
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Error al guardar el registro'));
      return false;
    }
  }, []);

  const addItem = useCallback((item: NewBudgetItem) => createItem({ ...item, year, month }), [createItem, year, month]);

  const updateItem = useCallback(async (id: string, patch: Partial<Pick<BudgetItem, 'amount' | 'category' | 'label'>>) => {
    try {
      const { data } = await axios.patch<BudgetItem>(`${API}/budget/${id}`, patch, { headers: authHeaders() });
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Error al actualizar el registro'));
    }
  }, []);

  const removeItem = useCallback(async (item: BudgetItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await axios.delete(`${API}/budget/${item.id}`, { headers: authHeaders() });
      toast.success('Registro eliminado', {
        action: { label: 'Deshacer', onClick: () => { void createItem(item); } },
      });
    } catch (e) {
      setItems((prev) => [...prev, item]);
      toast.error(apiErrorMessage(e, 'Error al eliminar el registro'));
    }
  }, [createItem]);

  const copyPrevious = useCallback(async () => {
    setIsCopying(true);
    try {
      const { data } = await axios.post<BudgetMonthResponse & { copied: number }>(`${API}/budget/copy-previous`, { year, month }, { headers: authHeaders() });
      setItems(data.items);
      if (data.copied === 0) toast.info('Todo lo del mes anterior ya estaba en este mes');
      else toast.success(`${data.copied} ${data.copied === 1 ? 'registro copiado' : 'registros copiados'} del mes anterior`);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Error al copiar el mes anterior'));
    } finally {
      setIsCopying(false);
    }
  }, [year, month]);

  const visible = isLoading ? [] : items;
  const totalIncome = round(visible.filter((i) => i.type === 'INCOME').reduce((s, i) => s + i.amount, 0));
  const totalExpense = round(visible.filter((i) => i.type === 'EXPENSE').reduce((s, i) => s + i.amount, 0));
  const summary: BudgetSummary = { totalIncome, totalExpense, balance: round(totalIncome - totalExpense) };

  return { items: visible, summary, isLoading, isCopying, addItem, updateItem, removeItem, copyPrevious };
}
