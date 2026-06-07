/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft, CreditCard, CheckCircle2, Circle, AlertCircle, Copy,
  Clock, Ban, Banknote, X, Paperclip, MessageCircle, AlertTriangle,
} from 'lucide-react';

interface AdminBank { id: string; bankName: string; clabe: string; accountHolder: string; }

interface PaymentRequestRecord {
  id: string; amount: string | number; reference?: string;
  createdAt: string; approvedAt?: string; adminBank?: { bankName: string };
}

interface Installment {
  id: string; number: number; dueDate: string;
  amountDue: string | number; amountPaid: string | number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  lateFeeAmount?: string | number;
  loanId: string;
  paymentRequests?: PaymentRequestRecord[];
}

interface Loan {
  id: string; concept: string;
  amount: string | number; interestRate: string | number;
  termQuantity: number; termUnit: string;
  startDate: string; updatedAt: string;
  status: 'REQUESTED' | 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'REJECTED' | 'CANCELADO' | 'ESPERANDO_CONFIRMACION' | 'PENDIENTE_TRANSFERIR';
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

function generateSATCode(): string {
  return 'F0' + Math.floor(Math.random() * 1e8).toString().padStart(8, '0');
}

function getUserData() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return { level: 'NOVATO_1', familyCode: null as string | null };
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      level: typeof p.level === 'string' ? p.level : 'NOVATO_1',
      familyCode: typeof p.familyCode === 'string' && p.familyCode.length > 0 ? p.familyCode : null,
    };
  } catch { return { level: 'NOVATO_1', familyCode: null }; }
}

const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand-green transition-colors placeholder-slate-600';

