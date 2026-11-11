/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Briefcase, User, Phone, ChevronRight } from 'lucide-react';

interface Installment {
  id: string; number: number; dueDate: string;
  amountDue: string | number; amountPaid: string | number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
}

interface LoanUser {
  id: string; email: string; name?: string; phone?: string;
}

interface ActiveLoan {
  id: string; concept: string;
  amount: string | number; interestRate: string | number;
  termQuantity: number; termUnit: string;
  startDate: string;
  user: LoanUser;
  installments: Installment[];
}

interface LoanMetrics {
  loan: ActiveLoan;
  totalDue: number;
  paid: number;
  pending: number;
  pct: number;
  paidCount: number;
  nextInst?: Installment;
}

interface ClientGroup {
  user: LoanUser;
  loans: LoanMetrics[];
  totalPending: number;
  totalPaid: number;
}

const API = import.meta.env.VITE_API_URL;
function authHeaders() { return { Authorization: `Bearer ${localStorage.getItem('token')}` }; }

const fmt = (v: string | number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

function computeMetrics(loan: ActiveLoan): LoanMetrics {
  const totalDue  = loan.installments.reduce((a, i) => a + Number(i.amountDue), 0);
  const paid      = loan.installments.reduce((a, i) => a + Number(i.amountPaid), 0);
  const pending   = Math.max(0, totalDue - paid);
  const pct       = totalDue > 0 ? Math.min((paid / totalDue) * 100, 100) : 0;
  const paidCount = loan.installments.filter(i => i.status === 'PAID').length;
  const nextInst  = loan.installments
    .filter(i => i.status !== 'PAID')
    .sort((a, b) => Number(a.number) - Number(b.number))[0];
  return { loan, totalDue, paid, pending, pct, paidCount, nextInst };
}

// Agrupa por cliente y ordena por deuda pendiente (mayor primero).
function groupByClient(loans: ActiveLoan[]): ClientGroup[] {
  const map = new Map<string, ClientGroup>();
  for (const loan of loans) {
    const metrics = computeMetrics(loan);
    const group = map.get(loan.user.id) ?? { user: loan.user, loans: [], totalPending: 0, totalPaid: 0 };
    group.loans.push(metrics);
    group.totalPending += metrics.pending;
    group.totalPaid += metrics.paid;
    map.set(loan.user.id, group);
  }
  return [...map.values()].sort((a, b) => b.totalPending - a.totalPending);
}

function progressColor(pct: number) {
  return pct >= 75 ? 'bg-brand-green' : pct >= 40 ? 'bg-brand-violet-light' : 'bg-sky-500';
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ClientHeader({ group }: { group: ClientGroup }) {
  const count = group.loans.length;
  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-surface-elevated/40 shadow-sm shadow-black/30">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center shrink-0">
          <User size={16} className="text-text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold truncate">{group.user.name ?? group.user.email}</p>
          <p className="text-text-secondary text-xs truncate">
            {group.user.email}
            {group.user.phone && <span className="inline-flex items-center gap-1 ml-2"><Phone size={11} /> {group.user.phone}</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <span className="bg-sky-500/20 text-sky-400 text-xs px-2 py-1 rounded-full border border-sky-500/30 font-semibold whitespace-nowrap">
          {count} préstamo{count !== 1 ? 's' : ''}
        </span>
        <div className="text-right">
          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Adeudo total</p>
          <p className="text-lg font-extrabold text-brand-violet-light tabular-nums">{fmt(group.totalPending)}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminActiveLoans() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    try {
      const { data } = await axios.get<any[]>(`${API}/loans/all`, { headers: authHeaders() });
      setLoans(data.filter((l: any) => l.status === 'ACTIVE'));
    } catch {
      toast.error('No se pudo cargar la cartera activa');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchLoans(); }, [fetchLoans]);

  const groups = useMemo(() => groupByClient(loans), [loans]);
  const portfolioPending = useMemo(() => groups.reduce((a, g) => a + g.totalPending, 0), [groups]);

  const openLoan = (id: string) => navigate(`/admin/loans/${id}`);

  return (
    <div className="p-4 sm:p-8 text-white font-sans max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-sky-400 flex items-center gap-3">
          <Briefcase size={32} />
          Cartera Activa
        </h1>
        <p className="text-text-secondary mt-2">
          {!isLoading && `${loans.length} préstamo${loans.length !== 1 ? 's' : ''} activo${loans.length !== 1 ? 's' : ''} · ${groups.length} cliente${groups.length !== 1 ? 's' : ''} · `}
          {!isLoading && loans.length > 0 && <>Por cobrar: <span className="text-brand-violet-light font-semibold">{fmt(portfolioPending)}</span> · </>}
          Haz clic en un préstamo para ver el detalle y gestionar cuotas.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-text-secondary">Cargando cartera...</div>
      ) : loans.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay préstamos activos.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <section
              key={group.user.id}
              className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card overflow-hidden"
            >
              <ClientHeader group={group} />

              {/* Móvil: tarjetas */}
              <div className="md:hidden divide-y divide-white/5">
                {group.loans.map(({ loan, pending, paid, pct, paidCount, nextInst }) => (
                  <button
                    key={loan.id}
                    onClick={() => openLoan(loan.id)}
                    className="w-full text-left p-4 space-y-3 hover:bg-surface-elevated/40 transition-colors group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{loan.concept}</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {fmt(loan.amount)} · {loan.termQuantity} {loan.termUnit === 'SEMANAS' ? 'sem' : 'meses'} · {Number(loan.interestRate).toFixed(0)}%
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-text-muted group-hover:text-sky-400 transition-colors shrink-0 mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Pendiente</p>
                        <p className="font-extrabold text-brand-violet-light tabular-nums">{fmt(pending)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Pagado</p>
                        <p className="font-extrabold text-brand-green-light tabular-nums">{fmt(paid)}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-text-muted mb-1">
                        <span>{paidCount} de {loan.installments.length} cuotas</span>
                        <span className="font-semibold text-white">{pct.toFixed(0)}%</span>
                      </div>
                      <ProgressBar pct={pct} />
                    </div>
                    {nextInst && (
                      <p className="text-xs text-text-muted">
                        Próximo venc.: <span className="text-white font-semibold">{fmtDate(nextInst.dueDate)}</span>
                        {' · '}
                        <span className="text-brand-violet-light font-semibold">{fmt(Number(nextInst.amountDue) - Number(nextInst.amountPaid))}</span>
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {/* Escritorio: tabla */}
              <table className="hidden md:table w-full text-sm">
                <thead>
                  <tr className="text-xs text-text-muted uppercase tracking-wider">
                    <th className="text-left font-semibold px-5 py-3">Concepto</th>
                    <th className="text-left font-semibold px-3 py-3">Inicio</th>
                    <th className="text-left font-semibold px-3 py-3 w-48">Avance</th>
                    <th className="text-left font-semibold px-3 py-3">Próximo venc.</th>
                    <th className="text-right font-semibold px-3 py-3">Pagado</th>
                    <th className="text-right font-semibold px-3 py-3">Pendiente</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {group.loans.map(({ loan, pending, paid, pct, paidCount, nextInst }) => (
                    <tr
                      key={loan.id}
                      onClick={() => openLoan(loan.id)}
                      className="cursor-pointer hover:bg-surface-elevated/40 transition-colors group"
                    >
                      <td className="px-5 py-3">
                        <p className="font-semibold text-white">{loan.concept}</p>
                        <p className="text-xs text-text-secondary">
                          {fmt(loan.amount)} · {loan.termQuantity} {loan.termUnit === 'SEMANAS' ? 'sem' : 'meses'} · {Number(loan.interestRate).toFixed(0)}%
                        </p>
                      </td>
                      <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{fmtDate(loan.startDate)}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-between text-xs text-text-muted mb-1">
                          <span>{paidCount}/{loan.installments.length}</span>
                          <span className="font-semibold text-white">{pct.toFixed(0)}%</span>
                        </div>
                        <ProgressBar pct={pct} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {nextInst ? (
                          <>
                            <p className="text-white">{fmtDate(nextInst.dueDate)}</p>
                            <p className="text-xs text-brand-violet-light">{fmt(Number(nextInst.amountDue) - Number(nextInst.amountPaid))}</p>
                          </>
                        ) : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-brand-green-light tabular-nums">{fmt(paid)}</td>
                      <td className="px-3 py-3 text-right font-extrabold text-brand-violet-light tabular-nums">{fmt(pending)}</td>
                      <td className="px-5 py-3 text-right">
                        <ChevronRight size={16} className="inline text-text-muted group-hover:text-sky-400 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
                {group.loans.length > 1 && (
                  <tfoot>
                    <tr className="bg-surface-base/40 text-sm">
                      <td colSpan={4} className="px-5 py-3 text-text-muted font-semibold uppercase tracking-wider text-xs">
                        Subtotal del cliente
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-brand-green-light tabular-nums">{fmt(group.totalPaid)}</td>
                      <td className="px-3 py-3 text-right font-extrabold text-brand-violet-light tabular-nums">{fmt(group.totalPending)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
