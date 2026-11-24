import { useState } from 'react';
import { Pencil, RotateCcw } from 'lucide-react';
import type { CurrencyState } from '../hooks/useCurrency';
import { SegmentedToggle } from './SegmentedToggle';

type Props = Pick<CurrencyState, 'currency' | 'setCurrency' | 'rate' | 'isManual' | 'setOverride'>;

/** Switch USD/MXN con el tipo de cambio editable (ajuste manual guardado en localStorage). */
export function CurrencyControls({ currency, setCurrency, rate, isManual, setOverride }: Props) {
  const [rateDraft, setRateDraft] = useState<string | null>(null);

  const commitRate = () => {
    if (rateDraft === null) return;
    const value = Number(rateDraft);
    if (value > 0 && Math.abs(value - rate) > 1e-6) setOverride(Math.round(value * 10000) / 10000);
    setRateDraft(null);
  };

  return (
    <>
      <SegmentedToggle ariaLabel="Divisa" value={currency} onChange={setCurrency} options={[{ value: 'USD', label: 'USD' }, { value: 'MXN', label: 'MXN' }]} />

      <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-text-secondary bg-surface-card/60 border border-white/10 rounded-xl px-3 py-2">
        <span className="whitespace-nowrap text-text-primary">1 USD =</span>
        {rateDraft === null ? (
          <button onClick={() => setRateDraft(String(rate))} className="font-bold text-text-primary hover:text-brand-green-light inline-flex items-center gap-1 transition-colors" title="Editar tipo de cambio">
            ${rate.toFixed(2)} MXN <Pencil size={12} className="text-brand-green-light" />
          </button>
        ) : (
          <input
            autoFocus
            type="number"
            step="0.0001"
            min="0"
            value={rateDraft}
            onChange={(e) => setRateDraft(e.target.value)}
            onBlur={commitRate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') setRateDraft(null);
            }}
            aria-label="Tipo de cambio USD a MXN"
            className="w-20 bg-surface-base border border-surface-border rounded px-1.5 py-0.5 text-base sm:text-xs text-text-primary focus:outline-none focus:border-brand-green"
          />
        )}
        {isManual && rateDraft === null && (
          <button onClick={() => setOverride(null)} className="ml-1 text-text-muted hover:text-text-primary transition-colors" title="Restablecer al tipo de cambio de mercado" aria-label="Restablecer tipo de cambio">
            <RotateCcw size={12} />
          </button>
        )}
      </div>
    </>
  );
}