export default function LoanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { level, familyCode } = getUserData();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [banks, setBanks] = useState<AdminBank[]>([]);

  // Modal abonar
  const [payTarget, setPayTarget] = useState<Installment | null>(null);
  const [payRegistered, setPayRegistered] = useState(false);
  const [satCode, setSatCode] = useState('');
  const [payForm, setPayForm] = useState({ amount: '', bankId: '', reference: '', receipt: null as File | null });
  const [isPaying, setIsPaying] = useState(false);

  const fetchLoan = useCallback(async () => {
    try {
      const { data } = await axios.get<Loan[]>(`${API}/loans/my-loans`, { headers: authHeaders() });
      const found = data.find(l => l.id === id);
      if (!found) { toast.error('Préstamo no encontrado'); navigate('/loans'); return; }
      setLoan(found);
    } catch {
      toast.error('No se pudo cargar el préstamo');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  const fetchBanks = useCallback(async () => {
    try {
      const { data } = await axios.get<AdminBank[]>(`${API}/admin-banks`);
      setBanks(data);
    } catch { /* no crítico */ }
  }, []);

  useEffect(() => { void fetchLoan(); void fetchBanks(); }, [fetchLoan, fetchBanks]);

  const handleCancel = async () => {
    if (!loan) return;
    try {
      await axios.patch(`${API}/loans/${loan.id}/cancel`, {}, { headers: authHeaders() });
      toast.success('Solicitud cancelada');
      navigate('/loans');
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Error al cancelar'); }
  };

  const handleAccept = async () => {
    if (!loan) return;
    try {
      await axios.patch(`${API}/loans/${loan.id}/accept-conditions`, {}, { headers: authHeaders() });
      toast.success('¡Condiciones aceptadas! Esperando la transferencia del administrador.');
      void fetchLoan();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Error al aceptar'); }
  };

  const handleDecline = async () => {
    if (!loan) return;
    try {
      await axios.patch(`${API}/loans/${loan.id}/decline`, {}, { headers: authHeaders() });
      toast.success('Préstamo rechazado');
      navigate('/loans');
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Error al rechazar'); }
  };

  const handlePay = async () => {
    if (!payTarget) return;
    const amount = parseFloat(payForm.amount);
    if (isNaN(amount) || amount <= 0) { toast.error('Ingresa una cantidad válida'); return; }
    if (!payForm.bankId) { toast.error('Selecciona el banco'); return; }
    if (!payForm.receipt) { toast.error('Adjunta el comprobante'); return; }
    if (payForm.receipt.size > 5 * 1024 * 1024) { toast.error('El comprobante no debe superar 5 MB'); return; }

    const fd = new FormData();
    fd.append('installmentId', payTarget.id);
    fd.append('amount', String(amount));
    fd.append('bankId', payForm.bankId);
    if (payForm.reference) fd.append('reference', payForm.reference);
    fd.append('receipt', payForm.receipt);

    setIsPaying(true);
    try {
      await axios.post(`${API}/payment-requests`, fd, { headers: authHeaders() });
      setPayRegistered(true);
      setPayForm({ amount: '', bankId: '', reference: '', receipt: null });
      void fetchLoan();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Error al registrar'); }
    finally { setIsPaying(false); }
  };

  const openPay = (inst: Installment) => {
    const code = generateSATCode();
    setSatCode(code);
    setPayTarget(inst);
    setPayRegistered(false);
    setPayForm({
      amount: String(Math.max(0, Number(inst.amountDue) - Number(inst.amountPaid))),
      bankId: '', reference: code, receipt: null,
    });
  };

  const copyText = (t: string) => { void navigator.clipboard.writeText(t); toast.success('Copiado'); };

  if (isLoading) return <div className="flex justify-center py-20 text-text-secondary">Cargando...</div>;
  if (!loan) return null;

  const totalPaid = loan.installments.reduce((a, i) => a + Number(i.amountPaid), 0);
  const totalDue  = loan.installments.reduce((a, i) => a + Number(i.amountDue), 0);
  const debtActual = Math.max(0, totalDue - totalPaid);
  const progress = totalDue > 0 ? Math.min((totalPaid / totalDue) * 100, 100) : 0;
  const progressColor = progress >= 75 ? 'bg-brand-green' : progress >= 40 ? 'bg-brand-violet' : 'bg-sky-500';

  const abonosHistory = loan.installments
    .flatMap(i => (i.paymentRequests ?? []).map(pr => ({ ...pr, cuotaNumber: i.number })))
    .sort((a, b) => new Date(a.approvedAt ?? a.createdAt).getTime() - new Date(b.approvedAt ?? b.createdAt).getTime());

  const isActive    = loan.status === 'ACTIVE';
  const isPaid      = loan.status === 'PAID';
  const isRequested = loan.status === 'REQUESTED';
  const isEsperando = loan.status === 'ESPERANDO_CONFIRMACION';
  const isPending   = loan.status === 'PENDIENTE_TRANSFERIR';
  const isRejected  = loan.status === 'REJECTED';

  return (
    <div className="p-6 md:p-8 text-white font-sans max-w-5xl mx-auto">

      {/* Back */}
      <button
        onClick={() => navigate('/loans')}
        className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-6 text-sm font-semibold"
      >
        <ArrowLeft size={18} /> Mis Préstamos
      </button>

      {/* Encabezado del préstamo */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{loan.concept}</h1>
            <p className="text-text-secondary text-sm mt-1">
              Capital: {fmt(loan.amount)} · {loan.termQuantity} {loan.termUnit === 'SEMANAS' ? 'semanas' : 'meses'} · Tasa: {Number(loan.interestRate)}% anual
            </p>
            <p className="text-xs text-text-muted mt-0.5">Inicio: {fmtDate(loan.startDate)}</p>
          </div>
          {totalDue > 0 && (
            <div className="text-right shrink-0">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-0.5">Deuda total pactada</p>
              <p className="text-xl font-extrabold text-brand-green-light">{fmt(totalDue)}</p>
            </div>
          )}
        </div>

        {totalDue > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="bg-surface-base/60 rounded-xl p-3">
                <p className="text-xs text-text-muted mb-1">Pagado</p>
                <p className="text-base font-bold text-brand-green-light">{fmt(totalPaid)}</p>
              </div>
              <div className="bg-surface-base/60 rounded-xl p-3">
                <p className="text-xs text-text-muted mb-1">Deuda actual</p>
                <p className={`text-base font-bold ${isPaid ? 'text-text-muted' : 'text-red-400'}`}>{fmt(debtActual)}</p>
              </div>
              <div className="bg-surface-base/60 rounded-xl p-3">
                <p className="text-xs text-text-muted mb-1">Progreso</p>
                <p className="text-base font-bold text-white">{progress.toFixed(0)}%</p>
              </div>
            </div>
            <div className="h-2.5 bg-surface-elevated rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
      </div>

      {/* Estados especiales */}
      {isRequested && (
        <div className="bg-surface-card border border-brand-violet/30 rounded-2xl p-6 mb-6 flex flex-col items-center gap-4 text-center">
          <AlertTriangle size={32} className="text-brand-violet" />
          <p className="text-brand-violet font-bold">Esperando aprobación del administrador</p>
          {(level.startsWith('NOVATO') || !familyCode) && (
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=${encodeURIComponent('Verificación de identidad FinanzasDMS')}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/30 text-brand-green-light hover:bg-brand-green hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
            >
              📲 Enviar INE por WhatsApp
            </a>
          )}
          <button
            onClick={() => void handleCancel()}
            className="inline-flex items-center gap-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            <X size={15} /> Cancelar Solicitud
          </button>
        </div>
      )}

      {isEsperando && (
        <div className="bg-surface-card border border-brand-violet/40 rounded-2xl p-6 mb-6">
          <div className="bg-brand-violet/10 border border-brand-violet/30 rounded-xl p-4 mb-4">
            <p className="text-brand-violet font-bold text-sm mb-1">⚠️ Tu préstamo fue aprobado — Revisa las condiciones</p>
            <p className="text-brand-violet/80 text-xs">Las condiciones pudieron haber sido modificadas. Revisa el monto, plazo y tasa antes de aceptar.</p>
          </div>
          <p className="text-text-primary text-sm mb-4">
            Capital: {fmt(loan.amount)} · {loan.termQuantity} {loan.termUnit === 'SEMANAS' ? 'semanas' : 'meses'} · Tasa Anualizado: {Number(loan.interestRate)}%
          </p>
          <div className="flex gap-3">
            <button onClick={() => void handleAccept()}
              className="flex-1 bg-brand-green hover:bg-brand-green-light text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all">
              ✓ Aceptar Condiciones
            </button>
            <button onClick={() => void handleDecline()}
              className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 hover:border-red-500 px-4 py-2.5 rounded-xl font-bold text-sm transition-all">
              ✗ Rechazar Préstamo
            </button>
          </div>
        </div>
      )}

      {isPending && (
        <div className="bg-surface-card border border-violet-500/30 rounded-2xl p-6 mb-6 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Banknote size={28} className="text-violet-400" />
          </div>
          <p className="text-violet-300 font-semibold">Aprobado — esperando transferencia</p>
          <p className="text-text-muted text-xs max-w-xs">
            Aceptaste las condiciones. El administrador está procesando el envío del dinero; tu préstamo se activará cuando confirme la transferencia.
          </p>
        </div>
      )}

      {isRejected && (
        <div className="bg-surface-card border border-red-500/30 rounded-2xl p-6 mb-6 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <Ban size={28} className="text-red-400" />
          </div>
          <p className="text-red-400 font-semibold">Solicitud rechazada</p>
          <p className="text-text-muted text-xs max-w-xs">Esta solicitud no fue aprobada. Puedes solicitar un nuevo préstamo cuando lo desees.</p>
        </div>
      )}

      {/* Tabla de amortización (solo préstamos con cuotas) */}
      {(isActive || isPaid) && loan.installments.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden mb-6">
          <div className="p-5 border-b border-surface-border">
            <h2 className="text-base font-bold text-white">Tabla de Amortización</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-text-secondary border-b border-surface-border bg-surface-base/40">
                  <th className="px-4 py-3 font-semibold">N°</th>
                  <th className="px-4 py-3 font-semibold">Vencimiento</th>
                  <th className="px-4 py-3 font-semibold text-right">A Pagar</th>
                  <th className="px-4 py-3 font-semibold text-right">Abonado</th>
                  <th className="px-4 py-3 font-semibold text-center">Días Retraso</th>
                  <th className="px-4 py-3 font-semibold text-right">Interés Moratorio</th>
                  <th className="px-4 py-3 font-semibold text-center">Estado</th>
                  <th className="px-4 py-3 font-semibold text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loan.installments.map(inst => {
                  const isPaidInst  = inst.status === 'PAID';
                  const isPartial   = inst.status === 'PARTIAL';
                  const late        = daysLate(inst.dueDate, inst.status);
                  const lateFee     = Number(inst.lateFeeAmount ?? 0);

                  return (
                    <tr key={inst.id} className={`hover:bg-surface-elevated/20 ${isPaidInst ? 'opacity-70' : ''}`}>
                      <td className="px-4 py-3 text-text-secondary">{inst.number}</td>
                      <td className="px-4 py-3 text-text-primary whitespace-nowrap">{fmtDate(inst.dueDate)}</td>
                      <td className="px-4 py-3 text-right text-text-primary whitespace-nowrap">{fmt(inst.amountDue)}</td>
                      <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${isPaidInst ? 'text-brand-green-light' : isPartial ? 'text-brand-violet' : 'text-white'}`}>
                        {fmt(inst.amountPaid)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {late > 0
                          ? <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded font-semibold">{late}d</span>
                          : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {lateFee > 0
                          ? <span className="text-orange-400 font-semibold">{fmt(lateFee)}</span>
                          : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPaidInst
                          ? <CheckCircle2 size={18} className="text-brand-green mx-auto" />
                          : isPartial
                            ? <AlertCircle size={18} className="text-brand-violet mx-auto" />
                            : <Circle size={18} className="text-text-muted mx-auto" />}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!isPaidInst && isActive && (
                          <button
                            onClick={() => openPay(inst)}
                            className="text-xs bg-brand-green/20 hover:bg-brand-green/30 text-brand-green-light border border-brand-green/30 px-3 py-1 rounded-lg transition-colors font-medium"
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
        </div>
      )}

      {/* Historial de abonos */}
      {abonosHistory.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4">Historial de Abonos</h2>
          <div className="space-y-2">
            {abonosHistory.map(abono => (
              <div key={abono.id} className="flex justify-between items-center text-sm bg-surface-base/40 rounded-lg px-4 py-2.5">
                <div className="flex flex-col">
                  <span className="text-text-primary text-xs">
                    Cuota #{abono.cuotaNumber} · {new Date(abono.approvedAt ?? abono.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-text-muted mt-0.5">
                    {abono.adminBank?.bankName ?? 'Banco no registrado'}
                    {abono.reference ? ` · Ref: ${abono.reference}` : ''}
                  </span>
                </div>
                <span className="text-brand-green-light font-bold">{fmt(abono.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Abonar */}
      {payTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-surface-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard size={20} className="text-brand-green-light" />
                Registrar Abono — Cuota #{payTarget.number}
              </h3>
              <button
                onClick={() => { setPayTarget(null); setPayRegistered(false); setSatCode(''); setPayForm({ amount: '', bankId: '', reference: '', receipt: null }); }}
                className="text-text-secondary hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {payRegistered ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-green/20 flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} className="text-brand-green-light" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Pago Registrado</h4>
                <p className="text-text-primary text-sm mb-1">Tu abono ha sido recibido correctamente.</p>
                <p className="text-text-secondary text-sm">
                  Se verá reflejado en un máximo de <strong className="text-white">24 horas</strong> tras la validación del administrador.
                </p>
                <button
                  onClick={() => { setPayTarget(null); setPayRegistered(false); setSatCode(''); }}
                  className="mt-6 bg-brand-green hover:bg-brand-green-light text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-sm text-text-primary font-medium mb-1">¿A qué banco realizaste el depósito?</label>
                    <select value={payForm.bankId} onChange={e => setPayForm(f => ({ ...f, bankId: e.target.value }))} className={inputCls}>
                      <option value="">— Selecciona un banco —</option>
                      {banks.map(b => <option key={b.id} value={b.id}>{b.bankName} — {b.accountHolder}</option>)}
                    </select>
                  </div>

                  {(() => {
                    const selected = banks.find(b => b.id === payForm.bankId);
                    if (!selected) return null;
                    return (
                      <div className="bg-surface-base/70 border border-surface-border rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 rounded-full bg-brand-green-400 animate-pulse" />
                          <p className="text-sm font-bold text-brand-green-light uppercase tracking-wider">Datos para tu SPEI</p>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between"><span className="text-text-secondary">Banco</span><span className="text-white font-semibold">{selected.bankName}</span></div>
                          <div className="flex justify-between"><span className="text-text-secondary">Titular</span><span className="text-white font-semibold">{selected.accountHolder}</span></div>
                          <div className="flex justify-between items-center border-t border-surface-border pt-3">
                            <span className="text-text-secondary">CLABE</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono font-semibold tracking-wider">{selected.clabe}</span>
                              <button onClick={() => copyText(selected.clabe)} className="text-text-muted hover:text-brand-green-light"><Copy size={14} /></button>
                            </div>
                          </div>
                          <div className="bg-brand-violet/10 border border-brand-violet/30 rounded-lg p-3 mt-1">
                            <p className="text-brand-violet text-xs font-semibold mb-1">Usa este concepto en tu app bancaria:</p>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-brand-violet-200 text-sm font-bold">{satCode}</span>
                              <button onClick={() => copyText(satCode)} className="text-text-muted hover:text-brand-violet"><Copy size={14} /></button>
                            </div>
                          </div>
                          <p className="text-text-muted text-xs">
                            Pendiente: <span className="text-white font-bold">{fmt(Number(payTarget.amountDue) - Number(payTarget.amountPaid))}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-text-primary font-medium mb-1">Cantidad transferida (MXN)</label>
                      <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} placeholder="0.00" min="0.01" step="0.01" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-primary font-medium mb-1">
                        Referencia del SPEI <span className="text-text-muted font-normal">(opcional)</span>
                      </label>
                      <input type="text" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} className={inputCls} placeholder={satCode} />
                    </div>
                    <div>
                      <label className="block text-sm text-text-primary font-medium mb-1">
                        Comprobante <span className="text-red-400">*</span>
                        <span className="text-text-muted font-normal ml-1">Captura, max 5 MB</span>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer border border-dashed rounded-lg px-4 py-3 transition-colors ${payForm.receipt ? 'border-brand-green/50 bg-brand-green/5' : 'border-surface-border hover:border-surface-500 bg-surface-base'}`}>
                        <Paperclip size={16} className={payForm.receipt ? 'text-brand-green-light' : 'text-text-muted'} />
                        <span className={`text-sm truncate ${payForm.receipt ? 'text-brand-green-light' : 'text-text-muted'}`}>
                          {payForm.receipt ? payForm.receipt.name : 'Seleccionar archivo...'}
                        </span>
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setPayForm(f => ({ ...f, receipt: e.target.files?.[0] ?? null }))} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-surface-border flex gap-3 justify-end flex-wrap">
                  <button onClick={() => setPayTarget(null)} className="px-4 py-2 rounded-lg text-text-primary hover:text-white transition-colors">Cancelar</button>
                  <a
                    href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, necesito reportar un pago')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 text-sm font-semibold transition-colors"
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                  <button
                    onClick={() => void handlePay()}
                    disabled={isPaying || !payForm.receipt}
                    className="bg-brand-green hover:bg-brand-green-light text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
