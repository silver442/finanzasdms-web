import { useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { MONTH_NAMES } from '../crypto/utils/journalWeeks';
import { todayMx } from '../../../utils/dates';
import { useBudget } from './useBudget';
import type { BudgetType } from './categories';
import BudgetColumn from './BudgetColumn';
import AddBudgetItemModal from './AddBudgetItemModal';
import SpendingBreakdown from './SpendingBreakdown';
import { fmtMXN, fmtPercent } from './format';

const CARD = 'bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-4 md:p-5 min-w-0';

function currentMonth() {
  const [y, m] = todayMx().split('-').map(Number);
  return { year: y, month: m };
}

export default function Budget() {
  const [{ year, month }, setPeriod] = useState(currentMonth);
  const [addingType, setAddingType] = useState<BudgetType | null>(null);
  const { items, summary, isLoading, isCopying, addItem, updateItem, removeItem, copyPrevious } = useBudget(year, month);

  const shift = (delta: number) => {
    const date = new Date(year, month - 1 + delta, 1);
    setPeriod({ year: date.getFullYear(), month: date.getMonth() + 1 });
  };

  const incomes = items.filter((i) => i.type === 'INCOME');
  const expenses = items.filter((i) => i.type === 'EXPENSE');
  const spentRatio = summary.totalIncome > 0 ? summary.totalExpense / summary.totalIncome : summary.totalExpense > 0 ? 1 : 0;
  const isOver = summary.balance < 0;
  const isEmpty = !isLoading && items.length === 0;
  const progressColor = isOver ? 'bg-red-400' : spentRatio >= 0.9 ? 'bg-amber-400' : 'bg-brand-green';

  return (
    <div className="p-4 sm:p-6 md:p-8 text-white font-sans max-w-6xl mx-auto relative space-y-5 md:space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <Wallet className="w-10 h-10 md:w-12 md:h-12 shrink-0 text-brand-green-light" strokeWidth={2.5} />
          <div className="min-w-0">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white">Presupuesto Mensual</h1>
            <p className="text-sm text-text-secondary mt-1">Lo que entra, lo que sale y lo que te queda.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center bg-surface-card/60 border border-white/10 rounded-xl p-1">
            <button type="button" onClick={() => shift(-1)} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60 transition-colors" aria-label="Mes anterior">
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-36 text-center text-sm sm:text-base font-semibold text-text-primary tabular-nums" aria-live="polite">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button type="button" onClick={() => shift(1)} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60 transition-colors" aria-label="Mes siguiente">
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => void copyPrevious()}
            disabled={isCopying || isLoading}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors disabled:opacity-50 ${isEmpty ? 'border-brand-green/40 text-brand-green-light bg-brand-green/10 hover:bg-brand-green/20' : 'border-white/10 text-text-secondary bg-surface-card/60 hover:text-text-primary'}`}
            title="Trae los registros del mes anterior que aún no estén en este mes"
          >
            <Copy size={16} /> {isCopying ? 'Copiando…' : 'Copiar mes anterior'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className={CARD}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-green-light mb-2 flex items-center gap-2"><TrendingUp size={14} /> Ingresos del mes</h2>
          <p className="text-2xl md:text-3xl font-extrabold text-text-primary tabular-nums">{fmtMXN(summary.totalIncome)}</p>
        </div>
        <div className={CARD}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-2"><TrendingDown size={14} /> Gastos del mes</h2>
          <p className="text-2xl md:text-3xl font-extrabold text-text-primary tabular-nums">{fmtMXN(summary.totalExpense)}</p>
        </div>
        <div className={`p-4 md:p-5 rounded-2xl border backdrop-blur-md shadow-card min-w-0 ${isOver ? 'bg-red-500/[6%] border-red-500/20' : 'bg-brand-green/[6%] border-brand-green/20'}`}>
          <h2 className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2 ${isOver ? 'text-red-400' : 'text-brand-green-light'}`}><Wallet size={14} /> Disponible</h2>
          <p className={`text-2xl md:text-3xl font-extrabold tabular-nums ${isOver ? 'text-red-400' : 'text-text-primary'}`}>{fmtMXN(summary.balance)}</p>
          <div className="mt-3 h-1.5 rounded-full bg-surface-elevated overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(spentRatio * 100)} aria-label="Porcentaje del ingreso gastado">
            <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${Math.min(1, spentRatio) * 100}%` }} />
          </div>
          <p className="text-xs text-text-muted mt-1.5">
            {summary.totalIncome > 0 ? `${fmtPercent(spentRatio)} del ingreso gastado` : summary.totalExpense > 0 ? 'Sin ingresos registrados' : 'Registra tus ingresos para empezar'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
        <BudgetColumn
          type="INCOME"
          items={incomes}
          total={summary.totalIncome}
          isLoading={isLoading}
          onAdd={() => setAddingType('INCOME')}
          onUpdateAmount={(id, amount) => void updateItem(id, { amount })}
          onRemove={(item) => void removeItem(item)}
        />
        <BudgetColumn
          type="EXPENSE"
          items={expenses}
          total={summary.totalExpense}
          isLoading={isLoading}
          onAdd={() => setAddingType('EXPENSE')}
          onUpdateAmount={(id, amount) => void updateItem(id, { amount })}
          onRemove={(item) => void removeItem(item)}
        />
      </div>

      {expenses.length > 0 && <SpendingBreakdown expenses={expenses} />}

      {addingType && <AddBudgetItemModal key={addingType} type={addingType} onSave={addItem} onClose={() => setAddingType(null)} />}
    </div>
  );
}
