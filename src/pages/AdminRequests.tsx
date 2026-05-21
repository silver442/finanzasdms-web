/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ShieldCheck, ShieldAlert, User, Phone, MapPin, Wallet,
  CheckCircle2, XCircle, X, AlertTriangle, Pencil, CreditCard,
} from 'lucide-react';

const CLABE_BANK_CODES: Record<string, string> = {
  '002': 'Citibanamex', '006': 'Bancomext', '009': 'Banobras',
  '012': 'BBVA', '014': 'Santander', '021': 'HSBC',
  '030': 'Bajío', '036': 'Inbursa', '042': 'Mifel',
  '044': 'ScotiaBank', '058': 'Banregio', '059': 'Invex',
  '062': 'Afirme', '072': 'Banorte', '127': 'Azteca',
  '128': 'Autofin', '130': 'Compartamos', '132': 'Multiva',
  '133': 'Actinver', '134': 'Walmart', '137': 'Bancoppel',
  '138': 'ABC Capital', '141': 'Volkswagen', '143': 'CIBanco',
  '147': 'Bankaool', '600': 'Monexcb', '601': 'GBM',
  '610': 'HEY BANCO', '616': 'Fideam', '621': 'Actinver CB',
  '646': 'STP', '706': 'Arcus', '722': 'Mercado Pago',
  '723': 'Cuenca', '728': 'SPIN by OXXO',
};

interface LoanUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  income?: string | number;
  expenses?: string | number;
  housingStatus?: string;
  state?: string;
  country?: string;
  currentRate?: string | number;
  creditLimit?: string | number;
  level?: string;
  familyCode?: string | null;
}

interface AdminLoan {
  id: string;
  concept: string;
  amount: string | number;
  termMonths: number;
  interestRate?: string | number;
  startDate: string;
  referralCode?: string;
  disbursementAccount?: string;
  user: LoanUser;
}

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function getAdminId(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed.id === 'string' ? parsed.id : '';
  } catch { return ''; }
}

function fmt(v: string | number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));
}

function pct(v?: string | number) {
  return `${Number(v ?? 0).toFixed(0)}%`;
}

