import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { MONTH_NAMES } from '../utils/journalWeeks';

interface MonthYearPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  isSaving: boolean;
  lastSavedAt: number | null;
}

const SELECT_CLASS =
  'bg-surface-base border border-surface-border text-text-primary rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-brand-green';

export function MonthYearPicker({ year, month, onChange, isSaving, lastSavedAt }: MonthYearPickerProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Set([...Array.from({ length: 6 }, (_, i) => currentYear - 4 + i), year])).sort((a, b) => a - b);

  const shift = (delta: number) => {
    const date = new Date(year, month - 1 + delta, 1);
    onChange(date.getFullYear(), date.getMonth() + 1);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => shift(-1)} className="p-2 rounded-lg bg-surface-elevated/60 text-text-secondary hover:text-text-primary transition-colors" aria-label="Mes anterior">
          <ChevronLeft size={18} />
        </button>
        <select value={month} onChange={(e) => onChange(year, Number(e.target.value))} className={SELECT_CLASS} aria-label="Mes">
          {MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
        </select>
        <select value={year} onChange={(e) => onChange(Number(e.target.value), month)} className={SELECT_CLASS} aria-label="Año">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button type="button" onClick={() => shift(1)} className="p-2 rounded-lg bg-surface-elevated/60 text-text-secondary hover:text-text-primary transition-colors" aria-label="Mes siguiente">
          <ChevronRight size={18} />
        </button>
      </div>

      <span className="text-xs text-text-muted flex items-center gap-1.5" aria-live="polite">
        {isSaving ? (
          <><Loader2 size={12} className="animate-spin" /> Guardando…</>
        ) : lastSavedAt ? (
          <><Check size={12} className="text-brand-green-light" /> Guardado</>
        ) : (
          'Los cambios se guardan automáticamente · montos en USD'
        )}
      </span>
    </div>
  );
}
