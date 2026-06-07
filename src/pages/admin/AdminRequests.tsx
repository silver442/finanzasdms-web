/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ShieldCheck, ShieldAlert, User, Phone, MapPin, Wallet,
  CheckCircle2, XCircle, X, AlertTriangle, CreditCard, Banknote, Lock,
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
  termQuantity: number;
  termUnit: string;
  interestRate?: string | number;
  startDate: string;
  status?: string;
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
  const [pendingTransfer, setPendingTransfer] = useState<AdminLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Approve modal state (incluye edición de capital/tasa según categoría)
  const [approveTarget, setApproveTarget] = useState<AdminLoan | null>(null);
  const [approveForm, setApproveForm] = useState({ amount: '', interestRate: '' });
  const [isApproving, setIsApproving] = useState(false);

  // Reject confirmation state
  const [rejectTarget, setRejectTarget] = useState<AdminLoan | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Confirmar transferencia state
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const { data } = await axios.get<AdminLoan[]>(
        `${API}/loans/all`,
        { headers: authHeaders() },
      );
      setLoans(data.filter(l => l.status === 'REQUESTED'));
      setPendingTransfer(data.filter(l => l.status === 'PENDIENTE_TRANSFERIR'));
    } catch {
      toast.error('No se pudieron cargar las solicitudes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRequests(); }, [fetchRequests]);

  // Categoría de edición de la solicitud en el modal de aprobación.
  const approveCategory = useMemo(() => {
    if (!approveTarget) return { isFamiliar: false, isReferido: false, canEdit: false, maxAmount: null as number | null, minRate: null as number | null, label: '' };
    const isFamiliar = !!approveTarget.user.familyCode;
    const isReferido = !!approveTarget.referralCode && !isFamiliar;
    const maxAmount = isFamiliar
      ? Number(approveTarget.user.creditLimit ?? 0) * 3
      : isReferido ? Number(approveTarget.amount) * 2 : null;
    const minRate = isFamiliar ? 30 : isReferido ? 40 : null;
    return {
      isFamiliar,
      isReferido,
      canEdit: isFamiliar || isReferido,
      maxAmount,
      minRate,
      label: isFamiliar ? 'familiares' : 'referidos',
    };
  }, [approveTarget]);

  const openApprove = (loan: AdminLoan) => {
    setApproveTarget(loan);
    // Inicializar con datos reales del préstamo. La tasa parte de la sugerida
    // del usuario (loan.interestRate es 0 mientras está en REQUESTED).
    setApproveForm({
      amount: String(Number(loan.amount)),
      interestRate: String(Number(loan.user.currentRate ?? 50)),
    });
  };

  const approveValidation = useMemo(() => {
    if (!approveTarget) return { amountError: null as string | null, rateError: null as string | null, hasErrors: false };
    const { canEdit, maxAmount, minRate, label } = approveCategory;
    if (!canEdit) return { amountError: null, rateError: null, hasErrors: false };

    const parsedAmount = approveForm.amount !== '' ? parseFloat(approveForm.amount) : null;
    const parsedRate = approveForm.interestRate !== '' ? parseFloat(approveForm.interestRate) : null;

    const amountError =
      maxAmount !== null && parsedAmount !== null && parsedAmount > maxAmount
        ? `⚠️ El monto supera el máximo de ${fmt(maxAmount)} para ${label}`
        : null;
    const rateError =
      minRate !== null && parsedRate !== null && parsedRate < minRate
        ? `⚠️ La tasa no puede ser menor a ${minRate}% para ${label}`
        : null;

    return { amountError, rateError, hasErrors: !!(amountError || rateError) };
  }, [approveTarget, approveForm, approveCategory]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    if (approveValidation.hasErrors) return;
    const interestRate = parseFloat(approveForm.interestRate);
    if (isNaN(interestRate) || interestRate < 0) {
      toast.error('Ingresa una tasa válida');
      return;
    }
    // Solo se envía amount cuando la categoría permite editarlo.
    const payload: Record<string, number> = { interestRate };
    if (approveCategory.canEdit && approveForm.amount !== '') {
      payload.amount = parseFloat(approveForm.amount);
    }
    setIsApproving(true);
    try {
      await axios.patch(
        `${API}/loans/${approveTarget.id}/approve`,
        payload,
        { headers: authHeaders() },
      );
      toast.success(`Préstamo de ${approveTarget.user.name ?? approveTarget.user.email} aprobado — esperando confirmación del usuario`);
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

  const handleConfirmTransfer = async (loan: AdminLoan) => {
    setConfirmingId(loan.id);
    try {
      await axios.patch(`${API}/loans/${loan.id}/confirm-transfer`, {}, { headers: authHeaders() });
      toast.success(`Préstamo de ${loan.user.name ?? loan.user.email} activado`);
      setPendingTransfer(prev => prev.filter(l => l.id !== loan.id));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al confirmar transferencia');
    } finally {
      setConfirmingId(null);
    }
  };

  const capacity = (loan: AdminLoan) => {
    const income = Number(loan.user.income ?? 0);
    const expenses = Number(loan.user.expenses ?? 0);
    const free = income - expenses;
    return { income, expenses, free };
  };

  const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand-green transition-colors';

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-violet flex items-center gap-3">
          <ShieldCheck size={32} />
          Solicitudes Pendientes
        </h1>
        <p className="text-text-secondary mt-2">Revisa y aprueba las solicitudes de préstamo de los usuarios</p>
      </div>

      {/* ── Pendientes de Transferir (el cliente ya aceptó las condiciones) ── */}
      {!isLoading && pendingTransfer.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Banknote size={22} className="text-violet-400" />
            <h2 className="text-xl font-bold text-violet-300">Pendientes de Transferir</h2>
            <span className="bg-violet-500/20 text-violet-300 text-xs px-2 py-0.5 rounded-full border border-violet-500/30 font-semibold">
              {pendingTransfer.length}
            </span>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            El cliente aceptó las condiciones. Envía el dinero y confirma la transferencia para activar el préstamo.
          </p>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {pendingTransfer.map(loan => {
              const isOwnLoan = loan.user.id === adminId;
              return (
                <div key={loan.id} className="bg-surface-card border border-violet-500/30 rounded-2xl shadow-xl p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-bold">{loan.concept}</h3>
                      <p className="text-sm text-text-secondary">
                        {loan.user.name ?? loan.user.email} · {fmt(loan.amount)} · {pct(loan.interestRate)}
                      </p>
                    </div>
                    <span className="bg-violet-500/20 text-violet-300 text-xs px-2 py-1 rounded border border-violet-500/30 font-semibold whitespace-nowrap">
                      Cliente aceptó
                    </span>
                  </div>
                  {loan.disbursementAccount && (
                    <div className="bg-surface-base rounded-lg p-3 text-sm">
                      <p className="text-text-muted text-xs mb-0.5">CLABE de Depósito</p>
                      <p className="font-mono text-white">{loan.disbursementAccount}</p>
                      {CLABE_BANK_CODES[loan.disbursementAccount.slice(0, 3)] && (
                        <p className="text-brand-green-light text-xs mt-0.5">
                          {CLABE_BANK_CODES[loan.disbursementAccount.slice(0, 3)]}
                        </p>
                      )}
                    </div>
                  )}
                  {isOwnLoan ? (
                    <div className="flex items-center gap-2 bg-brand-violet/10 border border-brand-violet/30 rounded-xl px-4 py-2.5">
                      <ShieldAlert size={15} className="text-brand-violet shrink-0" />
                      <span className="text-brand-violet text-xs font-semibold">
                        Tu préstamo · Requiere otro Admin
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => void handleConfirmTransfer(loan)}
                      disabled={confirmingId === loan.id}
                      className="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                    >
                      <Banknote size={18} />
                      {confirmingId === loan.id ? 'Activando...' : 'Confirmar Transferencia'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20 text-text-secondary">Cargando solicitudes...</div>
      ) : loans.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <CheckCircle2 size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay solicitudes pendientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {loans.map(loan => {
            const isOwnLoan = loan.user.id === adminId;
            const { income, expenses, free } = capacity(loan);
            const totalFlat = Number(loan.amount) + Number(loan.amount) * (Number(loan.user.currentRate ?? 50) / 100);
            const monthlyEst = loan.termQuantity > 0 ? totalFlat / loan.termQuantity : 0;
            const canAfford = free >= monthlyEst;

            return (
              <div key={loan.id} className="bg-surface-card border border-surface-border rounded-2xl shadow-xl overflow-hidden flex flex-col">

                {/* Card header */}
                <div className="p-5 border-b border-surface-border bg-surface-base/40 flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-0.5">{loan.concept}</h2>
                    <p className="text-sm text-text-secondary">
                      {fmt(loan.amount)} · {loan.termQuantity} {loan.termUnit === 'SEMANAS' ? 'semanas' : 'meses'}
                    </p>
                    {loan.referralCode && (
                      <span className="text-xs text-brand-green-light font-mono mt-1 inline-block">
                        Ref: {loan.referralCode}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="bg-brand-violet/20 text-brand-violet text-xs px-2 py-1 rounded border border-brand-violet/30 font-semibold whitespace-nowrap">
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
                    <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                      <User size={16} className="text-text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">Usuario</p>
                      <p className="text-white font-semibold">{loan.user.name ?? '—'}</p>
                      <p className="text-text-secondary text-sm">{loan.user.email}</p>
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                      <Phone size={16} className="text-text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">Teléfono</p>
                      <p className="text-white">{loan.user.phone ?? '—'}</p>
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">Ubicación · Vivienda</p>
                      <p className="text-white">
                        {loan.user.state ?? '—'}, {loan.user.country ?? '—'}
                      </p>
                      <p className="text-text-secondary text-sm">{loan.user.housingStatus ?? '—'}</p>
                    </div>
                  </div>

                  {/* Capacidad de pago */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                      <Wallet size={16} className="text-text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-2">Capacidad de Pago</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="bg-surface-base rounded-lg p-2 text-center">
                          <p className="text-text-muted text-xs mb-0.5">Ingresos</p>
                          <p className="text-brand-green-light font-bold">{income > 0 ? fmt(income) : '—'}</p>
                        </div>
                        <div className="bg-surface-base rounded-lg p-2 text-center">
                          <p className="text-text-muted text-xs mb-0.5">Gastos</p>
                          <p className="text-red-400 font-bold">{expenses > 0 ? fmt(expenses) : '—'}</p>
                        </div>
                        <div className={`rounded-lg p-2 text-center ${canAfford && free > 0 ? 'bg-brand-green/10' : 'bg-red-500/10'}`}>
                          <p className="text-text-muted text-xs mb-0.5">Libre</p>
                          <p className={`font-bold ${canAfford && free > 0 ? 'text-brand-green-light' : 'text-red-400'}`}>
                            {free !== 0 ? fmt(free) : '—'}
                          </p>
                        </div>
                      </div>
                      {income > 0 && (
                        <div className={`mt-2 flex items-center gap-1.5 text-xs ${canAfford ? 'text-brand-green-light' : 'text-red-400'}`}>
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
                    <div className="bg-surface-base rounded-lg p-3">
                      <p className="text-text-muted text-xs mb-0.5">Límite Global del Usuario</p>
                      <p className="text-white font-bold">{fmt(loan.user.creditLimit ?? 0)}</p>
                    </div>
                    <div className="bg-surface-base rounded-lg p-3">
                      <p className="text-text-muted text-xs mb-0.5">Tasa Personalizada</p>
                      <p className="text-white font-bold">{pct(loan.interestRate ?? 0)}</p>
                      <p className="text-text-muted text-xs mt-0.5">Sugerida: {pct(loan.user.currentRate)}</p>
                    </div>
                  </div>

                  {/* CLABE de depósito */}
                  {loan.disbursementAccount && loan.disbursementAccount.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                        <CreditCard size={16} className="text-text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">CLABE de Depósito</p>
                        <p className="font-mono text-white text-sm">{loan.disbursementAccount}</p>
                        {CLABE_BANK_CODES[loan.disbursementAccount.slice(0, 3)] && (
                          <p className="text-brand-green-light text-xs mt-0.5">
                            {CLABE_BANK_CODES[loan.disbursementAccount.slice(0, 3)]}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-5 border-t border-surface-border flex gap-3">
                  {isOwnLoan ? (
                    <div className="flex-1 flex items-center gap-2 bg-brand-violet/10 border border-brand-violet/30 rounded-xl px-4 py-2.5">
                      <ShieldAlert size={15} className="text-brand-violet shrink-0" />
                      <span className="text-brand-violet text-xs font-semibold">
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
                        onClick={() => openApprove(loan)}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-light text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20"
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
          <div className="bg-surface-card border border-surface-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-surface-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={20} className="text-brand-green-light" />
                Confirmar Aprobación
              </h3>
              <button onClick={() => setApproveTarget(null)} className="text-text-secondary hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-surface-base rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Usuario</span>
                  <span className="text-white font-semibold">{approveTarget.user.name ?? approveTarget.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Concepto</span>
                  <span className="text-white">{approveTarget.concept}</span>
                </div>
                {approveTarget.disbursementAccount && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">CLABE</span>
                      <span className="text-white font-mono text-xs">{approveTarget.disbursementAccount}</span>
                    </div>
                    {CLABE_BANK_CODES[approveTarget.disbursementAccount.slice(0, 3)] && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Banco</span>
                        <span className="text-brand-green-light font-semibold">
                          {CLABE_BANK_CODES[approveTarget.disbursementAccount.slice(0, 3)]}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Aviso de categoría */}
              {approveCategory.canEdit ? (
                <div className="bg-brand-green/10 border border-brand-green/20 rounded-lg px-3 py-2 text-xs text-brand-green-light">
                  {approveCategory.isFamiliar
                    ? `Familiar: capital hasta ${fmt(approveCategory.maxAmount ?? 0)}, tasa mínima 30%.`
                    : `Referido: capital hasta ${fmt(approveCategory.maxAmount ?? 0)} (2× original), tasa mínima 40%.`}
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-surface-elevated/40 border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary">
                  <Lock size={13} className="shrink-0" />
                  Usuario sin referido ni familiar: condiciones bloqueadas. Solo puedes aprobar o rechazar.
                </div>
              )}

              {/* Capital */}
              <div>
                <label className="block text-sm text-text-primary font-medium mb-1">Capital ($)</label>
                <input
                  type="number"
                  value={approveForm.amount}
                  onChange={e => setApproveForm(f => ({ ...f, amount: e.target.value }))}
                  className={`${inputCls} disabled:opacity-60 disabled:cursor-not-allowed`}
                  min="0"
                  step="0.01"
                  disabled={!approveCategory.canEdit}
                />
                {approveValidation.amountError
                  ? <p className="text-red-400 text-xs mt-1">{approveValidation.amountError}</p>
                  : <p className="text-xs text-text-muted mt-1">
                      Monto original solicitado: <span className="text-brand-green-light">{fmt(approveTarget.amount)}</span>
                    </p>
                }
              </div>

              {/* Tasa de interés */}
              <div>
                <label className="block text-sm text-text-primary font-medium mb-1">Tasa de Interés a Aplicar (%)</label>
                <input
                  type="number"
                  value={approveForm.interestRate}
                  onChange={e => setApproveForm(f => ({ ...f, interestRate: e.target.value }))}
                  className={`${inputCls} disabled:opacity-60 disabled:cursor-not-allowed`}
                  min="0"
                  step="0.5"
                  disabled={!approveCategory.canEdit}
                />
                {approveValidation.rateError
                  ? <p className="text-red-400 text-xs mt-1">{approveValidation.rateError}</p>
                  : <p className="text-xs text-text-muted mt-1">
                      Tasa personalizada del usuario: <span className="text-brand-green-light">{pct(approveTarget.user.currentRate)}</span>
                    </p>
                }
              </div>

              {/* Plazo (siempre bloqueado) */}
              <div>
                <label className="flex items-center gap-1.5 text-sm text-text-primary font-medium mb-1">
                  Plazo <Lock size={12} className="text-text-muted" />
                </label>
                <input
                  type="text"
                  value={`${approveTarget.termQuantity} ${approveTarget.termUnit === 'SEMANAS' ? 'semanas' : 'meses'}`}
                  className={`${inputCls} opacity-60 cursor-not-allowed`}
                  readOnly
                />
                <p className="text-xs text-text-muted mt-1">El plazo no puede modificarse.</p>
              </div>

              {(() => {
                const amt = approveForm.amount !== '' ? parseFloat(approveForm.amount) : Number(approveTarget.amount);
                const rate = parseFloat(approveForm.interestRate);
                if (isNaN(rate) || rate < 0 || isNaN(amt)) return null;
                const total = amt * (1 + rate / 100);
                return (
                  <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-3 text-sm">
                    <p className="text-text-secondary mb-1">Resumen del préstamo aprobado:</p>
                    <p className="text-white">
                      Total a pagar: <strong className="text-brand-green-light">{fmt(total)}</strong>
                    </p>
                    <p className="text-white">
                      Cuota estimada: <strong className="text-brand-green-light">
                        {fmt(approveTarget.termQuantity > 0 ? total / approveTarget.termQuantity : 0)}
                      </strong>
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="p-6 border-t border-surface-border flex gap-3 justify-end">
              <button onClick={() => setApproveTarget(null)} className="px-4 py-2 rounded-lg text-text-primary hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => void handleApprove()}
                disabled={isApproving || approveValidation.hasErrors}
                className="bg-brand-green hover:bg-brand-green-light text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
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
          <div className="bg-surface-card border border-surface-border rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <XCircle size={40} className="text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">¿Rechazar solicitud?</h3>
              <p className="text-text-secondary text-sm mb-6">
                Se removerá la solicitud de <strong className="text-white">{rejectTarget.user.name ?? rejectTarget.user.email}</strong> de esta vista.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setRejectTarget(null)}
                  disabled={isRejecting}
                  className="flex-1 px-4 py-2 rounded-lg border border-surface-border text-text-primary hover:text-white transition-colors disabled:opacity-50">
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

    </div>
  );
}
