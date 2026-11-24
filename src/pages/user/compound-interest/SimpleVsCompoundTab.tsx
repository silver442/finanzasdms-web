import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtCompact, fmtMXN, fmtRate, WEEKS_PER_MONTH, WEEKS_PER_YEAR, yearlyComparison } from './utils/calculations';
import { ChartCard, ChartLegend, ChartTooltip, GainBadge, KpiCard, NumberSliderField, QuickPicks, TableCard } from './components/ui';
import { AXIS_PROPS, GRID_STROKE, SERIES_COLORS, TD, TH, TR } from './components/theme';

const RATE_PICKS = [10, 12, 15].map((v) => ({ value: v, label: `${v}%` }));
const YEAR_PICKS = [10, 20, 30].map((v) => ({ value: v, label: `${v} años` }));

const LEGEND = [
  { label: 'Ahorrador', color: SERIES_COLORS.saver, dashed: true },
  { label: 'Interés Simple', color: SERIES_COLORS.simple },
  { label: 'Interés Compuesto', color: SERIES_COLORS.compound },
];

export default function SimpleVsCompoundTab() {
  const [weekly, setWeekly] = useState(100);
  const [ratePct, setRatePct] = useState(10);
  const [years, setYears] = useState(10);

  const annual = weekly * WEEKS_PER_YEAR;
  const rows = useMemo(() => yearlyComparison(annual, ratePct / 100, years), [annual, ratePct, years]);
  const last = rows[rows.length - 1] ?? { saver: 0, simple: 0, compound: 0 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <NumberSliderField
          label="¿Cuánto deseas ahorrar a la semana?"
          value={weekly}
          onChange={setWeekly}
          min={0}
          max={100000}
          sliderMax={5000}
          step={50}
          prefix="$"
          hint={<>Mensual <b className="text-text-secondary">{fmtMXN(weekly * WEEKS_PER_MONTH)}</b> · Anual <b className="text-text-secondary">{fmtMXN(annual)}</b></>}
        />
        <NumberSliderField label="Rendimiento anual (%)" value={ratePct} onChange={setRatePct} min={0} max={100} sliderMax={30} step={0.5} suffix="%">
          <QuickPicks ariaLabel="Rendimiento rápido" options={RATE_PICKS} value={ratePct} onChange={setRatePct} />
        </NumberSliderField>
        <NumberSliderField label="Plazo en años" value={years} onChange={(v) => setYears(Math.max(1, Math.round(v)))} min={1} max={60} sliderMax={40} step={1} suffix="años">
          <QuickPicks ariaLabel="Plazo rápido" options={YEAR_PICKS} value={years} onChange={setYears} />
        </NumberSliderField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <KpiCard label="Ahorrador" value={fmtMXN(last.saver)} swatch={SERIES_COLORS.saver} />
        <KpiCard label="Interés Simple" value={fmtMXN(last.simple)} swatch={SERIES_COLORS.simple} />
        <KpiCard label="Interés Compuesto" value={fmtMXN(last.compound)} swatch={SERIES_COLORS.compound} highlight>
          <GainBadge>+{fmtMXN(last.compound - last.simple)} vs Simple</GainBadge>
          <GainBadge>+{fmtMXN(last.compound - last.saver)} vs Ahorrador</GainBadge>
        </KpiCard>
      </div>

      <TableCard title="Año por año">
        <thead>
          <tr>
            <th className={TH}>Año</th>
            <th className={TH}>Ahorrador</th>
            <th className={TH}>Interés Simple</th>
            <th className={TH}>Interés Compuesto</th>
            <th className={TH}>Ventaja Compuesto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year} className={TR}>
              <td className={TD}>{r.year}</td>
              <td className={TD}>{fmtMXN(r.saver)}</td>
              <td className={TD}>{fmtMXN(r.simple)}</td>
              <td className={`${TD} font-bold`}>{fmtMXN(r.compound)}</td>
              <td className={`${TD} text-brand-green-light font-semibold`} title={`+${fmtMXN(r.compound - r.saver)} vs Ahorrador`}>
                +{fmtMXN(r.compound - r.simple)}
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <p className="text-xs text-text-muted">Ventaja Compuesto = Interés Compuesto − Interés Simple. Ahorro anual = semanal × {WEEKS_PER_YEAR}.</p>

      <ChartCard title={`Crecimiento en ${years} ${years === 1 ? 'año' : 'años'} al ${fmtRate(ratePct / 100)} anual`} legend={<ChartLegend items={LEGEND} />}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 24, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="compoundFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_COLORS.compound} stopOpacity={0.35} />
                <stop offset="100%" stopColor={SERIES_COLORS.compound} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="year" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} tickFormatter={fmtCompact} width={72} />
            <Tooltip content={(props) => <ChartTooltip {...props} labelPrefix="Año" />} cursor={{ stroke: '#64748B', strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey="saver" name="Ahorrador" stroke={SERIES_COLORS.saver} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="simple" name="Interés Simple" stroke={SERIES_COLORS.simple} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="compound" name="Interés Compuesto" stroke={SERIES_COLORS.compound} strokeWidth={2.5} fill="url(#compoundFill)" activeDot={{ r: 5 }} isAnimationActive={false}>
              <LabelList
                dataKey="compound"
                content={({ index, x, y, value }) =>
                  index === rows.length - 1 ? (
                    <text x={Number(x)} y={Number(y) - 10} textAnchor="end" fill="#F1F5F9" fontSize={12} fontWeight={700}>{fmtCompact(Number(value))}</text>
                  ) : null
                }
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
