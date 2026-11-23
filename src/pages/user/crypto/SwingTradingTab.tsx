import { useMemo, useState } from 'react';
import { useTradingJournal, entryResult } from './hooks/useTradingJournal';
import { getSwingWeeks } from './utils/journalWeeks';
import { InlineNumberInput, InlineTextInput } from './components/InlineInput';
import { BalanceField } from './components/BalanceField';
import { CashFlowNote } from './components/CashFlowNote';
import { MonthYearPicker } from './components/MonthYearPicker';
import { JournalSummary } from './components/JournalSummary';
import { ResultValue } from './components/ResultValue';

const shortDate = (date: Date) => date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

export default function SwingTradingTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { entries, goals, isLoading, isSaving, lastSavedAt, saveEntry, saveGoal } = useTradingJournal('SWING', year, month);

  const weeks = useMemo(() => getSwingWeeks(year, month), [year, month]);
  const results = weeks.map((w) => entryResult(entries[w.mondayIso]));

  const monthTotal = results.reduce<number>((sum, r) => sum + (r ?? 0), 0);
  const goalTotal = weeks.reduce((sum, w) => sum + (goals[w.weekNumber] ?? 0), 0);
  const greenWeeks = results.filter((r) => r !== null && r > 0).length;
  const redWeeks = results.filter((r) => r !== null && r < 0).length;

  const weekLabel = (i: number) => (
    <>
      <span className="font-bold text-text-primary">Semana {weeks[i].weekNumber}</span>
      <span className="block text-xs text-text-muted">{shortDate(weeks[i].monday)} – {shortDate(weeks[i].sunday)}</span>
    </>
  );

  const fields = (i: number) => {
    const week = weeks[i];
    const entry = entries[week.mondayIso];
    // En la tabla (md+) la etiqueta ya está en el encabezado
    return {
      initial: (hideLabel: boolean) => (
        <BalanceField
          label="Saldo inicial"
          hideLabel={hideLabel}
          value={entry?.initialBalance ?? null}
          isManual={entry?.initialIsManual ?? false}
          onCommit={(v) => saveEntry(week.mondayIso, { initialBalance: v })}
          ariaLabel={`Saldo inicial de la semana ${week.weekNumber}`}
        />
      ),
      final: (hideLabel: boolean) => (
        <BalanceField
          label="Saldo final"
          hideLabel={hideLabel}
          value={entry?.finalBalance ?? null}
          isManual={entry?.finalIsManual ?? false}
          isLive={entry?.isLive}
          onCommit={(v) => saveEntry(week.mondayIso, { finalBalance: v })}
          ariaLabel={`Saldo final de la semana ${week.weekNumber}`}
        />
      ),
      cashFlow: <CashFlowNote amount={entry?.netCashFlow ?? 0} />,
      goal: (
        <InlineNumberInput value={goals[week.weekNumber] ?? null} placeholder="$0.00" onCommit={(v) => saveGoal(week.weekNumber, v ?? 0)} ariaLabel={`Meta de la semana ${week.weekNumber}`} />
      ),
      notes: (
        <InlineTextInput value={entry?.notes ?? null} placeholder="Notas breves..." onCommit={(v) => saveEntry(week.mondayIso, { notes: v })} ariaLabel={`Notas de la semana ${week.weekNumber}`} />
      ),
    };
  };

  return (
    <div className="space-y-6">
      <MonthYearPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} isSaving={isSaving} lastSavedAt={lastSavedAt} />

      <JournalSummary total={monthTotal} goalTotal={goalTotal} green={greenWeeks} red={redWeeks} unitLabel="Semanas" />

      {isLoading ? (
        <div className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-6 text-center text-sm text-text-muted">Cargando bitácora...</div>
      ) : (
        <>
          {/* ── Móvil: una tarjeta por semana ── */}
          <div className="md:hidden space-y-3">
            {weeks.map((week, i) => {
              const f = fields(i);
              return (
                <section key={week.mondayIso} className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">{weekLabel(i)}</div>
                    <div className="text-right shrink-0">
                      <ResultValue value={results[i]} />
                      {f.cashFlow}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {f.initial(false)}
                    {f.final(false)}
                    <label className="block min-w-0"><span className="block text-xs text-text-muted mb-1">Meta</span>{f.goal}</label>
                    <label className="block min-w-0"><span className="block text-xs text-text-muted mb-1">Notas</span>{f.notes}</label>
                  </div>
                </section>
              );
            })}
          </div>

          {/* ── md+: tabla ── */}
          <div className="hidden md:block bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-surface-base/50 text-text-primary uppercase tracking-wider border-b border-surface-border">
                    <th className="p-4 font-semibold">Semana</th>
                    <th className="p-4 font-semibold text-right">Saldo inicial</th>
                    <th className="p-4 font-semibold text-right">Saldo final</th>
                    <th className="p-4 font-semibold text-right">Resultado</th>
                    <th className="p-4 font-semibold text-right">Meta</th>
                    <th className="p-4 font-semibold">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {weeks.map((week, i) => {
                    const f = fields(i);
                    return (
                      <tr key={week.mondayIso} className="hover:bg-surface-elevated/30 transition-colors">
                        <td className="p-4 whitespace-nowrap">{weekLabel(i)}</td>
                        <td className="p-3 w-40">{f.initial(true)}</td>
                        <td className="p-3 w-40">{f.final(true)}</td>
                        <td className="p-4 text-right whitespace-nowrap"><ResultValue value={results[i]} />{f.cashFlow}</td>
                        <td className="p-3 w-36">{f.goal}</td>
                        <td className="p-3 min-w-48">{f.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
