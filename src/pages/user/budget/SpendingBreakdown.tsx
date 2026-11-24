import { BREAKDOWN_COLORS, BREAKDOWN_REST_COLOR } from './categories';
import type { BudgetItem } from './useBudget';
import { fmtMXN, fmtPercent } from './format';

const TOP_N = 3;

/** Barra apilada con las 3 categorías de mayor gasto + "Resto"; cada segmento lleva leyenda con monto y %. */
export default function SpendingBreakdown({ expenses }: { expenses: BudgetItem[] }) {
  const byCategory = new Map<string, number>();
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  const total = [...byCategory.values()].reduce((s, v) => s + v, 0);
  if (total <= 0) return null;

  const ranked = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const segments = ranked.slice(0, TOP_N).map(([name, value], i) => ({ name, value, color: BREAKDOWN_COLORS[i] }));
  const rest = ranked.slice(TOP_N).reduce((s, [, v]) => s + v, 0);
  if (rest > 0) segments.push({ name: `Resto (${ranked.length - TOP_N})`, value: rest, color: BREAKDOWN_REST_COLOR });

  return (
    <section className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-4 md:p-5">
      <h2 className="text-sm font-bold text-text-primary mb-3">¿En qué se va tu dinero?</h2>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 bg-surface-elevated" role="img" aria-label={segments.map((s) => `${s.name} ${fmtPercent(s.value / total)}`).join(', ')}>
        {segments.map((s) => (
          <div key={s.name} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} title={`${s.name}: ${fmtMXN(s.value)}`} />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.name} className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} aria-hidden="true" />
            <span className="text-text-secondary truncate">{s.name}</span>
            <span className="ml-auto text-text-primary font-semibold tabular-nums whitespace-nowrap">{fmtPercent(s.value / total)}</span>
            <span className="text-xs text-text-muted tabular-nums whitespace-nowrap">{fmtMXN(s.value)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
