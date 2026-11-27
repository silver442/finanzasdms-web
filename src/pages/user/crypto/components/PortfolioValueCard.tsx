import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowLeftRight, CircleDollarSign, Coins, Pencil, RotateCcw, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { Currency } from '../types';
import type { HistoryPoint } from '../hooks/usePortfolioHistory';
import { formatPercent } from '../utils/format';

interface Props {
  currency: Currency;
  formattedValue: string;
  formattedProfit: string;
  profit: number;
  yieldRatio: number;
  history: HistoryPoint[];
  /** Permite capturar el valor a mano (tipo celda de Excel) para cuadrarlo con el saldo real del exchange */
  editable?: boolean;
  /** Valor numérico mostrado, con el que arranca la edición */
  editValue?: number;
  isManual?: boolean;
  /** Valor calculado, visible como referencia mientras hay un valor manual */
  formattedAutomatic?: string;
  onManualChange?: (value: number | null) => void;
  formattedInvested: string;
  formattedCash: string;
  onCashClick: () => void;
}

function StatBlock({ icon: Icon, label, value, currency }: { icon: typeof Coins; label: string; value: string; currency: Currency }) {
  return (
    <div className="flex items-center gap-3 min-w-0 rounded-xl bg-surface-base/50 backdrop-blur-sm border border-white/5 px-3 py-2.5">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-brand-green/15 border border-brand-green/20 flex items-center justify-center text-brand-green-light">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <h3 className="text-xs text-text-secondary truncate">{label}</h3>
        <p className="text-base md:text-lg font-bold text-white tabular-nums truncate">
          {value} <span className="text-xs font-medium text-text-secondary">{currency}</span>
        </p>
      </div>
    </div>
  );
}

export default function PortfolioValueCard({ currency, formattedValue, formattedProfit, profit, yieldRatio, history, editable, editValue, isManual, formattedAutomatic, onManualChange, formattedInvested, formattedCash, onCashClick }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const isEditing = draft !== null;
  const isPositive = profit >= 0;
  const stroke = isPositive ? '#10B981' : '#F87171';

  const startEditing = () => setDraft(editValue !== undefined ? String(Math.round(editValue * 100) / 100) : '');

  const commit = () => {
    if (draft === null) return;
    const trimmed = draft.trim();
    setDraft(null);
    // Vacío regresa al cálculo automático; valores inválidos se descartan
    if (trimmed === '') {
      if (isManual) onManualChange?.(null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const next = Math.round(parsed * 100) / 100;
    if (isManual || next !== Math.round((editValue ?? 0) * 100) / 100) onManualChange?.(next);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-green/30 bg-gradient-to-br from-brand-green/15 via-surface-card/80 to-surface-card/60 backdrop-blur-md shadow-card h-full">
      {history.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="portfolioValueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Area type="monotone" dataKey="value" stroke={stroke} strokeWidth={3} fill="url(#portfolioValueFill)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Izquierda: valor (editable), rendimiento y depósitos. Derecha: invertido y efectivo disponible */}
      <div className="relative h-full p-4 md:p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3 min-w-0">
          <h2 className="flex items-center gap-3 text-base font-semibold text-text-primary mb-3">
            <Wallet size={20} className="text-brand-green-light" /> Valor del Portafolio
            {isManual && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">Manual</span>
            )}
          </h2>

          <div className="flex items-baseline gap-2 flex-wrap">
            {isEditing ? (
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                autoFocus
                value={draft}
                aria-label={`Valor del portafolio en ${currency}`}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setDraft(null);
                }}
                className="w-full max-w-xs bg-surface-base/70 border border-brand-green/60 rounded-xl px-3 py-1 text-3xl md:text-4xl font-extrabold text-white tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            ) : editable ? (
              <button
                type="button"
                onClick={startEditing}
                title="Clic para capturar el saldo real de tu exchange"
                className="group inline-flex items-baseline gap-2 text-left rounded-lg -mx-1 px-1 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50 transition-colors"
              >
                <span className="text-3xl md:text-4xl font-extrabold text-white tabular-nums">{formattedValue}</span>
                <Pencil size={16} className="self-center text-text-muted opacity-60 md:opacity-0 md:group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" aria-hidden="true" />
              </button>
            ) : (
              <span className="text-3xl md:text-4xl font-extrabold text-white tabular-nums">{formattedValue}</span>
            )}
            <span className="text-lg md:text-xl font-semibold text-text-secondary">{currency}</span>
            {isManual && !isEditing && (
              <button
                type="button"
                onClick={() => onManualChange?.(null)}
                className="self-center p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                title="Volver al cálculo automático"
                aria-label="Volver al cálculo automático del valor del portafolio"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
          {isManual && formattedAutomatic && (
            <p className="mt-1 text-xs text-text-muted tabular-nums">Calculado: {formattedAutomatic} {currency}</p>
          )}

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${isPositive ? 'bg-brand-green/20 text-brand-green-light' : 'bg-red-500/15 text-red-400'}`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {formatPercent(yieldRatio)}
            </span>
            <span className={`text-sm font-medium tabular-nums ${isPositive ? 'text-brand-green-light' : 'text-red-400'}`}>
              ({isPositive ? '+' : ''}{formattedProfit})
            </span>
          </div>
          <button type="button" onClick={onCashClick} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-green-light hover:text-brand-green-light/80 transition-colors">
            <ArrowLeftRight size={14} /> Depositar / Retirar
          </button>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 md:auto-rows-fr gap-3">
          <StatBlock icon={Coins} label="Total Invertido" value={formattedInvested} currency={currency} />
          <StatBlock icon={CircleDollarSign} label={`Disponible (${currency})`} value={formattedCash} currency={currency} />
        </div>
      </div>
    </div>
  );
}
