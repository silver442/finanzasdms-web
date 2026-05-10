/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Landmark, Plus, CheckCircle2, Circle, AlertCircle,
  X, Copy, CreditCard, TrendingUp, AlertTriangle, Calculator, Clock, Ban,
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
  status: 'REQUESTED' | 'ACTIVE' | 'PAID' | 'DEFAULTED';
  installments: Installment[];
}

const API = 'http://localhost:3000';
const DEFAULT_CREDIT_LIMIT = 1000;
const DEFAULT_RATE = 50;
const HOUSING_OPTIONS = ['Propia', 'Rentada', 'Familiar'];

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function getUserDefaults() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return { creditLimit: DEFAULT_CREDIT_LIMIT, currentRate: DEFAULT_RATE };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const creditLimit = Number(parsed.creditLimit ?? DEFAULT_CREDIT_LIMIT) || DEFAULT_CREDIT_LIMIT;
    const currentRate = Number(parsed.currentRate ?? DEFAULT_RATE) || DEFAULT_RATE;
    return { creditLimit, currentRate };
  } catch {
    return { creditLimit: DEFAULT_CREDIT_LIMIT, currentRate: DEFAULT_RATE };
  }
}

function calcMonthly(amount: number, flatRate: number, months: number): number {
  if (amount <= 0 || months <= 0) return 0;
  const total = amount + amount * (flatRate / 100);
  return total / months;
}

const inputCls =
  'w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600';

