import { RotateCcw } from 'lucide-react';
import { InlineNumberInput } from './InlineInput';

interface BalanceFieldProps {
  label: string;
  value: number | null;
  isManual: boolean;
  /** Saldo final de un periodo en curso: es el valor actual del portafolio y aún cambia */
  isLive?: boolean;
  onCommit: (value: number | null) => void;
  ariaLabel: string;
  /** Oculta la etiqueta visible (la tabla de Swing ya la trae en el encabezado) */
  hideLabel?: boolean;
}

/** Saldo calculado automáticamente que se puede corregir a mano; "Restablecer" vuelve al automático. */
export function BalanceField({ label, value, isManual, isLive, onCommit, ariaLabel, hideLabel }: BalanceFieldProps) {
  return (
    <div className="block min-w-0">
      <div className={`flex items-center justify-between gap-1 mb-0.5 text-xs ${hideLabel ? 'justify-end' : ''}`}>
        {!hideLabel && <span className="text-text-muted truncate">{label}</span>}
        {isManual ? (
          <button
            type="button"
            onClick={() => onCommit(null)}
            className="inline-flex items-center gap-0.5 text-amber-400 hover:text-amber-300 transition-colors shrink-0"
            title="Capturado a mano. Clic para volver al saldo automático"
            aria-label={`Restablecer ${ariaLabel} al saldo automático`}
          >
            Manual <RotateCcw size={10} />
          </button>
        ) : isLive && value !== null ? (
          <span className="inline-flex items-center gap-1 text-brand-green-light shrink-0" title="Valor actual del portafolio; se fija a las 00:00">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green-light animate-pulse" /> En curso
          </span>
        ) : null}
      </div>
      <InlineNumberInput
        value={value}
        onCommit={onCommit}
        ariaLabel={ariaLabel}
        className={isManual ? 'border-amber-500/40' : ''}
      />
    </div>
  );
}
