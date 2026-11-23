import { useState } from 'react';

interface InlineNumberInputProps {
  value: number | null;
  onCommit: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}

const BASE_CLASS =
  'w-full min-w-0 bg-surface-base/60 border border-surface-border text-text-primary rounded-lg px-2.5 py-1.5 text-base sm:text-sm tabular-nums focus:outline-none focus:border-brand-green disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-text-muted/60';

const toDraft = (value: number | null) => (value === null ? '' : String(value));

/** Input numérico con auto-guardado: confirma en blur o Enter, Escape descarta. */
export function InlineNumberInput({ value, onCommit, placeholder = '—', disabled, ariaLabel, className = '' }: InlineNumberInputProps) {
  const [draft, setDraft] = useState(toDraft(value));
  // Re-sincroniza el borrador cuando el valor cambia desde fuera (carga de otro mes, rollback)
  const [syncedValue, setSyncedValue] = useState(value);
  if (syncedValue !== value) {
    setSyncedValue(value);
    setDraft(toDraft(value));
  }

  const commit = () => {
    const trimmed = draft.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    if (parsed !== null && !Number.isFinite(parsed)) {
      setDraft(toDraft(value));
      return;
    }
    const next = parsed === null ? null : Math.round(parsed * 100) / 100;
    if (next !== value) onCommit(next);
  };

  return (
    <input
      type="number"
      inputMode="decimal"
      step="0.01"
      value={draft}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setDraft(toDraft(value));
          e.currentTarget.blur();
        }
      }}
      className={`${BASE_CLASS} text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${className}`}
    />
  );
}

interface InlineTextInputProps {
  value: string | null;
  onCommit: (value: string | null) => void;
  placeholder?: string;
  ariaLabel: string;
}

export function InlineTextInput({ value, onCommit, placeholder, ariaLabel }: InlineTextInputProps) {
  const [draft, setDraft] = useState(value ?? '');
  const [syncedValue, setSyncedValue] = useState(value);
  if (syncedValue !== value) {
    setSyncedValue(value);
    setDraft(value ?? '');
  }

  const commit = () => {
    const next = draft.trim() === '' ? null : draft.trim();
    if (next !== value) onCommit(next);
  };

  return (
    <input
      type="text"
      maxLength={500}
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setDraft(value ?? '');
          e.currentTarget.blur();
        }
      }}
      className={`${BASE_CLASS} text-left`}
    />
  );
}
