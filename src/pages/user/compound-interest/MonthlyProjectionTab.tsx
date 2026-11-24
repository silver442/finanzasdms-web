import { useMemo, useState } from 'react';
import { Eraser } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtCompact, fmtMXN, fmtRate, monthlyProjection, WEEKS_PER_MONTH } from './utils/calculations';
import { ChartCard, ChartLegend, ChartTooltip, GainBadge, KpiCard, NumberSliderField, QuickPicks, TableCard } from './components/ui';
import { AXIS_PROPS, GRID_STROKE, SERIES_COLORS, TD, TH, TR } from './components/theme';

const MONTH_PICKS = [3, 6, 12, 18, 24].map((v) => ({ value: v, label: `${v}` }));
const MAX_MONTHS = 120;

const LEGEND = [
  { label: 'Ahorrar', color: SERIES_COLORS.saver, dashed: true },
  { label: 'Invertir', color: SERIES_COLORS.compound },
];

export default function MonthlyProjectionTab() {
  const [weekly, setWeekly] = useState(100);
  const [ratePct, setRatePct] = useState(10);
  const [months, setMonths] = useState(12);
  const [extras, setExtras] = useState<Record<number, number>>({});

  const monthly = weekly * WEEKS_PER_MONTH;
  const rows = useMemo(() => monthlyProjection(monthly, ratePct / 100, months, extras), [monthly, ratePct, months, extras]);
  const last = rows[rows.length - 1] ?? { saved: 0, invested: 0, gain: 0 };
  const hasExtras = Object.keys(extras).some((m) => Number(m) <= months);

  const setExtra = (month: number, raw: string) => {
    const value = Math.max(0, Number(raw) || 0);
    setExtras((prev) => {
      const next = { ...prev };
      if (value === 0) delete next[month];
      else next[month] = value;
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <NumberSliderField
          label="Ahorro semanal"
          value={weekly}
          onChange={setWeekly}
          min={0}
          max={100000}
          sliderMax={5000}
          step={50}
          prefix="$"
          hint={<>Ahorro mensual <b className="text-text-secondary">{fmtMXN(monthly)}</b> (semanal × {WEEKS_PER_MONTH})</>}
        />
        <NumberSliderField
          label="Rendimiento anual (%)"
          value={ratePct}
          onChange={setRatePct}
          min={0}
          max={100}
          sliderMax={30}
          step={0.5}
          suffix="%"
          hint={<>Rendimiento mensual equivalente <b className="text-text-secondary">{fmtRate(ratePct / 100 / 12)}</b> (anual ÷ 12)</>}
        />
        <NumberSliderField label="Plazo en meses" value={months} onChange={(v) => setMonths(Math.max(1, Math.round(v)))} min={1} max={MAX_MONTHS} sliderMax={60} step={1} suffix="meses">
          <QuickPicks ariaLabel="Plazo rápido en meses" options={MONTH_PICKS} value={months} onChange={setMonths} />
        </NumberSliderField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <KpiCard label="Total ahorrado" value={fmtMXN(last.saved)} swatch={SERIES_COLORS.saver} />
        <KpiCard label="Total invertido" value={fmtMXN(last.invested)} swatch={SERIES_COLORS.compound} />
        <KpiCard label="Ganancia generada" value={fmtMXN(last.gain)} highlight>
          {last.saved > 0 && <GainBadge>+{fmtRate(last.gain / last.saved)} sobre lo ahorrado</GainBadge>}
        </KpiCard>
      </div>

      <TableCard
        title="Mes a mes"
        action={hasExtras && (
          <button onClick={() => setExtras({})} className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60 rounded-lg px-2 py-1 transition-colors">
            <Eraser size={14} /> Limpiar ingresos extra
          </button>
        )}
      >
        <thead>
          <tr>
            <th className={TH}>Mes</th>
            <th className={TH}>Ingreso adicional</th>
            <th className={TH}>Ahorrar</th>
            <th className={TH}>Invertir</th>
            <th className={TH}>Ganancia acumulada</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month} className={TR}>
              <td className={TD}>{r.month}</td>
              <td className={TD}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={100}
                  value={extras[r.month] ?? ''}
                  placeholder="$0"
                  onChange={(e) => setExtra(r.month, e.target.value)}
                  aria-label={`Ingreso adicional del mes ${r.month}`}
                  className="w-24 sm:w-28 bg-surface-base/60 border border-surface-border rounded-lg px-2 py-1 text-base sm:text-sm text-right text-text-primary tabular-nums focus:outline-none focus:border-brand-green placeholder:text-text-muted/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </td>
              <td className={TD}>{fmtMXN(r.saved)}</td>
              <td className={`${TD} font-bold`}>{fmtMXN(r.invested)}</td>
              <td className={`${TD} text-brand-green-light font-semibold`}>+{fmtMXN(r.gain)}</td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <p className="text-xs text-text-muted">La aportación de cada mes (ahorro + ingreso adicional) se invierte al inicio del mes y rinde la tasa mensual.</p>

      <ChartCard title={`Ahorrar vs. Invertir en ${months} ${months === 1 ? 'mes' : 'meses'}`} legend={<ChartLegend items={LEGEND} />}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="investFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_COLORS.compound} stopOpacity={0.35} />
                <stop offset="100%" stopColor={SERIES_COLORS.compound} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="month" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} tickFormatter={fmtCompact} width={72} />
            <Tooltip content={(props) => <ChartTooltip {...props} labelPrefix="Mes" />} cursor={{ stroke: '#64748B', strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey="saved" name="Ahorrar" stroke={SERIES_COLORS.saver} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="invested" name="Invertir" stroke={SERIES_COLORS.compound} strokeWidth={2.5} fill="url(#investFill)" activeDot={{ r: 5 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
