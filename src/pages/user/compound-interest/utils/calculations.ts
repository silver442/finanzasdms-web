// Calculadoras de interés compuesto para demostraciones del curso. Funciones puras, montos en MXN.

export const WEEKS_PER_MONTH = 4;
export const WEEKS_PER_YEAR = 48;

export interface YearRow {
  year: number;
  saver: number;
  simple: number;
  compound: number;
}

/** Ahorrador = A·n; Simple = (A·n)(1 + r); Compuesto: saldo_n = (saldo_{n-1} + A)(1 + r). `rate` en decimal. */
export function yearlyComparison(annualSaving: number, rate: number, years: number): YearRow[] {
  const rows: YearRow[] = [];
  let compound = 0;
  for (let n = 1; n <= years; n++) {
    const saver = annualSaving * n;
    compound = (compound + annualSaving) * (1 + rate);
    rows.push({ year: n, saver, simple: saver * (1 + rate), compound });
  }
  return rows;
}

export interface MonthRow {
  month: number;
  extra: number;
  saved: number;
  invested: number;
  gain: number;
}

/** Misma convención que la anual: la aportación del mes (más el ingreso adicional) entra al inicio y rinde r/12. */
export function monthlyProjection(monthlySaving: number, annualRate: number, months: number, extras: Record<number, number>): MonthRow[] {
  const monthlyRate = annualRate / 12;
  const rows: MonthRow[] = [];
  let saved = 0;
  let invested = 0;
  for (let m = 1; m <= months; m++) {
    const extra = extras[m] ?? 0;
    saved += monthlySaving + extra;
    invested = (invested + monthlySaving + extra) * (1 + monthlyRate);
    rows.push({ month: m, extra, saved, invested, gain: invested - saved });
  }
  return rows;
}

export const COURSE_SESSIONS = 24;

export const FREQUENCIES = [
  { id: 'WEEKLY', label: 'Semanal (52/año)', periodsPerYear: 52 },
  { id: 'BIWEEKLY', label: 'Quincenal (24/año)', periodsPerYear: 24 },
  { id: 'MONTHLY', label: 'Mensual (12/año)', periodsPerYear: 12 },
] as const;
export type FrequencyId = (typeof FREQUENCIES)[number]['id'];

// Tasa anual del escenario progresivo: [última sesión del tramo, tasa]
const PROGRESSIVE_SCHEDULE: [number, number][] = [[2, 0.05], [4, 0.1], [8, 0.12], [12, 0.14], [16, 0.15], [20, 0.17], [24, 0.2]];

export const SCENARIOS = [
  { id: 'PROGRESSIVE', label: 'Progresivo del curso (5% → 20%)', rateFor: (s: number) => PROGRESSIVE_SCHEDULE.find(([last]) => s <= last)?.[1] ?? 0.2 },
  { id: 'CONSERVATIVE', label: 'Conservador (12% fijo)', rateFor: () => 0.12 },
  { id: 'MODERATE', label: 'Moderado (15% fijo)', rateFor: () => 0.15 },
  { id: 'ADVANCED', label: 'Avanzado (20% fijo)', rateFor: () => 0.2 },
] as const;
export type ScenarioId = (typeof SCENARIOS)[number]['id'];

export interface SessionRow {
  session: number;
  rate: number;
  accumulated: number;
  periodGain: number;
}

/** Ganancia del periodo = ahorro acumulado × (tasa anual / periodos por año). */
export function coursePlan(perSession: number, periodsPerYear: number, scenario: ScenarioId): SessionRow[] {
  const { rateFor } = SCENARIOS.find((s) => s.id === scenario) ?? SCENARIOS[0];
  return Array.from({ length: COURSE_SESSIONS }, (_, i) => {
    const session = i + 1;
    const rate = rateFor(session);
    const accumulated = perSession * session;
    return { session, rate, accumulated, periodGain: (accumulated * rate) / periodsPerYear };
  });
}

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const MXN_COMPACT = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 1 });

export const fmtMXN = (v: number) => MXN.format(v);
export const fmtCompact = (v: number) => MXN_COMPACT.format(v);
export const fmtRate = (ratio: number) =>
  new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 2 }).format(ratio);
