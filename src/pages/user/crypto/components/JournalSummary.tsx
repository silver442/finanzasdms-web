import { Target, TrendingUp, TrendingDown, CalendarCheck } from 'lucide-react';
import { formatMoney } from '../utils/format';

interface JournalSummaryProps {
  total: number;
  goalTotal: number;
  green: number;
  red: number;
  unitLabel: 'Días' | 'Semanas';
}

const CARD = 'bg-surface-card/60 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/5 shadow-card';

export function JournalSummary({ total, goalTotal, green, red, unitLabel }: JournalSummaryProps) {
  const isPositive = total >= 0;
  const progress = goalTotal > 0 ? Math.max(0, Math.min(1, total / goalTotal)) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
      <div className={`p-4 md:p-5 rounded-2xl border backdrop-blur-md shadow-card ${isPositive ? 'bg-brand-green/[6%] border-brand-green/20' : 'bg-red-500/[6%] border-red-500/20'}`}>
        <h2 className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2 ${isPositive ? 'text-brand-green-light' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />} Ganancia / Pérdida del mes
        </h2>
        <p className={`text-2xl md:text-3xl font-extrabold tabular-nums ${isPositive ? 'text-brand-green-light' : 'text-red-400'}`}>
          {total > 0 ? '+' : ''}{formatMoney(total)}
        </p>
      </div>

      <div className={CARD}>
        <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Target size={14} /> Meta acumulada</h2>
        <p className="text-xl md:text-2xl font-bold text-text-primary tabular-nums">{formatMoney(goalTotal)}</p>
        <div className="mt-3 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
          <div className="h-full rounded-full bg-brand-green transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="text-xs text-text-muted mt-1.5">{goalTotal > 0 ? `${Math.round(progress * 100)}% de avance` : 'Sin metas definidas'}</p>
      </div>

      <div className={CARD}>
        <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><CalendarCheck size={14} /> {unitLabel} en verde vs. en rojo</h2>
        <p className="text-xl md:text-2xl font-bold tabular-nums">
          <span className="text-brand-green-light">{green}</span>
          <span className="text-text-muted mx-2">/</span>
          <span className="text-red-400">{red}</span>
        </p>
      </div>
    </div>
  );
}
