import { Plus, Trash2 } from 'lucide-react';
import { InlineNumberInput } from '../crypto/components/InlineInput';
import { findCategory, type BudgetType } from './categories';
import type { BudgetItem } from './useBudget';
import { fmtMXN } from './format';

interface Props {
  type: BudgetType;
  items: BudgetItem[];
  total: number;
  isLoading: boolean;
  onAdd: () => void;
  onUpdateAmount: (id: string, amount: number) => void;
  onRemove: (item: BudgetItem) => void;
}

const THEME = {
  INCOME: { title: 'Ingresos', add: 'Agregar ingreso', empty: 'Aún no registras ingresos este mes.', icon: 'text-brand-green-light bg-brand-green/10', total: 'text-brand-green-light' },
  EXPENSE: { title: 'Gastos', add: 'Agregar gasto', empty: 'Aún no registras gastos este mes.', icon: 'text-red-400 bg-red-500/10', total: 'text-red-400' },
} as const;

export default function BudgetColumn({ type, items, total, isLoading, onAdd, onUpdateAmount, onRemove }: Props) {
  const theme = THEME[type];
  const sorted = [...items].sort((a, b) => b.amount - a.amount);

  return (
    <section className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-4 md:p-5 flex flex-col min-w-0">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-text-primary">{theme.title}</h2>
        <span className={`text-sm font-bold tabular-nums ${theme.total}`}>{fmtMXN(total)}</span>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-text-muted">Cargando…</p>
      ) : sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">{theme.empty}</p>
      ) : (
        <ul className="divide-y divide-white/5 -mx-1">
          {sorted.map((item) => {
            const { icon: Icon, label } = findCategory(type, item.category);
            return (
              <li key={item.id} className="group flex items-center gap-3 px-1 py-2.5">
                <span className={`shrink-0 rounded-xl p-2 ${theme.icon}`}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{item.label ?? item.category}</p>
                  {item.label && <p className="text-xs text-text-muted truncate" title={label}>{item.category}</p>}
                </div>
                <div className="w-28 sm:w-32 shrink-0">
                  <InlineNumberInput
                    value={item.amount}
                    onCommit={(v) => { if (v !== null && v > 0) onUpdateAmount(item.id, v); }}
                    ariaLabel={`Monto de ${item.label ?? item.category}`}
                    className="border-transparent bg-transparent hover:border-surface-border focus:bg-surface-base/60 font-semibold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  className="shrink-0 p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  aria-label={`Eliminar ${item.label ?? item.category}`}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-white/10 text-sm font-semibold text-text-secondary hover:text-brand-green-light hover:border-brand-green/40 hover:bg-brand-green/5 transition-colors"
      >
        <Plus size={16} /> {theme.add}
      </button>
    </section>
  );
}
