import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { BUDGET_CATEGORIES, type BudgetType } from './categories';
import type { NewBudgetItem } from './useBudget';

interface Props {
  type: BudgetType;
  onSave: (item: NewBudgetItem) => Promise<boolean>;
  onClose: () => void;
}

const INPUT_CLASS =
  'w-full bg-surface-base/60 border border-surface-border text-text-primary rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-brand-green placeholder:text-text-muted/60';

/** Captura rápida: chip de categoría + nota opcional + monto. "Guardar y otro" deja el modal abierto. */
export default function AddBudgetItemModal({ type, onSave, onClose }: Props) {
  const categories = BUDGET_CATEGORIES[type];
  const [category, setCategory] = useState(categories[0].id);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isIncome = type === 'INCOME';
  const parsedAmount = Number(amount);
  const isValid = amount.trim() !== '' && parsedAmount > 0;
  const selected = categories.find((c) => c.id === category) ?? categories[0];

  const save = async (keepOpen: boolean) => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    const ok = await onSave({ type, category, label: label.trim() || null, amount: Math.round(parsedAmount * 100) / 100 });
    setIsSaving(false);
    if (!ok) return;
    if (keepOpen) {
      setLabel('');
      setAmount('');
    } else {
      onClose();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void save(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={isIncome ? 'Agregar ingreso' : 'Agregar gasto'}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        className="bg-surface-card/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-card w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6"
      >
        <div className="flex justify-between items-center gap-3 mb-5">
          <h2 className="text-xl font-bold text-text-primary">{isIncome ? 'Agregar ingreso' : 'Agregar gasto'}</h2>
          <button type="button" onClick={onClose} className="p-1 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-text-secondary mb-2">Categoría</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map(({ id, label: chipLabel, icon: Icon }) => {
              const isActive = id === category;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setCategory(id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${isActive ? 'bg-brand-green/20 border-brand-green/60 text-white' : 'bg-surface-base/40 border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20'}`}
                >
                  <Icon size={16} className={isActive ? 'text-brand-green-light' : 'text-text-muted'} />
                  {chipLabel}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <label className="block">
            <span className="block text-sm font-semibold text-text-secondary mb-1.5">Nota <span className="font-normal text-text-muted">(opcional)</span></span>
            <input type="text" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={selected.hint} className={INPUT_CLASS} />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-text-secondary mb-1.5">Monto</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`${INPUT_CLASS} pl-7 text-right tabular-nums font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
              />
            </div>
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-surface-border">
          <button type="button" onClick={() => void save(true)} disabled={!isValid || isSaving} className="flex-1 bg-surface-elevated/70 hover:bg-surface-elevated text-text-primary py-2.5 rounded-xl border border-white/10 transition-all font-medium disabled:opacity-40 disabled:cursor-not-allowed">
            Guardar y agregar otro
          </button>
          <button type="submit" disabled={!isValid || isSaving} className="flex-1 bg-brand-green hover:bg-brand-green-light text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-brand-green/20 disabled:opacity-40 disabled:cursor-not-allowed">
            {isSaving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
