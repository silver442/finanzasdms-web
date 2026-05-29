/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft, Briefcase, User, Phone, Trash2,
  CheckCircle2, Circle, AlertCircle, RotateCcw, AlertTriangle, X,
} from 'lucide-react';

interface PaymentRecord {
  id: string; amount: string | number;
  reference?: string; createdAt: string; approvedAt?: string;
  adminBank?: { bankName: string };
}

interface Installment {
  id: string; number: number; dueDate: string;
  amountDue: string | number; amountPaid: string | number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  lateFeeAmount?: string | number;
  paymentRequests?: PaymentRecord[];
}

interface LoanUser {
  id: string; email: string; name?: string; phone?: string;
}

interface ActiveLoan {
  id: string; concept: string;
  amount: string | number; interestRate: string | number;
  termQuantity: number; termUnit: string;
  startDate: string; status: string;
  user: LoanUser;
  installments: Installment[];
}

const API = import.meta.env.VITE_API_URL;
function authHeaders() { return { Authorization: `Bearer ${localStorage.getItem('token')}` }; }

const fmt = (v: string | number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

function daysLate(dueDate: string, status: Installment['status']): number {
  if (status === 'PAID') return 0;
  const diff = Date.now() - new Date(dueDate).getTime();
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}

export default function AdminLoanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loan, setLoan] = useState<ActiveLoan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [payModal, setPayModal] = useState<{ open: boolean; inst: Installment | null; amount: string }>({ open: false, inst: null, amount: '' });
  const [isPaying, setIsPaying] = useState(false);

  const fetchLoan = useCallback(async () => {
    try {
      const { data } = await axios.get<ActiveLoan[]>(`${API}/loans/all`, { headers: authHeaders() });
      const found = data.find(l => l.id === id);
      if (!found) { toast.error('Préstamo no encontrado'); navigate('/admin/active-loans'); return; }
      setLoan(found);
    } catch {
      toast.error('No se pudo cargar el préstamo');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { void fetchLoan(); }, [fetchLoan]);

  const handleToggle = async (installmentId: string, currentStatus: string) => {
    setToggling(installmentId);
    const action = currentStatus === 'PAID' ? 'revertida a pendiente' : 'marcada como pagada';
    try {
      await axios.patch(`${API}/loans/installments/${installmentId}/admin-toggle`, {}, { headers: authHeaders() });
      toast.success(`Cuota ${action}`);
      void fetchLoan();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al cambiar estado');
    } finally {
      setToggling(null);
    }
  };

  const handlePayManual = async () => {
    const { inst, amount } = payModal;
    if (!inst) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { toast.error('Ingresa un monto válido'); return; }
    setIsPaying(true);
    try {
      await axios.patch(`${API}/loans/installments/${inst.id}/pay`, { amount: parsed }, { headers: authHeaders() });
      toast.success('Pago registrado');
      setPayModal({ open: false, inst: null, amount: '' });
      void fetchLoan();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al registrar pago');
    } finally {
      setIsPaying(false);
    }
  };

  const handleDelete = async () => {
    if (!loan) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API}/loans/${loan.id}`, { headers: authHeaders() });
      toast.success('Préstamo eliminado');
      navigate('/admin/active-loans');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20 text-slate-400">Cargando...</div>;
  if (!loan) return null;

  const totalDue  = loan.installments.reduce((a, i) => a + Number(i.amountDue), 0);
  const paid      = loan.installments.reduce((a, i) => a + Number(i.amountPaid), 0);
  const pending   = Math.max(0, totalDue - paid);
  const pct       = totalDue > 0 ? Math.min((paid / totalDue) * 100, 100) : 0;
  const paidCount = loan.installments.filter(i => i.status === 'PAID').length;
  const progressColor = pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-sky-500';

  return (
    <div className="p-6 md:p-8 text-white font-sans max-w-6xl mx-auto">

      {/* Back */}
      <button
        onClick={() => navigate('/admin/active-loans')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-semibold"
      >
        <ArrowLeft size={18} /> Cartera Activa
      </button>

      {/* Encabezado */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase size={18} className="text-sky-400" />
              <h1 className="text-2xl font-extrabold text-white">{loan.concept}</h1>
              <span className="bg-sky-500/20 text-sky-400 text-xs px-2 py-0.5 rounded border border-sky-500/30 font-semibold">Activo</span>
            </div>
            <p className="text-slate-400 text-sm">
              Capital: {fmt(loan.amount)} · {loan.termQuantity} {loan.termUnit === 'SEMANAS' ? 'semanas' : 'meses'} · Tasa: {Number(loan.interestRate).toFixed(0)}% anual
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Inicio: {fmtDate(loan.startDate)}</p>
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors text-sm font-semibold shrink-0"
          >
            <Trash2 size={15} /> Eliminar Préstamo
          </button>
        </div>

        {/* Cliente */}
        <div className="flex items-center gap-3 bg-slate-900/40 rounded-xl px-4 py-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
            <User size={15} className="text-slate-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-sm">{loan.user.name ?? '—'}</p>
            <p className="text-slate-400 text-xs">{loan.user.email}</p>
          </div>
          {loan.user.phone && (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs shrink-0">
              <Phone size={12} /> {loan.user.phone}
            </div>
          )}
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="bg-slate-900/60 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Deuda Total</p>
            <p className="text-base font-bold text-white">{fmt(totalDue)}</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Pagado</p>
            <p className="text-base font-bold text-emerald-400">{fmt(paid)}</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Pendiente</p>
            <p className="text-base font-bold text-amber-400">{fmt(pending)}</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{paidCount} de {loan.installments.length} cuotas pagadas</span>
            <span className="text-white font-semibold">{pct.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Tabla de amortización */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-700">
          <h2 className="text-base font-bold text-white">Tabla de Amortización</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700 bg-slate-900/40 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Vencimiento</th>
                <th className="px-4 py-3 font-semibold text-right">A Pagar</th>
                <th className="px-4 py-3 font-semibold text-right">Pagado</th>
                <th className="px-4 py-3 font-semibold text-center">Días Retraso</th>
                <th className="px-4 py-3 font-semibold text-right">Interés Moratorio</th>
                <th className="px-4 py-3 font-semibold text-center">Estado</th>
                <th className="px-4 py-3 font-semibold text-center">Ajustar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loan.installments.map(inst => {
                const isPaid    = inst.status === 'PAID';
                const isPartial = inst.status === 'PARTIAL';
                const late      = daysLate(inst.dueDate, inst.status);
                const lateFee   = Number(inst.lateFeeAmount ?? 0);
                const isThis    = toggling === inst.id;

                return (
                  <tr key={inst.id} className={`hover:bg-slate-700/20 ${isPaid ? 'opacity-75' : ''}`}>
                    <td className="px-4 py-3 font-mono text-slate-400 text-xs">{String(inst.number).padStart(2, '0')}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${isPaid ? 'text-slate-500' : 'text-slate-200'}`}>{fmtDate(inst.dueDate)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${isPaid ? 'text-slate-500' : 'text-white'}`}>{fmt(inst.amountDue)}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap ${isPaid ? 'text-emerald-400' : isPartial ? 'text-amber-400' : 'text-slate-500'}`}>
                      {fmt(inst.amountPaid)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {late > 0
                        ? <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded font-semibold">{late}d</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {lateFee > 0
                        ? <span className="text-orange-400 font-semibold">{fmt(lateFee)}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isPaid
                        ? <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold"><CheckCircle2 size={10} /> Pagada</span>
                        : isPartial
                          ? <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold"><AlertCircle size={10} /> Parcial</span>
                          : <span className="inline-flex items-center gap-1 bg-slate-700/50 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-600/40 font-semibold"><Circle size={10} /> Pendiente</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {isPaid ? (
                          <button
                            onClick={() => void handleToggle(inst.id, inst.status)}
                            disabled={!!toggling}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 bg-slate-700 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-600 hover:border-amber-500/30"
                          >
                            {isThis ? '...' : <><RotateCcw size={11} /> Revertir</>}
                          </button>
                        ) : (
                          <button
                            onClick={() => setPayModal({ open: true, inst, amount: String(Math.max(0, Number(inst.amountDue) - Number(inst.amountPaid))) })}
                            disabled={!!toggling}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          >
                            <CheckCircle2 size={11} /> Pagar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Abonos */}
      {(() => {
        const history = loan.installments
          .flatMap(i => (i.paymentRequests ?? []).map(pr => ({ ...pr, cuotaNumber: i.number, cuotaDue: i.amountDue })))
          .sort((a, b) => new Date(a.approvedAt ?? a.createdAt).getTime() - new Date(b.approvedAt ?? b.createdAt).getTime());

        if (history.length === 0) return null;

        return (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl mt-6 overflow-hidden">
            <div className="p-5 border-b border-slate-700">
              <h2 className="text-base font-bold text-white">Historial de Abonos</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Los abonos que superen el monto de la cuota reducen la deuda y redistribuyen el saldo entre las cuotas restantes.
              </p>
            </div>
            <div className="divide-y divide-slate-700/50">
              {history.map(abono => {
                const exceso = Math.max(0, Number(abono.amount) - Number(abono.cuotaDue));
                return (
                  <div key={abono.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-700/20">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-white font-semibold">
                        Cuota #{abono.cuotaNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(abono.approvedAt ?? abono.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}{abono.adminBank?.bankName ?? 'Banco no registrado'}
                        {abono.reference ? ` · Ref: ${abono.reference}` : ''}
                      </span>
                      {exceso > 0 && (
                        <span className="text-xs text-violet-400 font-semibold">
                          Abono a capital: {fmt(exceso)} — cuotas futuras recalculadas
                        </span>
                      )}
                    </div>
                    <span className="text-emerald-400 font-bold text-sm whitespace-nowrap ml-4">{fmt(abono.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Modal: Pago Manual */}
      {payModal.open && payModal.inst && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center p-5 border-b border-slate-700">
              <h3 className="text-base font-bold text-white">Pago Manual — Cuota #{payModal.inst.number}</h3>
              <button onClick={() => setPayModal({ open: false, inst: null, amount: '' })} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-1">Monto pagado (MXN)</label>
                <input
                  type="number"
                  value={payModal.amount}
                  onChange={e => setPayModal(m => ({ ...m, amount: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="0.00" min="0.01" step="0.01"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Pendiente: {fmt(Math.max(0, Number(payModal.inst.amountDue) - Number(payModal.inst.amountPaid)))}
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-700 justify-end">
              <button onClick={() => setPayModal({ open: false, inst: null, amount: '' })} className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors text-sm">Cancelar</button>
              <button
                onClick={() => void handlePayManual()}
                disabled={isPaying}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 text-sm"
              >
                {isPaying ? 'Registrando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {deleteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <AlertTriangle size={36} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar préstamo?</h3>
            <p className="text-slate-400 text-sm mb-1">Se eliminará permanentemente el préstamo de</p>
            <p className="text-white font-semibold mb-1">{loan.user.name ?? loan.user.email}</p>
            <p className="text-slate-500 text-sm mb-6">"{loan.concept}"<br />junto con todas sus cuotas.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteOpen(false)} disabled={isDeleting}
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
