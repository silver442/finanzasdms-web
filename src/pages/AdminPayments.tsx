/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ClipboardCheck, CheckCircle2, XCircle, Clock, Landmark, User, Eye, X, FileImage } from 'lucide-react';

interface PaymentRequestUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
}

interface PaymentLoan {
  id: string;
  concept: string;
}

interface PaymentInstallment {
  id: string;
  number: number;
  loan: PaymentLoan;
}

interface PaymentBank {
  bankName: string;
  clabe: string;
  accountHolder: string;
}

interface PaymentRequest {
  id: string;
  amount: string | number;
  reference?: string;
  receiptUrl?: string;
  createdAt: string;
  user: PaymentRequestUser;
  installment: PaymentInstallment;
  adminBank?: PaymentBank;
}

const API = 'http://localhost:3000';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function fmt(v: string | number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminPayments() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const { data } = await axios.get<PaymentRequest[]>(`${API}/payment-requests`, { headers: authHeaders() });
      setRequests(data);
    } catch {
      toast.error('No se pudieron cargar los abonos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await axios.patch(`${API}/payment-requests/${id}/approve`, {}, { headers: authHeaders() });
      toast.success('Pago aprobado y aplicado');
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al aprobar');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string, userName: string) => {
    setProcessing(id);
    try {
      await axios.patch(`${API}/payment-requests/${id}/reject`, {}, { headers: authHeaders() });
      toast.success(`Abono de ${userName} rechazado`);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al rechazar');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-8 text-white font-sans max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-sky-400 flex items-center gap-3">
          <ClipboardCheck size={32} />
          Validar Pagos
        </h1>
        <p className="text-slate-400 mt-2">
          Abonos reportados por los usuarios — verifica en tu banca antes de aprobar
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-400">Cargando abonos...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <CheckCircle2 size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay abonos pendientes de validación.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const isProcessing = processing === req.id;
            const userName = req.user.name ?? req.user.email;
            return (
              <div key={req.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">

                {/* Info */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* Cliente */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={15} className="text-slate-300" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Cliente</p>
                      <p className="text-white font-semibold text-sm">{userName}</p>
                      {req.user.phone && <p className="text-slate-400 text-xs">{req.user.phone}</p>}
                    </div>
                  </div>

                  {/* Préstamo */}
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-0.5">Préstamo · Cuota</p>
                    <p className="text-white text-sm font-medium">{req.installment.loan.concept}</p>
                    <p className="text-slate-400 text-xs">Cuota #{req.installment.number}</p>
                  </div>

                  {/* Monto y banco */}
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-0.5">Abono</p>
                    <p className="text-emerald-400 font-bold text-lg">{fmt(req.amount)}</p>
                    {req.adminBank && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Landmark size={10} />
                        {req.adminBank.bankName} · {req.adminBank.clabe.slice(-4).padStart(req.adminBank.clabe.length, '·')}
                      </div>
                    )}
                    {req.reference && (
                      <p className="text-xs text-amber-400 font-mono mt-0.5">Ref: {req.reference}</p>
                    )}
                  </div>
                </div>

                {/* Fecha + acciones */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={11} />
                    {fmtDate(req.createdAt)}
                  </div>
                  <div className="flex gap-2">
                    {req.receiptUrl && (
                      <button
                        onClick={() => setReceiptPreview(req.receiptUrl!)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-sm font-semibold transition-all"
                        title="Ver comprobante"
                      >
                        <Eye size={15} />
                        Comprobante
                      </button>
                    )}
                    <button
                      onClick={() => void handleReject(req.id, userName)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-semibold transition-all disabled:opacity-40"
                    >
                      <XCircle size={15} />
                      Rechazar
                    </button>
                    <button
                      onClick={() => void handleApprove(req.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40"
                    >
                      <CheckCircle2 size={15} />
                      {isProcessing ? 'Procesando...' : 'Aprobar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Ver Comprobante ── */}
      {receiptPreview && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setReceiptPreview(null)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <FileImage size={18} className="text-sky-400" />
                <h3 className="text-sm font-bold text-white">Comprobante de Pago</h3>
              </div>
              <button
                onClick={() => setReceiptPreview(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-auto flex-1 p-4 flex items-center justify-center">
              {receiptPreview.startsWith('data:image') ? (
                <img
                  src={receiptPreview}
                  alt="Comprobante"
                  className="max-w-full max-h-[70vh] rounded-lg object-contain"
                />
              ) : receiptPreview.startsWith('data:application/pdf') ? (
                <iframe
                  src={receiptPreview}
                  title="Comprobante PDF"
                  className="w-full h-[70vh] rounded-lg"
                />
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <FileImage size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No se puede previsualizar este archivo.</p>
                  <a
                    href={receiptPreview}
                    download="comprobante"
                    className="mt-3 inline-block text-sky-400 hover:text-sky-300 underline text-sm"
                  >
                    Descargar archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
