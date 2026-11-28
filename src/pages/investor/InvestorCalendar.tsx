import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { API, authHeaders, fmt } from '../../components/investor/investorTypes';
import { shortId, type CalendarDay, type InvestorCalendar as CalendarData } from '../../components/investor/walletTypes';
import { RatingBadge, cardCls } from '../../components/investor/investorUi';
import { todayMx } from '../../utils/dates';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

// 'YYYY-MM-DD' → fecha local sin desfase de zona (mediodía)
const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};
const longDate = (key: string) =>
  parseKey(key).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

async function fetchCalendar(year: number, month: number) {
  const { data } = await axios.get<CalendarData>(`${API}/investor/calendar`, { params: { month, year }, headers: authHeaders() });
  return data;
}

function SummaryCard({ title, total, count, principal, interest }: { title: string; total: number; count: number; principal: number; interest: number }) {
  return (
    <div className={`${cardCls} p-4`}>
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-extrabold text-brand-green-light tabular-nums mt-1">{fmt(total)}</p>
      <p className="text-xs text-text-muted mt-1">
        {count} {count === 1 ? 'pago' : 'pagos'} · Capital {fmt(principal)} + Interés {fmt(interest)}
      </p>
    </div>
  );
}

// [INVESTOR, ADMIN, SUPER_ADMIN] /investor/calendar — pagos esperados (mi parte) por día
export default function InvestorCalendar() {
  const today = todayMx();
  const [ty, tm] = today.split('-').map(Number);
  const [view, setView] = useState({ year: ty, month: tm });
  const [data, setData] = useState<CalendarData | null>(null);
  const [todayData, setTodayData] = useState<CalendarDay | null>(null);
  const [selected, setSelected] = useState<string>(today);

  useEffect(() => {
    fetchCalendar(view.year, view.month)
      .then((d) => {
        setData(d);
        // Al cambiar de mes: hoy si cae en el mes, si no el primer día con pagos
        const inMonth = today.startsWith(`${view.year}-${pad(view.month)}`);
        setSelected((prev) => (prev.startsWith(`${view.year}-${pad(view.month)}`) ? prev : inMonth ? today : d.days[0]?.date ?? keyOf(view.year, view.month, 1)));
      })
      .catch(() => toast.error('No se pudo cargar el calendario'));
  }, [view, today]);

  // "Pagos de hoy" siempre es del día actual, aunque se navegue a otro mes
  useEffect(() => {
    fetchCalendar(ty, tm)
      .then((d) => setTodayData(d.days.find((x) => x.date === today) ?? null))
      .catch(() => setTodayData(null));
  }, [ty, tm, today]);

  const byDate = useMemo(() => new Map((data?.days ?? []).map((d) => [d.date, d])), [data]);

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month - 1, 1);
    const daysInMonth = new Date(view.year, view.month, 0).getDate();
    const offset = (first.getDay() + 6) % 7; // lunes = 0
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [view]);

  const move = (delta: number) => {
    setData(null);
    setView(({ year, month }) => {
      const d = new Date(year, month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };

  const monthName = new Date(view.year, view.month - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const selectedDay = byDate.get(selected);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Calendario</h1>
        <p className="text-text-secondary mt-1 text-sm md:text-base">Tu parte de cada cuota: capital + interés neto (ya sin comisión).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* ── Izquierda: calendario + resúmenes ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className={`${cardCls} p-4 sm:p-5`}>
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => move(-1)} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors" aria-label="Mes anterior"><ChevronLeft size={18} /></button>
              <p className="text-base font-bold text-text-primary capitalize flex items-center gap-2">
                {monthName}
                {data === null && <Loader2 size={14} className="animate-spin text-text-muted" />}
              </p>
              <button type="button" onClick={() => move(1)} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors" aria-label="Mes siguiente"><ChevronRight size={18} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w) => <span key={w} className="text-[11px] font-semibold text-text-muted uppercase py-1">{w}</span>)}
              {cells.map((day, i) => {
                if (day === null) return <span key={`e${i}`} />;
                const key = keyOf(view.year, view.month, day);
                const hasPayments = byDate.has(key);
                const isSelected = key === selected;
                const isToday = key === today;
                return (
                  <button
                    key={key} type="button" onClick={() => setSelected(key)}
                    aria-label={`${longDate(key)}${hasPayments ? ', con pagos' : ''}`} aria-pressed={isSelected}
                    className="flex items-center justify-center py-0.5"
                  >
                    <span className={`w-9 h-9 flex items-center justify-center rounded-full text-sm tabular-nums transition-all ${
                      hasPayments
                        ? isSelected ? 'bg-brand-green text-white font-bold shadow-lg shadow-brand-green/30' : 'bg-brand-green/15 text-brand-green-light font-bold border border-brand-green/40 hover:bg-brand-green/25'
                        : isSelected ? 'bg-surface-elevated text-text-primary font-semibold' : 'text-text-secondary hover:bg-surface-elevated/60'
                    } ${isToday && !isSelected ? 'ring-1 ring-text-muted' : ''}`}>
                      {day}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-brand-green/15 border border-brand-green/40" /> Con pagos</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full ring-1 ring-text-muted" /> Hoy</span>
            </div>
          </div>

          <SummaryCard
            title="Pagos programados para hoy"
            total={todayData?.total ?? 0} count={todayData?.payments.length ?? 0}
            principal={todayData?.totalPrincipal ?? 0} interest={todayData?.totalNetInterest ?? 0}
          />
          <SummaryCard
            title={`Pagos programados del mes`}
            total={data?.monthTotal.total ?? 0} count={data?.monthTotal.paymentsCount ?? 0}
            principal={data?.monthTotal.principal ?? 0} interest={data?.monthTotal.netInterest ?? 0}
          />
          {data && data.monthTotal.received > 0 && (
            <p className="text-xs text-text-muted -mt-2 px-1">
              Recibido este mes: <span className="text-brand-green-light font-semibold">{fmt(data.monthTotal.received)}</span> · Pendiente: {fmt(data.monthTotal.pending)}
            </p>
          )}
        </div>

        {/* ── Derecha: pagos del día seleccionado ── */}
        <section className="lg:col-span-3 flex flex-col gap-4" aria-live="polite">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg font-bold text-text-primary first-letter:uppercase">Pagos del {longDate(selected)}</h2>
            {selectedDay && <p className="text-sm text-text-secondary">Total del día: <span className="font-extrabold text-brand-green-light tabular-nums">{fmt(selectedDay.total)}</span></p>}
          </div>

          {!selectedDay ? (
            <div className={`${cardCls} p-10 text-center`}>
              <CalendarDays size={28} className="mx-auto text-text-muted mb-2" />
              <p className="text-text-secondary text-sm">No tienes pagos programados este día.</p>
              {data && data.days.length > 0 && <p className="text-text-muted text-xs mt-1">Los días marcados en verde tienen pagos.</p>}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {selectedDay.payments.map((p) => {
                const isPaid = p.installmentStatus === 'PAID';
                const isOverdue = p.installmentStatus === 'OVERDUE';
                return (
                  <li key={p.installmentId} className={`${cardCls} p-4 flex flex-col gap-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <RatingBadge rating={p.rating} level={p.level} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{p.purpose}</p>
                          <p className="text-xs text-text-muted font-mono">#{shortId(p.loanId)} · Cuota {p.installmentNumber}</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        isPaid ? 'bg-brand-green/15 text-brand-green-light border-brand-green/25'
                          : isOverdue ? 'bg-red-500/15 text-red-400 border-red-500/25'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                      }`}>
                        {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {isPaid ? 'Recibido' : isOverdue ? 'Vencido' : p.installmentStatus === 'PARTIAL' ? 'Parcial' : 'Programado'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center bg-surface-base rounded-xl p-3">
                      <div>
                        <p className="text-[11px] text-text-muted uppercase tracking-wider">Capital</p>
                        <p className="text-sm font-semibold text-text-primary tabular-nums">{fmt(p.principal)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-text-muted uppercase tracking-wider">+ Interés neto</p>
                        <p className="text-sm font-semibold text-brand-green-light tabular-nums">{fmt(p.netInterest)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-text-muted uppercase tracking-wider">= Total</p>
                        <p className="text-sm font-extrabold text-text-primary tabular-nums">{fmt(p.total)}</p>
                      </div>
                    </div>
                    {p.installmentStatus === 'PARTIAL' && (
                      <p className="text-xs text-text-muted">Recibido hasta ahora: {fmt(p.receivedAmount)}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
