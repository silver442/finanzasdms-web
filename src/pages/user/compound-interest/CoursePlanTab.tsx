import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { COURSE_SESSIONS, coursePlan, fmtCompact, fmtMXN, fmtRate, FREQUENCIES, SCENARIOS, type FrequencyId, type ScenarioId } from './utils/calculations';
import { ChartCard, ChartTooltip, GainBadge, KpiCard, NumberSliderField, SelectField, TableCard } from './components/ui';
import { AXIS_PROPS, GRID_STROKE, SERIES_COLORS, TD, TH, TR } from './components/theme';

const PERIOD_LABEL: Record<FrequencyId, string> = { WEEKLY: 'semana', BIWEEKLY: 'quincena', MONTHLY: 'mes' };

export default function CoursePlanTab() {
  const [perSession, setPerSession] = useState(500);
  const [frequency, setFrequency] = useState<FrequencyId>('WEEKLY');
  const [scenario, setScenario] = useState<ScenarioId>('PROGRESSIVE');

  const { periodsPerYear } = FREQUENCIES.find((f) => f.id === frequency) ?? FREQUENCIES[0];
  const rows = useMemo(() => coursePlan(perSession, periodsPerYear, scenario), [perSession, periodsPerYear, scenario]);
  const last = rows[rows.length - 1];
  const annualGain = last.accumulated * last.rate;
  const rateBySession = useMemo(() => new Map(rows.map((r) => [r.session, r])), [rows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <NumberSliderField
          label="Ahorro por sesión"
          value={perSession}
          onChange={setPerSession}
          min={0}
          max={100000}
          sliderMax={5000}
          step={50}
          prefix="$"
          hint={<>{COURSE_SESSIONS} sesiones × {fmtMXN(perSession)}</>}
        />
        <SelectField
          label="Frecuencia de sesiones"
          value={frequency}
          options={FREQUENCIES}
          onChange={setFrequency}
          hint={`La ganancia de cada periodo es tasa anual ÷ ${periodsPerYear}.`}
        />
        <SelectField label="Escenario de rendimiento" value={scenario} options={SCENARIOS} onChange={setScenario} hint="Tasa anual aplicada al ahorro acumulado de cada sesión." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <KpiCard label={`Total ahorrado en ${COURSE_SESSIONS} sesiones`} value={fmtMXN(last.accumulated)} />
        <KpiCard label="Ganancia por periodo al finalizar" value={fmtMXN(last.periodGain)} swatch={SERIES_COLORS.compound}>
          <GainBadge>por {PERIOD_LABEL[frequency]} al {fmtRate(last.rate)}</GainBadge>
        </KpiCard>
        <KpiCard label="Ganancia anual proyectada al cierre" value={fmtMXN(annualGain)} highlight>
          <GainBadge>{fmtMXN(last.accumulated)} × {fmtRate(last.rate)}</GainBadge>
        </KpiCard>
      </div>

      <TableCard title={`Las ${COURSE_SESSIONS} sesiones`}>
        <thead>
          <tr>
            <th className={TH}>Sesión</th>
            <th className={TH}>% Aprox.</th>
            <th className={TH}>Ahorro Acumulado</th>
            <th className={TH}>Ganancia del Periodo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.session} className={TR}>
              <td className={TD}>{r.session}</td>
              <td className={TD}>{fmtRate(r.rate)}</td>
              <td className={TD}>{fmtMXN(r.accumulated)}</td>
              <td className={`${TD} text-brand-green-light font-semibold`}>+{fmtMXN(r.periodGain)}</td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <ChartCard title="Ganancia del periodo por sesión">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barCategoryGap={2}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="session" {...AXIS_PROPS} interval="preserveStartEnd" />
            <YAxis {...AXIS_PROPS} tickFormatter={fmtCompact} width={64} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              content={(props) => (
                <ChartTooltip
                  {...props}
                  labelPrefix="Sesión"
                  extra={(label) => {
                    const row = rateBySession.get(Number(label));
                    return row ? <p className="text-text-muted mb-1">{fmtRate(row.rate)} anual · acumulado {fmtMXN(row.accumulated)}</p> : null;
                  }}
                />
              )}
            />
            <Bar dataKey="periodGain" name="Ganancia del periodo" fill={SERIES_COLORS.compound} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
