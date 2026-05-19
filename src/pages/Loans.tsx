/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Landmark, Plus, CheckCircle2, Circle, AlertCircle,
  X, Copy, CreditCard, Calculator, Clock, Ban, Trophy, Paperclip,
} from 'lucide-react';

interface AdminBank {
  id: string;
  bankName: string;
  clabe: string;
  accountHolder: string;
}

interface Installment {
  id: string;
  number: number;
  dueDate: string;
  amountDue: string | number;
  amountPaid: string | number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  loanId: string;
}

interface Loan {
  id: string;
  concept: string;
  amount: string | number;
  interestRate: string | number;
  termMonths: number;
  startDate: string;
  status: 'REQUESTED' | 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'REJECTED';
  installments: Installment[];
}

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const LEVEL_LABELS: Record<string, string> = {
  NOVATO_1: 'Novato I', NOVATO_2: 'Novato II', NOVATO_3: 'Novato III',
  CUMPLIDOR_1: 'Cumplidor I', CUMPLIDOR_2: 'Cumplidor II', CUMPLIDOR_3: 'Cumplidor III',
  SOCIO_1: 'Socio I', SOCIO_2: 'Socio II', ELITE: 'Élite',
};

function getLevelStyle(level: string): string {
  if (level.startsWith('NOVATO'))    return 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20';
  if (level.startsWith('CUMPLIDOR')) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20';
  if (level.startsWith('SOCIO'))     return 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20';
  if (level === 'ELITE')             return 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20';
  return 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700';
}

function getUserProfile() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return { level: 'NOVATO_1', points: 0 };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      level: typeof parsed.level === 'string' ? parsed.level : 'NOVATO_1',
      points: typeof parsed.points === 'number' ? parsed.points : 0,
    };
  } catch {
    return { level: 'NOVATO_1', points: 0 };
  }
}

const inputCls =
  'w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600';

