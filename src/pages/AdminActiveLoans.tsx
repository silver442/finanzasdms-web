/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Briefcase, User, Phone, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, Circle, RotateCcw, AlertTriangle,
} from 'lucide-react';

interface Installment {
  id: string;
  number: number;
  dueDate: string;
  amountDue: string | number;
  amountPaid: string | number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
}

interface LoanUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
}

interface ActiveLoan {
  id: string;
  concept: string;
  amount: string | number;
  interestRate: string | number;
  termMonths: number;
  startDate: string;
  user: LoanUser;
  installments: Installment[];
}

const API = 'http://localhost:3000';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function fmt(v: string | number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = clamped >= 75 ? 'bg-emerald-500' : clamped >= 40 ? 'bg-amber-400' : 'bg-sky-500';
  return (
    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export default function AdminActiveLoans() {
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<ActiveLoan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

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

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API}/loans/${deleteTarget.id}`, { headers: authHeaders() });
      toast.success('Préstamo eliminado');
      setLoans(prev => prev.filter(l => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async (installmentId: string, loanId: string, currentStatus: string) => {
    setToggling(installmentId);
    const action = currentStatus === 'PAID' ? 'revertida a pendiente' : 'marcada como pagada';
    try {
      await axios.patch(
        `${API}/loans/installments/${installmentId}/admin-toggle`,
        {},
        { headers: authHeaders() },
      );
      toast.success(`Cuota ${action}`);
      setLoans(prev =>
        prev.map(loan => {
          if (loan.id !== loanId) return loan;
          return {
            ...loan,
            installments: loan.installments.map(inst => {
              if (inst.id !== installmentId) return inst;
              const becomingPaid = inst.status !== 'PAID';
              return {
                ...inst,
                status: becomingPaid ? 'PAID' : 'PENDING',
                amountPaid: becomingPaid ? inst.amountDue : 0,
              };
            }),
          };
        }),
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al cambiar estado');
    } finally {
      setToggling(null);
    }
  };

  const calcTotals = (loan: ActiveLoan) => {
    const principal = Number(loan.amount);
    const totalDebt = principal + principal * (Number(loan.interestRate) / 100);
    const paid = loan.installments.reduce((acc, i) => acc + Number(i.amountPaid), 0);
    const pending = Math.max(0, totalDebt - paid);
    const pct = totalDebt > 0 ? (paid / totalDebt) * 100 : 0;
    return { totalDebt, paid, pending, pct };
  };

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-sky-400 flex items-center gap-3">
          <Briefcase size={32} />
          Cartera Activa
        </h1>
        <p className="text-slate-400 mt-2">Préstamos activos, avance de pago y ajuste manual de cuotas</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-400">Cargando cartera...</div>
      ) : loans.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay préstamos activos.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {loans.map(loan => {
            const { totalDebt, paid, pending, pct } = calcTotals(loan);
            const isOpen = expanded.has(loan.id);

            return (
              <div key={loan.id} className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">

                {/* Card header */}
                <div className="p-5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-lg font-bold text-white truncate">{loan.concept}</h2>
                      <span className="bg-sky-500/20 text-sky-400 text-xs px-2 py-0.5 rounded border border-sky-500/30 font-semibold shrink-0">Activo</span>
                    </div>
                    <p className="text-sm text-slate-400">{loan.termMonths} meses · Tasa {Number(loan.interestRate).toFixed(0)}%</p>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(loan)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors shrink-0"
                    title="Eliminar préstamo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Cliente */}
                <div className="px-5 pb-4 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <User size={13} className="text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{loan.user.name ?? '—'}</p>
                    <p className="text-slate-400 text-xs truncate">{loan.user.email}</p>
                  </div>
                  {loan.user.phone && (
                    <div className="ml-auto flex items-center gap-1.5 text-slate-400 text-xs shrink-0">
                      <Phone size={11} /> {loan.user.phone}
                    </div>
                  )}
                </div>

                {/* Montos + barra */}
                <div className="px-5 pb-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-slate-900 rounded-lg p-3 text-center">
                      <p className="text-slate-500 text-xs mb-0.5">Deuda Total</p>
                      <p className="text-white font-bold text-xs sm:text-sm">{fmt(totalDebt)}</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3 text-center">
                      <p className="text-slate-500 text-xs mb-0.5">Pagado</p>
                      <p className="text-emerald-400 font-bold text-xs sm:text-sm">{fmt(paid)}</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3 text-center">
                      <p className="text-slate-500 text-xs mb-0.5">Pendiente</p>
                      <p className="text-amber-400 font-bold text-xs sm:text-sm">{fmt(pending)}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Progreso</span>
                      <span className="font-semibold text-white">{pct.toFixed(1)}%</span>
                    </div>
                    <ProgressBar pct={pct} />
                    <p className="text-xs text-slate-500 mt-1">
                      {loan.installments.filter(i => i.status === 'PAID').length} de {loan.installments.length} cuotas pagadas
                    </p>
                  </div>
                </div>

                {/* Toggle installments */}
                <button
                  onClick={() => toggleExpand(loan.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-t border-slate-700 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors"
                >
                  {isOpen ? <><ChevronUp size={14} /> Ocultar cuotas</> : <><ChevronDown size={14} /> Ver cuotas y ajustar</>}
                </button>

                {/* Installments table */}
                {isOpen && (
                  <div className="border-t border-slate-700 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase tracking-wider">
                          <th className="text-left px-5 py-3 w-10">#</th>
                          <th className="text-left px-5 py-3">Vencimiento</th>
                          <th className="text-right px-5 py-3">Monto</th>
                          <th className="text-right px-5 py-3">Pagado</th>
                          <th className="text-center px-5 py-3 w-28">Estado</th>
                          <th className="text-center px-5 py-3 w-32">Ajustar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loan.installments.map(inst => {
                          const isPaid = inst.status === 'PAID';
                          const isTogglingThis = toggling === inst.id;
                          return (
                            <tr key={inst.id} className={`border-b border-slate-700/50 transition-colors ${isPaid ? 'bg-emerald-500/5' : 'hover:bg-slate-700/20'}`}>
                              <td className="px-5 py-3 font-mono text-slate-400 text-xs">{String(inst.number).padStart(2, '0')}</td>
                              <td className={`px-5 py-3 ${isPaid ? 'text-slate-500' : 'text-slate-200'}`}>{fmtDate(inst.dueDate)}</td>
                              <td className={`px-5 py-3 text-right tabular-nums ${isPaid ? 'text-slate-500' : 'text-white'}`}>{fmt(inst.amountDue)}</td>
                              <td className={`px-5 py-3 text-right font-semibold tabular-nums ${isPaid ? 'text-emerald-400' : Number(inst.amountPaid) > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                                {fmt(inst.amountPaid)}
                              </td>
                              <td className="px-5 py-3 text-center">
                                {isPaid
                                  ? <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold"><CheckCircle2 size={10} /> Pagada</span>
                                  : inst.status === 'PARTIAL'
                                    ? <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">Parcial</span>
                                    : <span className="inline-flex items-center gap-1 bg-slate-700/50 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-600/40 font-semibold"><Circle size={10} /> Pendiente</span>
                                }
                              </td>
                              <td className="px-5 py-3 text-center">
                                <button
                                  onClick={() => void handleToggle(inst.id, loan.id, inst.status)}
                                  disabled={isTogglingThis}
                                  title={isPaid ? 'Revertir a pendiente' : 'Marcar como pagada'}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
                                    isPaid
                                      ? 'bg-slate-700 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-600 hover:border-amber-500/30'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                  }`}
                                >
                                  {isTogglingThis
                                    ? '...'
                                    : isPaid
                                      ? <><RotateCcw size={11} /> Revertir</>
                                      : <><CheckCircle2 size={11} /> Pagar</>
                                  }
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <AlertTriangle size={36} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar préstamo?</h3>
            <p className="text-slate-400 text-sm mb-1">
              Se eliminará permanentemente el préstamo de
            </p>
            <p className="text-white font-semibold mb-1">{deleteTarget.user.name ?? deleteTarget.user.email}</p>
            <p className="text-slate-500 text-sm mb-6">"{deleteTarget.concept}"<br />junto con todas sus cuotas.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={() => void handleDelete()} disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50">
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