export default function Loans() {
  const { creditLimit, currentRate } = useMemo(() => getUserDefaults(), []);

  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banks, setBanks] = useState<AdminBank[]>([]);
  const [slotsAvailable, setSlotsAvailable] = useState(true);

  // Modals
  const [showSimModal, setShowSimModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [payTarget, setPayTarget] = useState<Installment | null>(null);
  const [payRegistered, setPayRegistered] = useState(false);

  // Simulator state
  const [simAmount, setSimAmount] = useState('');
  const [simMonths, setSimMonths] = useState('');

  // Request form state
  const [reqForm, setReqForm] = useState({
    concept: '', amount: '', termMonths: '',
    phone: '', income: '', expenses: '',
    housingStatus: 'Rentada', state: '', country: '',
    referralCode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pay form state
  const [payForm, setPayForm] = useState({ amount: '', bankId: '', reference: '' });
  const [isPaying, setIsPaying] = useState(false);

  // Simulator calculations
  const simAmountN = parseFloat(simAmount) || 0;
  const simMonthsN = parseInt(simMonths, 10) || 0;
  const simMonthly = calcMonthly(simAmountN, currentRate, simMonthsN);
  const simTotal = simMonthly * simMonthsN;

  // Request form calculations (for over-limit warning only)
  const reqAmount = parseFloat(reqForm.amount) || 0;
  const isOverLimit = creditLimit > 0 && reqAmount > creditLimit;

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
    } catch { /* bancos no críticos */ }
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

  const handleRequestLoan = async () => {
    const amount = parseFloat(reqForm.amount);
    const termMonths = parseInt(reqForm.termMonths, 10);
    const income = parseFloat(reqForm.income);
    const expenses = parseFloat(reqForm.expenses);

    if (!reqForm.concept.trim() || isNaN(amount) || amount <= 0 || isNaN(termMonths) || termMonths < 1) {
      toast.error('Completa correctamente el concepto, monto y plazo');
      return;
    }
    if (!reqForm.phone.trim() || isNaN(income) || income <= 0 || isNaN(expenses) || expenses <= 0) {
      toast.error('Completa el teléfono, ingresos y gastos');
      return;
    }
    if (isOverLimit) {
      toast.error('El monto supera tu límite de crédito');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${API}/loans/request`,
        {
          concept: reqForm.concept,
          amount,
          termMonths,
          phone: reqForm.phone,
          income,
          expenses,
          housingStatus: reqForm.housingStatus,
          state: reqForm.state,
          country: reqForm.country,
          referralCode: reqForm.referralCode || undefined,
        },
        { headers: authHeaders() },
      );
      toast.success('Solicitud enviada correctamente');
      setShowRequestModal(false);
      setReqForm({
        concept: '', amount: '', termMonths: '',
        phone: '', income: '', expenses: '',
        housingStatus: 'Rentada', state: '', country: '',
        referralCode: '',
      });
      await fetchLoans();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(Array.isArray(msg) ? (msg as string[])[0] : (msg as string | undefined) ?? 'Error al solicitar préstamo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayInstallment = async () => {
    if (!payTarget) return;
    const amount = parseFloat(payForm.amount);
    if (isNaN(amount) || amount <= 0) { toast.error('Ingresa una cantidad válida'); return; }
    if (!payForm.bankId) { toast.error('Selecciona el banco al que realizaste el depósito'); return; }
    setIsPaying(true);
    try {
      await axios.post(
        `${API}/payment-requests`,
        {
          installmentId: payTarget.id,
          amount,
          bankId: payForm.bankId,
          reference: payForm.reference || undefined,
        },
        { headers: authHeaders() },
      );
      setPayRegistered(true);
      setPayForm({ amount: '', bankId: '', reference: '' });
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
        <div className="flex gap-3">
          <button
            onClick={() => setShowSimModal(true)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-5 py-2.5 rounded-xl font-bold transition-all border border-slate-600 flex items-center gap-2"
          >
            <Calculator size={18} />
            Simulador
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
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

      {/* ── Loan list ── */}
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

            return (
              <div key={loan.id} className={`bg-slate-800 rounded-2xl border shadow-xl overflow-hidden flex flex-col ${isPaid ? 'border-emerald-500/30' : 'border-slate-700'}`}>
                <div className="p-6 border-b border-slate-700 bg-slate-900/40">
                  <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    {loan.concept}
                    {isPaid && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/30">Liquidado</span>}
                    {isRequested && <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-500/30">En revisión</span>}
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
                                    onClick={() => { setPayTarget(inst); setPayRegistered(false); setPayForm({ amount: '', bankId: '', reference: '' }); }}
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

      {/* ── Modal: Simulador ── */}
      {showSimModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-400" />
                Simulador de Préstamo
              </h3>
              <button onClick={() => setShowSimModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Límite Autorizado</p>
                  <p className="text-xl font-extrabold text-white">{formatCurrency(creditLimit)}</p>
                </div>
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Tasa Actual (anual)</p>
                  <p className="text-xl font-extrabold text-white">{currentRate}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-1">Monto (MXN)</label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={e => setSimAmount(e.target.value)}
                    className={inputCls}
                    placeholder="0.00"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-1">Plazo (meses)</label>
                  <input
                    type="number"
                    value={simMonths}
                    onChange={e => setSimMonths(e.target.value)}
                    className={inputCls}
                    placeholder="Ej: 6"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-4 border ${simMonthly > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-700'}`}>
                  <p className="text-xs text-slate-400 mb-1">Pago Mensual Estimado</p>
                  <p className={`text-lg font-extrabold ${simMonthly > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {simMonthly > 0 ? formatCurrency(simMonthly) : '—'}
                  </p>
                </div>
                <div className={`rounded-xl p-4 border ${simTotal > 0 ? 'bg-slate-900 border-slate-600' : 'bg-slate-900 border-slate-700'}`}>
                  <p className="text-xs text-slate-400 mb-1">Total a Pagar</p>
                  <p className={`text-lg font-extrabold ${simTotal > 0 ? 'text-white' : 'text-slate-600'}`}>
                    {simTotal > 0 ? formatCurrency(simTotal) : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end">
              <button onClick={() => setShowSimModal(false)} className="px-5 py-2 rounded-lg text-slate-300 hover:text-white transition-colors font-medium">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Solicitar Préstamo (solo KYC) ── */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={20} className="text-emerald-400" />
                Solicitar Préstamo
              </h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Bloque: Préstamo */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Datos del Préstamo</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-300 font-medium mb-1">Concepto</label>
                    <input type="text" value={reqForm.concept}
                      onChange={e => setReqForm(f => ({ ...f, concept: e.target.value }))}
                      className={inputCls} placeholder="Ej: Refacciones del Chevy" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-300 font-medium mb-1">Monto (MXN)</label>
                      <input type="number" value={reqForm.amount}
                        onChange={e => setReqForm(f => ({ ...f, amount: e.target.value }))}
                        className={`${inputCls} ${isOverLimit ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="0.00" min="1" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 font-medium mb-1">Plazo (meses)</label>
                      <input type="number" value={reqForm.termMonths}
                        onChange={e => setReqForm(f => ({ ...f, termMonths: e.target.value }))}
                        className={inputCls} placeholder="Ej: 6" min="1" />
                    </div>
                  </div>
                  {isOverLimit && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5">
                      <AlertTriangle size={15} className="text-red-400 shrink-0" />
                      <p className="text-sm text-red-300">
                        El monto supera tu límite de <strong>{formatCurrency(creditLimit)}</strong>
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-slate-300 font-medium mb-1">
                      Código de Referido <span className="text-slate-500 font-normal">(opcional)</span>
                    </label>
                    <input type="text" value={reqForm.referralCode}
                      onChange={e => setReqForm(f => ({ ...f, referralCode: e.target.value }))}
                      className={inputCls} placeholder="REFXXX" />
                  </div>
                </div>
              </div>

              {/* Bloque: KYC */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Información Personal</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-300 font-medium mb-1">Teléfono</label>
                    <input type="tel" value={reqForm.phone}
                      onChange={e => setReqForm(f => ({ ...f, phone: e.target.value }))}
                      className={inputCls} placeholder="81 1234 5678" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-300 font-medium mb-1">Ingresos Mensuales (MXN)</label>
                      <input type="number" value={reqForm.income}
                        onChange={e => setReqForm(f => ({ ...f, income: e.target.value }))}
                        className={inputCls} placeholder="0.00" min="0" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 font-medium mb-1">Gastos Mensuales (MXN)</label>
                      <input type="number" value={reqForm.expenses}
                        onChange={e => setReqForm(f => ({ ...f, expenses: e.target.value }))}
                        className={inputCls} placeholder="0.00" min="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 font-medium mb-1">Estado de Vivienda</label>
                    <select value={reqForm.housingStatus}
                      onChange={e => setReqForm(f => ({ ...f, housingStatus: e.target.value }))}
                      className={inputCls}>
                      {HOUSING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloque: Ubicación */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ubicación</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 font-medium mb-1">País</label>
                    <input type="text" value={reqForm.country}
                      onChange={e => setReqForm(f => ({ ...f, country: e.target.value }))}
                      className={inputCls} placeholder="Ej: México" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 font-medium mb-1">Estado</label>
                    <input type="text" value={reqForm.state}
                      onChange={e => setReqForm(f => ({ ...f, state: e.target.value }))}
                      className={inputCls} placeholder="Ej: Nuevo León" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => void handleRequestLoan()}
                disabled={isSubmitting || isOverLimit}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
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
              <button onClick={() => { setPayTarget(null); setPayRegistered(false); }} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {payRegistered ? (
              /* ── Pantalla de confirmación ── */
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

                  {/* 1 — Seleccionar banco */}
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

                  {/* 2 — Datos del banco seleccionado (CLABE dinámica) */}
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

                  {/* 3 — Monto y referencia */}
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
