import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
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
}

export default function PortfolioValueCard({ currency, formattedValue, formattedProfit, profit, yieldRatio, history }: Props) {
  const isPositive = profit >= 0;
  const stroke = isPositive ? '#10B981' : '#F87171';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-green/30 bg-gradient-to-br from-brand-green/15 via-surface-card/80 to-surface-card/60 backdrop-blur-md shadow-card min-h-56 lg:h-full">
      {history.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none" aria-hidden="true">
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

      <div className="relative p-5 md:p-6">
        <h2 className="flex items-center gap-3 text-base font-semibold text-text-primary mb-4">
          <Wallet size={20} className="text-brand-green-light" /> Valor del Portafolio
        </h2>
        <p className="flex items-baseline gap-2 flex-wrap">
          <span className="text-3xl md:text-5xl font-extrabold text-white tabular-nums">{formattedValue}</span>
          <span className="text-lg md:text-xl font-semibold text-text-secondary">{currency}</span>
        </p>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${isPositive ? 'bg-brand-green/20 text-brand-green-light' : 'bg-red-500/15 text-red-400'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {formatPercent(yieldRatio)}
          </span>
          <span className={`text-sm font-medium tabular-nums ${isPositive ? 'text-brand-green-light' : 'text-red-400'}`}>
            ({isPositive ? '+' : ''}{formattedProfit})
          </span>
        </div>
      </div>
    </div>
  );
}
