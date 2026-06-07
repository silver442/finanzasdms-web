/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
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

const API = import.meta.env.VITE_API_URL;
function authHeaders() { return { Authorization: `Bearer ${localStorage.getItem('token')}` }; }

const fmt = (v: string | number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

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

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-sky-400 flex items-center gap-3">
          <Briefcase size={32} />
          Cartera Activa
        </h1>
        <p className="text-text-secondary mt-2">
          {!isLoading && `${loans.length} préstamo${loans.length !== 1 ? 's' : ''} activo${loans.length !== 1 ? 's' : ''} · `}
          Haz clic en cualquier tarjeta para ver el detalle y gestionar cuotas.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {loans.map(loan => {
            const totalDue  = loan.installments.reduce((a, i) => a + Number(i.amountDue), 0);
            const paid      = loan.installments.reduce((a, i) => a + Number(i.amountPaid), 0);
            const pending   = Math.max(0, totalDue - paid);
            const pct       = totalDue > 0 ? Math.min((paid / totalDue) * 100, 100) : 0;
            const paidCount = loan.installments.filter(i => i.status === 'PAID').length;
            const progressColor = pct >= 75 ? 'bg-brand-green' : pct >= 40 ? 'bg-brand-violet-400' : 'bg-sky-500';

            const nextInst = loan.installments
              .filter(i => i.status !== 'PAID')
              .sort((a, b) => Number(a.number) - Number(b.number))[0];

            return (
              <button
                key={loan.id}
                onClick={() => navigate(`/admin/loans/${loan.id}`)}
                className="bg-surface-card border border-surface-border rounded-2xl shadow-xl overflow-hidden flex flex-col text-left w-full hover:bg-surface-elevated/60 hover:border-sky-500/40 transition-all group"
              >
                {/* Header */}
                <div className="p-5 border-b border-surface-border flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white truncate">{loan.concept}</h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {fmt(loan.amount)} · {loan.termQuantity} {loan.termUnit === 'SEMANAS' ? 'sem' : 'meses'} · {Number(loan.interestRate).toFixed(0)}%
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">Inicio: {fmtDate(loan.startDate)}</p>
                  </div>
                  <span className="bg-sky-500/20 text-sky-400 text-xs px-2 py-1 rounded border border-sky-500/30 font-semibold whitespace-nowrap shrink-0">Activo</span>
                </div>

                {/* Cliente */}
                <div className="px-5 py-3 flex items-center gap-2 border-b border-surface-border/50">
                  <div className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                    <User size={13} className="text-text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">{loan.user.name ?? '—'}</p>
                    <p className="text-text-secondary text-xs truncate">{loan.user.email}</p>
                  </div>
                  {loan.user.phone && (
                    <div className="flex items-center gap-1 text-text-secondary text-xs shrink-0">
                      <Phone size={11} /> {loan.user.phone}
                    </div>
                  )}
                </div>

                {/* Métricas */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-0.5">Pendiente</p>
                      <p className="text-lg font-extrabold text-brand-violet">{fmt(pending)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-0.5">Pagado</p>
                      <p className="text-lg font-extrabold text-brand-green-light">{fmt(paid)}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>{paidCount} de {loan.installments.length} cuotas</span>
                      <span className="font-semibold text-white">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {nextInst && (
                    <div className="bg-surface-base/50 rounded-lg px-3 py-2 text-xs">
                      <span className="text-text-muted">Próximo venc.: </span>
                      <span className="text-white font-semibold">{fmtDate(nextInst.dueDate)}</span>
                      <span className="text-text-secondary"> · </span>
                      <span className="text-brand-violet font-semibold">{fmt(Number(nextInst.amountDue) - Number(nextInst.amountPaid))}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between text-xs text-text-muted">
                  <span>Ver cuotas y ajustar</span>
                  <ChevronRight size={16} className="text-text-muted group-hover:text-sky-400 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