export default function AdminRequests() {
  const adminId = useMemo(() => getAdminId(), []);
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Approve modal state
  const [approveTarget, setApproveTarget] = useState<AdminLoan | null>(null);
  const [rateInput, setRateInput] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Reject confirmation state
  const [rejectTarget, setRejectTarget] = useState<AdminLoan | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Edit conditions modal state
  const [editTarget, setEditTarget] = useState<AdminLoan | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', termMonths: '', interestRate: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const { data } = await axios.get<{ status: string; user: LoanUser; id: string; concept: string; amount: string | number; termMonths: number; startDate: string; referralCode?: string }[]>(
        `${API}/loans/all`,
        { headers: authHeaders() },
      );
      setLoans(data.filter(l => l.status === 'REQUESTED'));
    } catch {
      toast.error('No se pudieron cargar las solicitudes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRequests(); }, [fetchRequests]);

  const openApprove = (loan: AdminLoan) => {
    setApproveTarget(loan);
    setRateInput(String(Number(loan.user.currentRate ?? 50)));
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    const interestRate = parseFloat(rateInput);
    if (isNaN(interestRate) || interestRate < 0) {
      toast.error('Ingresa una tasa válida');
      return;
    }
    setIsApproving(true);
    try {
      await axios.patch(
        `${API}/loans/${approveTarget.id}/approve`,
        { interestRate },
        { headers: authHeaders() },
      );
      toast.success(`Préstamo de ${approveTarget.user.name ?? approveTarget.user.email} aprobado`);
      setLoans(prev => prev.filter(l => l.id !== approveTarget.id));
      setApproveTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al aprobar');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (loan: AdminLoan) => {
    setIsRejecting(true);
    try {
      await axios.patch(`${API}/loans/${loan.id}/reject`, {}, { headers: authHeaders() });
      toast.success('Solicitud rechazada');
      setLoans(prev => prev.filter(l => l.id !== loan.id));
      setRejectTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al rechazar');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSaveConditions = async () => {
    if (!editTarget) return;
    const payload: Record<string, number> = {};
    if (editForm.amount !== '') payload.amount = parseFloat(editForm.amount);
    if (editForm.termMonths !== '') payload.termMonths = parseInt(editForm.termMonths);
    if (editForm.interestRate !== '') payload.interestRate = parseFloat(editForm.interestRate);

    if (Object.keys(payload).length === 0) { setEditTarget(null); return; }

    setIsSaving(true);
    try {
      const { data } = await axios.patch(
        `${API}/loans/${editTarget.id}/conditions`,
        payload,
        { headers: authHeaders() },
      );
      setLoans(prev => prev.map(l => l.id === editTarget.id ? { ...l, ...data } : l));
      toast.success('Condiciones actualizadas');
      setEditTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al guardar condiciones');
    } finally {
      setIsSaving(false);
    }
  };

  const editValidation = useMemo(() => {
    if (!editTarget) return { amountError: null, rateError: null, hasErrors: false };

    const isFamiliar = !!editTarget.user.familyCode;
    const isReferido  = !!editTarget.referralCode && !isFamiliar;

    const maxAmount = isFamiliar
      ? Number(editTarget.user.creditLimit ?? 0) * 3
      : isReferido ? 1000 : null;

    const minRate = isFamiliar ? 30 : isReferido ? 40 : null;
    const categoryLabel = isFamiliar ? 'familiares' : 'referidos';

    const parsedAmount = editForm.amount !== '' ? parseFloat(editForm.amount) : null;
    const parsedRate   = editForm.interestRate !== '' ? parseFloat(editForm.interestRate) : null;

    const amountError =
      maxAmount !== null && parsedAmount !== null && parsedAmount > maxAmount
        ? `⚠️ El monto supera el máximo de ${fmt(maxAmount)} para ${categoryLabel}`
        : null;

    const rateError =
      minRate !== null && parsedRate !== null && parsedRate < minRate
        ? `⚠️ La tasa no puede ser menor a ${minRate}% para ${categoryLabel}`
        : null;

    return { amountError, rateError, hasErrors: !!(amountError || rateError) };
  }, [editTarget, editForm]);

  const capacity = (loan: AdminLoan) => {
    const income = Number(loan.user.income ?? 0);
    const expenses = Number(loan.user.expenses ?? 0);
    const free = income - expenses;
    return { income, expenses, free };
  };

  const inputCls = 'w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors';

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-amber-400 flex items-center gap-3">
          <ShieldCheck size={32} />
          Solicitudes Pendientes
        </h1>
        <p className="text-slate-400 mt-2">Revisa y aprueba las solicitudes de préstamo de los usuarios</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-400">Cargando solicitudes...</div>
      ) : loans.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <CheckCircle2 size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay solicitudes pendientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {loans.map(loan => {
            const isOwnLoan = loan.user.id === adminId;
            const { income, expenses, free } = capacity(loan);
            const totalFlat = Number(loan.amount) + Number(loan.amount) * (Number(loan.user.currentRate ?? 50) / 100);
            const monthlyEst = loan.termMonths > 0 ? totalFlat / loan.termMonths : 0;
            const canAfford = free >= monthlyEst;

            return (
              <div key={loan.id} className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden flex flex-col">

                {/* Card header */}
                <div className="p-5 border-b border-slate-700 bg-slate-900/40 flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-0.5">{loan.concept}</h2>
                    <p className="text-sm text-slate-400">
                      {fmt(loan.amount)} · {loan.termMonths} meses
                    </p>
                    {loan.referralCode && (
                      <span className="text-xs text-emerald-400 font-mono mt-1 inline-block">
                        Ref: {loan.referralCode}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded border border-amber-500/30 font-semibold whitespace-nowrap">
                      En revisión
                    </span>
                    {loan.user.level?.startsWith('NOVATO') && (
                      <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-xs px-2 py-1 rounded font-semibold whitespace-nowrap">
                        ⚠️ Requiere INE (Verificar WhatsApp)
                      </span>
                    )}
                  </div>
                </div>

                {/* KYC body */}
                <div className="p-5 grid grid-cols-1 gap-4 flex-1">

                  {/* Usuario */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                      <User size={16} className="text-slate-300" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Usuario</p>
                      <p className="text-white font-semibold">{loan.user.name ?? '—'}</p>
                      <p className="text-slate-400 text-sm">{loan.user.email}</p>
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                      <Phone size={16} className="text-slate-300" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Teléfono</p>
                      <p className="text-white">{loan.user.phone ?? '—'}</p>
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-slate-300" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Ubicación · Vivienda</p>
                      <p className="text-white">
                        {loan.user.state ?? '—'}, {loan.user.country ?? '—'}
                      </p>
                      <p className="text-slate-400 text-sm">{loan.user.housingStatus ?? '—'}</p>
                    </div>
                  </div>

                  {/* Capacidad de pago */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                      <Wallet size={16} className="text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Capacidad de Pago</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="bg-slate-900 rounded-lg p-2 text-center">
                          <p className="text-slate-500 text-xs mb-0.5">Ingresos</p>
                          <p className="text-emerald-400 font-bold">{income > 0 ? fmt(income) : '—'}</p>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-2 text-center">
                          <p className="text-slate-500 text-xs mb-0.5">Gastos</p>
                          <p className="text-red-400 font-bold">{expenses > 0 ? fmt(expenses) : '—'}</p>
                        </div>
                        <div className={`rounded-lg p-2 text-center ${canAfford && free > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                          <p className="text-slate-500 text-xs mb-0.5">Libre</p>
                          <p className={`font-bold ${canAfford && free > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {free !== 0 ? fmt(free) : '—'}
                          </p>
                        </div>
                      </div>
                      {income > 0 && (
                        <div className={`mt-2 flex items-center gap-1.5 text-xs ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                          {canAfford
                            ? <><CheckCircle2 size={12} /> Cuota estimada {fmt(monthlyEst)}/mes — dentro de capacidad</>
                            : <><AlertTriangle size={12} /> Cuota estimada {fmt(monthlyEst)}/mes — supera capacidad</>
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Límite y tasa */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-900 rounded-lg p-3">
                      <p className="text-slate-500 text-xs mb-0.5">Límite Global del Usuario</p>
                      <p className="text-white font-bold">{fmt(loan.user.creditLimit ?? 0)}</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3">
                      <p className="text-slate-500 text-xs mb-0.5">Tasa Personalizada</p>
                      <p className="text-white font-bold">{pct(loan.interestRate ?? 0)}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Sugerida: {pct(loan.user.currentRate)}</p>
                    </div>
                  </div>

                  {/* CLABE de depósito */}
                  {loan.disbursementAccount && loan.disbursementAccount.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                        <CreditCard size={16} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">CLABE de Depósito</p>
                        <p className="font-mono text-white text-sm">{loan.disbursementAccount}</p>
                        {CLABE_BANK_CODES[loan.disbursementAccount.slice(0, 3)] && (
                          <p className="text-emerald-400 text-xs mt-0.5">
                            {CLABE_BANK_CODES[loan.disbursementAccount.slice(0, 3)]}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-5 border-t border-slate-700 flex gap-3">
                  {isOwnLoan ? (
                    <div className="flex-1 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5">
                      <ShieldAlert size={15} className="text-amber-400 shrink-0" />
                      <span className="text-amber-300 text-xs font-semibold">
                        Tu solicitud · Requiere revisión de otro Admin
                      </span>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setRejectTarget(loan)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white hover:border-red-500 px-4 py-2.5 rounded-xl font-bold transition-all"
                      >
                        <XCircle size={18} />
                        Rechazar
                      </button>
                      <button
                        onClick={() => {
                          setEditTarget(loan);
                          setEditForm({
                            amount: String(Number(loan.amount)),
                            termMonths: String(loan.termMonths),
                            interestRate: '',
                          });
                        }}
                        className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2.5 rounded-xl font-bold transition-all"
                        title="Editar condiciones"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => openApprove(loan)}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle2 size={18} />
                        Aprobar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Confirmar Aprobación ── */}
      {approveTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-400" />
                Confirmar Aprobación
              </h3>
              <button onClick={() => setApproveTarget(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-900 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Usuario</span>
                  <span className="text-white font-semibold">{approveTarget.user.name ?? approveTarget.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Concepto</span>
                  <span className="text-white">{approveTarget.concept}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monto</span>
                  <span className="text-white font-bold">{fmt(approveTarget.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Plazo</span>
                  <span className="text-white">{approveTarget.termMonths} meses</span>
                </div>
                {approveTarget.disbursementAccount && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CLABE</span>
                      <span className="text-white font-mono text-xs">{approveTarget.disbursementAccount}</span>
                    </div>
                    {CLABE_BANK_CODES[approveTarget.disbursementAccount.slice(0, 3)] && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Banco</span>
                        <span className="text-emerald-400 font-semibold">
                          {CLABE_BANK_CODES[approveTarget.disbursementAccount.slice(0, 3)]}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-300 font-medium mb-1">
                  Tasa de Interés a Aplicar (%)
                </label>
                <input
                  type="number"
                  value={rateInput}
                  onChange={e => setRateInput(e.target.value)}
                  className={inputCls}
                  min="0"
                  step="0.5"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Tasa personalizada del usuario: <span className="text-emerald-400">{pct(approveTarget.user.currentRate)}</span>
                </p>
              </div>

              {rateInput && !isNaN(parseFloat(rateInput)) && parseFloat(rateInput) >= 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm">
                  <p className="text-slate-400 mb-1">Resumen del préstamo aprobado:</p>
                  <p className="text-white">
                    Total a pagar: <strong className="text-emerald-400">
                      {fmt(Number(approveTarget.amount) * (1 + parseFloat(rateInput) / 100))}
                    </strong>
                  </p>
                  <p className="text-white">
                    Cuota mensual: <strong className="text-emerald-400">
                      {fmt(Number(approveTarget.amount) * (1 + parseFloat(rateInput) / 100) / approveTarget.termMonths)}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button onClick={() => setApproveTarget(null)} className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => void handleApprove()}
                disabled={isApproving}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isApproving ? 'Aprobando...' : 'Confirmar Aprobación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar Rechazo ── */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <XCircle size={40} className="text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">¿Rechazar solicitud?</h3>
              <p className="text-slate-400 text-sm mb-6">
                Se removerá la solicitud de <strong className="text-white">{rejectTarget.user.name ?? rejectTarget.user.email}</strong> de esta vista.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setRejectTarget(null)}
                  disabled={isRejecting}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={() => void handleReject(rejectTarget)}
                  disabled={isRejecting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50">
                  {isRejecting ? 'Rechazando...' : 'Rechazar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Condiciones ── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Pencil size={18} className="text-amber-400" />
                Editar Condiciones
              </h3>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400">
                Solicitud de <strong className="text-white">{editTarget.user.name ?? editTarget.user.email}</strong>.
                Deja un campo sin cambios para mantener el valor actual.
              </p>

              <div>
                <label className="text-sm text-slate-300 font-medium block mb-1">Monto ($)</label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                  className={inputCls}
                  min="100"
                  step="100"
                />
                {editValidation.amountError
                  ? <p className="text-red-400 text-xs mt-1">{editValidation.amountError}</p>
                  : <p className="text-xs text-slate-500 mt-1">
                      Límite de crédito: <span className="text-emerald-400">{fmt(editTarget.user.creditLimit ?? 0)}</span>
                    </p>
                }
              </div>

              <div>
                <label className="text-sm text-slate-300 font-medium block mb-1">Plazo (meses)</label>
                <input
                  type="number"
                  value={editForm.termMonths}
                  onChange={e => setEditForm(f => ({ ...f, termMonths: e.target.value }))}
                  className={inputCls}
                  min="1"
                  max="24"
                  step="1"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 font-medium block mb-1">Tasa de interés (%)</label>
                <input
                  type="number"
                  value={editForm.interestRate}
                  onChange={e => setEditForm(f => ({ ...f, interestRate: e.target.value }))}
                  className={inputCls}
                  min="0"
                  max="100"
                  step="0.5"
                />
                {editValidation.rateError
                  ? <p className="text-red-400 text-xs mt-1">{editValidation.rateError}</p>
                  : <p className="text-xs text-slate-500 mt-1">
                      Tasa personalizada del usuario: <span className="text-emerald-400">{pct(editTarget.user.currentRate)}</span>
                    </p>
                }
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSaveConditions()}
                disabled={isSaving || editValidation.hasErrors}
                className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
