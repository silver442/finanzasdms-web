import { useCallback, useMemo, useState } from 'react';
import { currentUserId, writePref } from '../crypto/utils/storage';

// Preferencias de "Mi Panel" por usuario: qué cards están plegadas y en qué orden van
function readIdList(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function useDashboardLayout<T extends string>(activeIds: readonly T[]) {
  const userId = currentUserId() ?? 'anon';
  const collapsedKey = `dashboard.collapsedCards.${userId}`;
  const orderKey     = `dashboard.cardOrder.${userId}`;

  const [collapsed, setCollapsed] = useState<string[]>(() => readIdList(collapsedKey));
  const [savedOrder, setSavedOrder] = useState<string[]>(() => readIdList(orderKey));

  // Respeta el orden guardado; los módulos activados después se agregan al final
  const orderedIds = useMemo(() => {
    const active = new Set<string>(activeIds);
    const known  = savedOrder.filter((id): id is T => active.has(id));
    const fresh  = activeIds.filter((id) => !savedOrder.includes(id));
    return [...known, ...fresh];
  }, [activeIds, savedOrder]);

  const isCollapsed = useCallback((id: T) => collapsed.includes(id), [collapsed]);

  const toggleCollapsed = useCallback((id: T) => {
    setCollapsed((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      writePref(collapsedKey, JSON.stringify(next));
      return next;
    });
  }, [collapsedKey]);

  // Mueve `dragged` a la posición de `target`; conserva al final los ids de módulos hoy inactivos
  const moveCard = useCallback((dragged: T, target: T) => {
    if (dragged === target) return;
    const next = orderedIds.filter((id) => id !== dragged);
    next.splice(next.indexOf(target) + (orderedIds.indexOf(dragged) < orderedIds.indexOf(target) ? 1 : 0), 0, dragged);
    const inactive = savedOrder.filter((id) => !next.includes(id as T));
    const stored = [...next, ...inactive];
    setSavedOrder(stored);
    writePref(orderKey, JSON.stringify(stored));
  }, [orderedIds, savedOrder, orderKey]);

  return { orderedIds, isCollapsed, toggleCollapsed, moveCard };
}
