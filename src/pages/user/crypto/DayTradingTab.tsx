import { useMemo, useState } from 'react';
import { useTradingJournal, entryResult } from './hooks/useTradingJournal';
import { getDayWeeks, WEEKDAY_NAMES } from './utils/journalWeeks';
import { formatMoney } from './utils/format';
import { InlineNumberInput } from './components/InlineInput';
import { BalanceField } from './components/BalanceField';
import { CashFlowNote } from './components/CashFlowNote';
import { MonthYearPicker } from './components/MonthYearPicker';
import { JournalSummary } from './components/JournalSummary';
import { ResultValue } from './components/ResultValue';

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

export default function DayTradingTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { entries, goals, isLoading, isSaving, lastSavedAt, saveEntry, saveGoal } = useTradingJournal('DAY', year, month);

  const weeks = useMemo(() => getDayWeeks(year, month), [year, month]);

  const weekStats = weeks.map((week) => {
    const results = week.days.filter((d) => d.inMonth).map((d) => entryResult(entries[d.iso]));
    const total = results.reduce<number>((sum, r) => sum + (r ?? 0), 0);
    return { total, green: results.filter((r) => r !== null && r > 0).length, red: results.filter((r) => r !== null && r < 0).length };
  });
  const monthTotal = weekStats.reduce((sum, w) => sum + w.total, 0);
  const goalTotal = weeks.reduce((sum, w) => sum + (goals[w.weekNumber] ?? 0), 0);
  const greenDays = weekStats.reduce((sum, w) => sum + w.green, 0);
  const redDays = weekStats.reduce((sum, w) => sum + w.red, 0);

  return (
    <div className="space-y-6">
      <MonthYearPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} isSaving={isSaving} lastSavedAt={lastSavedAt} />

      <JournalSummary total={monthTotal} goalTotal={goalTotal} green={greenDays} red={redDays} unitLabel="Días" />

      {isLoading ? (
        <div className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-6 text-center text-sm text-text-muted">Cargando bitácora...</div>
      ) : (
        <div className="space-y-4">
          {weeks.map((week, i) => {
            const inMonthDays = week.days.filter((d) => d.inMonth);
            const goal = goals[week.weekNumber] ?? null;
            const { total } = weekStats[i];
            const reachedGoal = goal !== null && goal > 0 && total >= goal;

            return (
              <section key={week.weekNumber} className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-4">
                <h3 className="text-sm font-bold text-text-primary mb-3">
                  Semana {week.weekNumber}
                  <span className="text-text-muted font-normal ml-2">
                    {shortDate(inMonthDays[0].iso)} – {shortDate(inMonthDays[inMonthDays.length - 1].iso)}
                  </span>
                </h3>

                <div className="flex flex-col xl:flex-row gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 flex-1 min-w-0">
                    {week.days.map((day, dayIndex) => {
                      const entry = entries[day.iso];
                      if (!day.inMonth) {
                        return (
                          <div key={day.iso} className="hidden xl:flex rounded-xl border border-dashed border-white/5 p-2.5 text-xs text-text-muted/50">
                            {WEEKDAY_NAMES[dayIndex]} {day.day}
                          </div>
                        );
                      }
                      return (
                        <div key={day.iso} className="rounded-xl bg-surface-base/40 border border-white/5 p-2.5 min-w-0">
                          <p className="text-xs font-semibold text-text-secondary mb-2">
                            {WEEKDAY_NAMES[dayIndex]} <span className="text-text-primary">{day.day}</span>
                          </p>
                          <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
                            <BalanceField
                              label="Saldo inicial"
                              value={entry?.initialBalance ?? null}
                              isManual={entry?.initialIsManual ?? false}
                              onCommit={(v) => saveEntry(day.iso, { initialBalance: v })}
                              ariaLabel={`Saldo inicial del ${day.iso}`}
                            />
                            <BalanceField
                              label="Saldo final"
                              value={entry?.finalBalance ?? null}
                              isManual={entry?.finalIsManual ?? false}
                              isLive={entry?.isLive}
                              onCommit={(v) => saveEntry(day.iso, { finalBalance: v })}
                              ariaLabel={`Saldo final del ${day.iso}`}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5 text-xs">
                            <span className="text-text-muted xl:hidden">Resultado</span>
                            <ResultValue value={entryResult(entry)} className="ml-auto truncate" />
                          </div>
                          <CashFlowNote amount={entry?.netCashFlow ?? 0} />
                        </div>
                      );
                    })}
                  </div>

                  <aside className="xl:w-48 shrink-0 grid grid-cols-2 xl:grid-cols-1 gap-3 content-start rounded-xl bg-surface-elevated/40 border border-white/5 p-3">
                    <label className="block min-w-0">
                      <span className="block text-xs text-text-muted mb-1">Meta semanal</span>
                      <InlineNumberInput
                        value={goal}
                        placeholder="$0.00"
                        onCommit={(v) => saveGoal(week.weekNumber, v ?? 0)}
                        ariaLabel={`Meta de la semana ${week.weekNumber}`}
                      />
                    </label>
                    <div className="min-w-0">
                      <span className="block text-xs text-text-muted mb-1">Total semanal</span>
                      <ResultValue value={total} className="text-lg block truncate" />
                      {goal !== null && goal > 0 && (
                        <span className={`text-xs ${reachedGoal ? 'text-brand-green-light' : 'text-text-muted'}`}>
                          {reachedGoal ? 'Meta alcanzada' : `Faltan ${formatMoney(goal - total)}`}
                        </span>
                      )}
                    </div>
                  </aside>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