export default function Loans() {
  const navigate = useNavigate();
  const { level, points } = useMemo(() => getUserProfile(), []);

  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banks, setBanks] = useState<AdminBank[]>([]);
  const [slotsAvailable, setSlotsAvailable] = useState(true);

  const [payTarget, setPayTarget] = useState<Installment | null>(null);
  const [payRegistered, setPayRegistered] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', bankId: '', reference: '', receipt: null as File | null });
  const [isPaying, setIsPaying] = useState(false);

  const fetchCapacity = useCallback(async () => {
    try {
      const { data } = await axios.get<{ available: boolean }>(`${API}/loans/capacity`, { headers: authHeaders() });
      setSlotsAvailable(data.available);
    } catch { /* no crítico */ }
  }, []);

  const fetchBanks = useCallback(async () => {
    try {
      const { data } = await axios.get<AdminBank[]>(`${API}/admin-banks`);
      setBanks(data);
    } catch { /* no crítico */ }
  }, []);

  const fetchLoans = useCallback(async () => {
    try {
      const { data } = await axios.get<Loan[]>(`${API}/loans/my-loans`, { headers: authHeaders() });
      setLoans(data);
    } catch {
      toast.error('No se pudieron cargar los préstamos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchLoans(); void fetchBanks(); void fetchCapacity(); }, [fetchLoans, fetchBanks, fetchCapacity]);

  const handlePayInstallment = async () => {
    if (!payTarget) return;
    const amount = parseFloat(payForm.amount);
    if (isNaN(amount) || amount <= 0) { toast.error('Ingresa una cantidad válida'); return; }
    if (!payForm.bankId) { toast.error('Selecciona el banco al que realizaste el depósito'); return; }

    if (payForm.receipt && payForm.receipt.size > 5 * 1024 * 1024) {
      toast.error('El comprobante no debe superar 5 MB');
      return;
    }

    const formData = new FormData();
    formData.append('installmentId', payTarget.id);
    formData.append('amount', String(amount));
    formData.append('bankId', payForm.bankId);
    if (payForm.reference) formData.append('reference', payForm.reference);
    if (payForm.receipt)   formData.append('receipt', payForm.receipt);

    setIsPaying(true);
    try {
      await axios.post(`${API}/payment-requests`, formData, { headers: authHeaders() });
      setPayRegistered(true);
      setPayForm({ amount: '', bankId: '', reference: '', receipt: null });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al registrar el pago');
    } finally {
      setIsPaying(false);
    }
  };

  const formatCurrency = (v: string | number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  const shortId = (id: string) => id.slice(0, 8).toUpperCase();

  const copyText = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 flex items-center gap-3">
            <Landmark size={32} />
            Préstamos y Pagos Fijos
          </h1>
          <p className="text-slate-400 mt-2">Control de amortizaciones y compras a plazos</p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => navigate('/profile')}
            className={`flex items-center gap-2 border px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${getLevelStyle(level)}`}
            title="Ver mi perfil"
          >
            <Trophy size={15} />
            <span>{LEVEL_LABELS[level] ?? level}</span>
            <span className="w-px h-3.5 bg-current opacity-30" />
            <span className="text-white font-bold tabular-nums">{points}</span>
            <span className="opacity-50 font-normal">pts</span>
          </button>

          <button
            onClick={() => navigate('/loans/simulator')}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-5 py-2.5 rounded-xl font-bold transition-all border border-slate-600 flex items-center gap-2"
          >
            <Calculator size={18} />
            Simulador
          </button>
          <button
            onClick={() => navigate('/loans/request')}
            disabled={!slotsAvailable}
            title={!slotsAvailable ? 'Cupos agotados este mes' : undefined}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-slate-600"
          >
            <Plus size={20} />
            Solicitar Préstamo
          </button>
        </div>
      </div>

      {/* ── Banner: cupos agotados ── */}
      {!slotsAvailable && (
        <div className="mb-8 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4">
          <Ban size={20} className="text-amber-400 shrink-0" />
          <div>
            <p className="text-amber-300 font-bold text-sm">Cupos de crédito agotados por este mes</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Se han alcanzado los 20 créditos activos simultáneos. Intenta de nuevo el próximo mes.</p>
          </div>
        </div>
      )}

      {/* ── Lista de préstamos ── */}
      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-400">Cargando préstamos...</div>
      ) : loans.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Landmark size={48} className="mx-auto mb-4 opacity-30" />
          <p>No tienes préstamos registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {loans.map(loan => {
            const totalPaid = loan.installments.reduce((acc, i) => acc + Number(i.amountPaid), 0);
            const totalDue = loan.installments.reduce((acc, i) => acc + Number(i.amountDue), 0);
            const currentDebt = totalDue - totalPaid;
            const isPaid = loan.status === 'PAID';
            const isRequested = loan.status === 'REQUESTED';
            const isRejected = loan.status === 'REJECTED';

            return (
              <div key={loan.id} className={`bg-slate-800 rounded-2xl border shadow-xl overflow-hidden flex flex-col ${isPaid ? 'border-emerald-500/30' : isRejected ? 'border-red-500/30' : 'border-slate-700'}`}>
                <div className="p-6 border-b border-slate-700 bg-slate-900/40">
                  <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    {loan.concept}
                    {isPaid && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/30">Liquidado</span>}
                    {isRequested && <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-500/30">En revisión</span>}
                    {isRejected && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30">Rechazado</span>}
                  </h2>
                  <p className="text-sm text-slate-400">
                    Capital: {formatCurrency(loan.amount)} · {loan.termMonths} meses · {Number(loan.interestRate)}% anual
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Inicio: {formatDate(loan.startDate)}</p>
                </div>

                {isRequested ? (
                  <div className="flex-1 p-6 text-slate-400 text-sm text-center py-10">
                    Esperando aprobación del administrador.
                  </div>
                ) : isRejected ? (
                  <div className="flex-1 p-6 flex flex-col items-center justify-center gap-3 py-10">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Ban size={24} className="text-red-400" />
                    </div>
                    <p className="text-red-400 font-semibold text-sm">Solicitud rechazada</p>
                    <p className="text-slate-500 text-xs text-center max-w-xs">
                      Esta solicitud no fue aprobada por el administrador. Puedes solicitar un nuevo préstamo cuando lo desees.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 p-6 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-700">
                          <th className="pb-3 font-semibold">N°</th>
                          <th className="pb-3 font-semibold">Vencimiento</th>
                          <th className="pb-3 font-semibold text-right">A pagar</th>
                          <th className="pb-3 font-semibold text-right">Abonado</th>
                          <th className="pb-3 font-semibold text-center">Estado</th>
                          <th className="pb-3 font-semibold text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {loan.installments.map(inst => {
                          const isComplete = inst.status === 'PAID';
                          const isPartial = inst.status === 'PARTIAL';
                          return (
                            <tr key={inst.id} className="hover:bg-slate-700/20">
                              <td className="py-3 text-slate-400">{inst.number}</td>
                              <td className="py-3 text-slate-300">{formatDate(inst.dueDate)}</td>
                              <td className="py-3 text-right text-slate-300">{formatCurrency(inst.amountDue)}</td>
                              <td className={`py-3 text-right font-medium ${isComplete ? 'text-emerald-400' : isPartial ? 'text-amber-400' : 'text-white'}`}>
                                {formatCurrency(inst.amountPaid)}
                              </td>
                              <td className="py-3 text-center">
                                {isComplete
                                  ? <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />
                                  : isPartial
                                    ? <AlertCircle size={18} className="text-amber-500 mx-auto" />
                                    : <Circle size={18} className="text-slate-600 mx-auto" />}
                              </td>
                              <td className="py-3 text-center">
                                {!isComplete && (
                                  <button
                                    onClick={() => { setPayTarget(inst); setPayRegistered(false); setPayForm({ amount: '', bankId: '', reference: '', receipt: null }); }}
                                    className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg transition-colors font-medium"
                                  >
                                    Abonar
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="bg-slate-900/60 p-6 border-t border-slate-700 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Pagado</p>
                    <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Deuda Actual</p>
                    <p className={`text-xl font-extrabold ${isPaid ? 'text-slate-500' : 'text-red-400'}`}>
                      {formatCurrency(Math.max(0, currentDebt))}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Abonar (SPEI) ── */}
      {payTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard size={20} className="text-emerald-400" />
                Registrar Abono — Cuota #{payTarget.number}
              </h3>
              <button onClick={() => { setPayTarget(null); setPayRegistered(false); setPayForm({ amount: '', bankId: '', reference: '', receipt: null }); }} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {payRegistered ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} className="text-emerald-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Pago Registrado</h4>
                <p className="text-slate-300 text-sm mb-1">Tu abono ha sido recibido correctamente.</p>
                <p className="text-slate-400 text-sm">
                  Se verá reflejado en un máximo de <strong className="text-white">24 horas</strong> tras la validación manual del administrador.
                </p>
                <button
                  onClick={() => { setPayTarget(null); setPayRegistered(false); }}
                  className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm text-slate-300 font-medium mb-1">
                      ¿A qué banco realizaste el depósito?
                    </label>
                    <select
                      value={payForm.bankId}
                      onChange={e => setPayForm(f => ({ ...f, bankId: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">— Selecciona un banco —</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} — {b.accountHolder}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const selected = banks.find(b => b.id === payForm.bankId);
                    if (!selected) return null;
                    return (
                      <div className="bg-slate-900/70 border border-slate-600 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Datos para tu SPEI</p>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Banco</span>
                            <span className="text-white font-semibold">{selected.bankName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Titular</span>
                            <span className="text-white font-semibold">{selected.accountHolder}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-700 pt-3">
                            <span className="text-slate-400">CLABE</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono font-semibold tracking-wider">{selected.clabe}</span>
                              <button onClick={() => copyText(selected.clabe)} className="text-slate-500 hover:text-emerald-400 transition-colors">
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-1">
                            <p className="text-amber-300 text-xs font-semibold mb-1">Usa este concepto en tu app bancaria:</p>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-amber-200 text-sm font-bold">Abono {shortId(payTarget.id)}</span>
                              <button onClick={() => copyText(`Abono ${shortId(payTarget.id)}`)} className="text-slate-500 hover:text-amber-400 transition-colors">
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-500 text-xs">
                            Pendiente: <span className="text-white font-bold">{formatCurrency(Number(payTarget.amountDue) - Number(payTarget.amountPaid))}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 font-medium mb-1">Cantidad transferida (MXN)</label>
                      <input type="number" value={payForm.amount}
                        onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                        className={inputCls} placeholder="0.00" min="0.01" step="0.01" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 font-medium mb-1">
                        Referencia del SPEI
                        <span className="text-slate-500 font-normal ml-1">(opcional pero recomendada)</span>
                      </label>
                      <input type="text" value={payForm.reference}
                        onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                        className={inputCls} placeholder={`Abono ${shortId(payTarget.id)}`} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 font-medium mb-1">
                        Comprobante de transferencia
                        <span className="text-slate-500 font-normal ml-1">(captura de pantalla, max 5 MB)</span>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer border border-dashed rounded-lg px-4 py-3 transition-colors ${payForm.receipt ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-600 hover:border-slate-500 bg-slate-900'}`}>
                        <Paperclip size={16} className={payForm.receipt ? 'text-emerald-400' : 'text-slate-500'} />
                        <span className={`text-sm truncate ${payForm.receipt ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {payForm.receipt ? payForm.receipt.name : 'Seleccionar archivo...'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={e => setPayForm(f => ({ ...f, receipt: e.target.files?.[0] ?? null }))}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
                  <button onClick={() => setPayTarget(null)} className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={() => void handlePayInstallment()}
                    disabled={isPaying}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                  >
                    {isPaying ? 'Registrando...' : 'Confirmar Abono'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
