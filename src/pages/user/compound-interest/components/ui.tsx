import { useId, type ReactNode } from 'react';
import type { TooltipContentProps } from 'recharts';
import { fmtMXN } from '../utils/calculations';
import { CARD } from './theme';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface NumberSliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  /** Tope del slider; el input acepta hasta `max` */
  sliderMax?: number;
  hint?: ReactNode;
  children?: ReactNode;
}

/** Input numérico + slider sincronizados para "jugar" con los valores en vivo. */
export function NumberSliderField({ label, value, onChange, min, max, step, prefix, suffix, sliderMax, hint, children }: NumberSliderFieldProps) {
  const id = useId();
  const rangeMax = sliderMax ?? max;
  return (
    <div className={`${CARD} p-4 flex flex-col gap-3 min-w-0`}>
      <label htmlFor={id} className="text-sm font-semibold text-text-secondary">{label}</label>
      <div className="flex items-center gap-2 bg-surface-base/60 border border-surface-border rounded-xl px-3 py-2 focus-within:border-brand-green">
        {prefix && <span className="text-text-muted">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? min : clamp(Number(e.target.value), min, max))}
          className="w-full min-w-0 bg-transparent text-xl font-bold text-text-primary tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-text-muted whitespace-nowrap">{suffix}</span>}
      </div>
      <input
        type="range"
        min={min}
        max={rangeMax}
        step={step}
        value={clamp(value, min, rangeMax)}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} (deslizador)`}
        className="w-full accent-brand-green cursor-pointer"
      />
      {children}
      {hint && <div className="text-xs text-text-muted">{hint}</div>}
    </div>
  );
}

interface QuickPicksProps {
  options: { value: number; label: string }[];
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}

export function QuickPicks({ options, value, onChange, ariaLabel }: QuickPicksProps) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border transition-colors ${value === o.value ? 'bg-brand-green/25 border-brand-green/60 text-white' : 'border-white/10 text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (value: T) => void;
  hint?: ReactNode;
}

export function SelectField<T extends string>({ label, value, options, onChange, hint }: SelectFieldProps<T>) {
  return (
    <label className={`${CARD} p-4 flex flex-col gap-3 min-w-0`}>
      <span className="text-sm font-semibold text-text-secondary">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full bg-surface-base/60 border border-surface-border rounded-xl px-3 py-2.5 text-base sm:text-sm text-text-primary focus:outline-none focus:border-brand-green"
      >
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      {hint && <span className="text-xs text-text-muted">{hint}</span>}
    </label>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  /** Color de la serie correspondiente en la gráfica */
  swatch?: string;
  highlight?: boolean;
  children?: ReactNode;
}

export function KpiCard({ label, value, swatch, highlight, children }: KpiCardProps) {
  const shell = highlight
    ? 'rounded-2xl border border-brand-green/30 bg-gradient-to-br from-brand-green/15 via-surface-card/80 to-surface-card/60 backdrop-blur-md shadow-card'
    : CARD;
  return (
    <div className={`${shell} p-4 md:p-5 min-w-0`}>
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
        {swatch && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: swatch }} aria-hidden="true" />}
        {label}
      </h3>
      <p className="text-2xl md:text-3xl font-extrabold text-text-primary tabular-nums break-words">{value}</p>
      {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function GainBadge({ children }: { children: ReactNode }) {
  return <span className="bg-brand-green/20 text-brand-green-light text-xs font-bold px-2 py-1 rounded-full tabular-nums">{children}</span>;
}

export function ChartLegend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className={`w-4 border-t-2 ${i.dashed ? 'border-dashed' : ''}`} style={{ borderColor: i.color }} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartCard({ title, legend, children }: { title: string; legend?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${CARD} p-4 md:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        {legend}
      </div>
      <div className="h-72 md:h-80 w-full">{children}</div>
    </section>
  );
}

type ChartTooltipProps = TooltipContentProps & {
  labelPrefix: string;
  /** Línea adicional bajo el encabezado (ej. la tasa de la sesión) */
  extra?: (label: string | number | undefined) => ReactNode;
};

/** Tooltip oscuro: los valores van en tinta de texto, el color solo identifica la serie. */
export function ChartTooltip({ active, payload, label, labelPrefix, extra }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated/95 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 shadow-card text-xs min-w-44">
      <p className="font-semibold text-text-primary mb-1">{labelPrefix} {label}</p>
      {extra?.(label)}
      {[...payload].reverse().map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 text-text-secondary">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} aria-hidden="true" />
          {p.name}
          <span className="ml-auto pl-3 font-bold text-text-primary tabular-nums">{fmtMXN(Number(p.value))}</span>
        </p>
      ))}
    </div>
  );
}

export function TableCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 pt-4 pb-3">
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        {action}
      </div>
      <div className="overflow-auto max-h-[28rem]">
        <table className="w-full text-sm tabular-nums">{children}</table>
      </div>
    </section>
  );
}
