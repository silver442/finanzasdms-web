import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { Currency } from '../types';
import { coinColor } from '../utils/coinColors';

interface Slice {
  symbol: string;
  value: number;
}

interface Props {
  slices: Slice[];
  currency: Currency;
  formattedTotal: string;
}

const formatShare = (ratio: number) =>
  new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ratio);

export default function PortfolioDistributionCard({ slices, currency, formattedTotal }: Props) {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const sorted = slices.filter((s) => s.value > 0).sort((a, b) => b.value - a.value);

  return (
    <div className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-5 md:p-6 lg:h-full">
      <h2 className="flex items-center gap-3 text-base font-semibold text-text-primary mb-4">
        <PieChartIcon size={20} className="text-brand-green-light" /> Distribución del Portafolio
      </h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-text-muted py-8 text-center">Aún no tienes monedas compradas.</p>
      ) : (
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-5">
          <div className="relative w-44 h-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sorted} dataKey="value" nameKey="symbol" innerRadius="74%" outerRadius="100%" stroke="none" paddingAngle={sorted.length > 1 ? 1 : 0} isAnimationActive={false}>
                  {sorted.map((s) => <Cell key={s.symbol} fill={coinColor(s.symbol)} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <span className="text-base font-bold text-white tabular-nums leading-tight break-all">{formattedTotal}</span>
              <span className="text-xs text-text-secondary">{currency}</span>
            </div>
          </div>

          <ul className="w-full bg-surface-base/40 border border-white/5 rounded-xl divide-y divide-white/5 max-h-44 overflow-y-auto">
            {sorted.map((s) => (
              <li key={s.symbol} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 font-medium text-text-primary">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: coinColor(s.symbol) }} />
                  {s.symbol}
                </span>
                <span className="text-text-secondary tabular-nums">{formatShare(s.value / total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
