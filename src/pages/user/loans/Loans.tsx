/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Landmark, Plus, Calculator, Ban, AlertCircle, Trophy, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, XCircle, Banknote,
} from 'lucide-react';

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
  termQuantity: number;
  termUnit: string;
  startDate: string;
  updatedAt: string;
  status: 'REQUESTED' | 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'REJECTED' | 'CANCELADO' | 'ESPERANDO_CONFIRMACION' | 'PENDIENTE_TRANSFERIR';
  installments: Installment[];
}

const API = import.meta.env.VITE_API_URL;
function authHeaders() { return { Authorization: `Bearer ${localStorage.getItem('token')}` }; }

const LEVEL_LABELS: Record<string, string> = {
  NOVATO_1: 'Novato I', NOVATO_2: 'Novato II', NOVATO_3: 'Novato III',
  CUMPLIDOR_1: 'Cumplidor I', CUMPLIDOR_2: 'Cumplidor II', CUMPLIDOR_3: 'Cumplidor III',
  SOCIO_1: 'Socio I', SOCIO_2: 'Socio II', ELITE: 'Élite',
};

function getLevelStyle(level: string): string {
  if (level.startsWith('NOVATO'))    return 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20';
  if (level.startsWith('CUMPLIDOR')) return 'bg-brand-green/10 border-brand-green/30 text-brand-green-light hover:bg-brand-green/20';
  if (level.startsWith('SOCIO'))     return 'bg-brand-violet/10 border-brand-violet/30 text-brand-violet hover:bg-brand-violet/20';
  if (level === 'ELITE')             return 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20';
  return 'bg-surface-elevated/50 border-surface-border text-text-primary hover:bg-surface-elevated';
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
  } catch { return { level: 'NOVATO_1', points: 0 }; }
}

const STATUS_CONFIG: Record<Loan['status'], { label: string; border: string; badge: string }> = {
  ACTIVE:                 { label: 'Activo',                   border: 'border-sky-500/30',    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  PAID:                   { label: 'Liquidado',                border: 'border-brand-green/30', badge: 'bg-brand-green/20 text-brand-green-light border-brand-green/30' },
  REQUESTED:              { label: 'En revisión',              border: 'border-brand-violet/30',  badge: 'bg-brand-violet/20 text-brand-violet border-brand-violet/30' },
  ESPERANDO_CONFIRMACION: { label: '⚠️ Confirmar condiciones', border: 'border-brand-violet/40',  badge: 'bg-brand-violet/20 text-brand-violet border-brand-violet/30' },
  PENDIENTE_TRANSFERIR:   { label: 'Pendiente de transferencia', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  REJECTED:               { label: 'Rechazado',                border: 'border-red-500/30',    badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  CANCELADO:              { label: 'Cancelado',                border: 'border-surface-border',     badge: 'bg-surface-elevated/50 text-text-secondary border-surface-border' },
  DEFAULTED:              { label: 'En mora',                  border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

const STATUS_ICON: Record<Loan['status'], React.ReactElement> = {
  ACTIVE:                 <Clock size={15} className="text-sky-400" />,
  PAID:                   <CheckCircle2 size={15} className="text-brand-green-light" />,
  REQUESTED:              <AlertTriangle size={15} className="text-brand-violet" />,
  ESPERANDO_CONFIRMACION: <AlertTriangle size={15} className="text-brand-violet" />,
  PENDIENTE_TRANSFERIR:   <Banknote size={15} className="text-violet-400" />,
  REJECTED:               <XCircle size={15} className="text-red-400" />,
  CANCELADO:              <XCircle size={15} className="text-text-secondary" />,
  DEFAULTED:              <AlertCircle size={15} className="text-orange-400" />,
};

const formatCurrency = (v: string | number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

export default function Loans() {
  const navigate = useNavigate();
  const { level, points } = useMemo(() => getUserProfile(), []);

  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [slotsAvailable, setSlotsAvailable] = useState(true);

  const personalLimit = level.startsWith('NOVATO') ? 1 : 3;

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

  const fetchCapacity = useCallback(async () => {
    try {
      const { data } = await axios.get<{ available: boolean }>(`${API}/loans/capacity`, { headers: authHeaders() });
      setSlotsAvailable(data.available);
    } catch { /* no crítico */ }
  }, []);

  useEffect(() => { void fetchLoans(); void fetchCapacity(); }, [fetchLoans, fetchCapacity]);

  const personalLimitReached = useMemo(
    () => loans.filter(l => l.status === 'ACTIVE' || l.status === 'REQUESTED').length >= personalLimit,
    [loans, personalLimit],
  );

  const visibleLoans = useMemo(() =>
    loans.filter(loan => {
      if (loan.status !== 'REJECTED' && loan.status !== 'CANCELADO') return true;
      return Date.now() - new Date(loan.updatedAt).getTime() < 24 * 60 * 60 * 1000;
    }),
    [loans],
  );

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-green-light flex items-center gap-3">
            <Landmark size={32} />
            Préstamos y Pagos Fijos
          </h1>
          <p className="text-text-secondary mt-2">Control de amortizaciones y compras a plazos</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap w-full md:w-auto md:ml-auto">
          <button
            onClick={() => navigate('/profile')}
            className={`flex items-center gap-2 border px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${getLevelStyle(level)}`}
          >
            <Trophy size={15} />
            <span>{LEVEL_LABELS[level] ?? level}</span>
            <span className="w-px h-3.5 bg-current opacity-30" />
            <span className="text-white font-bold tabular-nums">{points}</span>
            <span className="opacity-50 font-normal">pts</span>
          </button>
          <button
            onClick={() => navigate('/loans/simulator')}
            className="bg-surface-elevated hover:bg-surface-elevated text-text-200 px-5 py-2.5 rounded-xl font-bold transition-all border border-surface-border flex items-center gap-2"
          >
            <Calculator size={18} />
            Simulador
          </button>
          <button
            onClick={() => navigate('/loans/request')}
            disabled={!slotsAvailable || personalLimitReached}
            className="bg-brand-green hover:bg-brand-green-light text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-surface-elevated"
          >
            <Plus size={20} />
            Solicitar Préstamo
          </button>
        </div>
      </div>

      {/* Banners */}
      {!slotsAvailable && (
        <div className="mb-4 flex items-center gap-3 bg-brand-violet/10 border border-brand-violet/30 rounded-xl px-5 py-4">
          <Ban size={20} className="text-brand-violet shrink-0" />
          <div>
            <p className="text-brand-violet font-bold text-sm">Cupos de crédito agotados por este mes</p>
            <p className="text-brand-violet/70 text-xs mt-0.5">Se han alcanzado los 20 créditos activos simultáneos.</p>
          </div>
        </div>
      )}
      {personalLimitReached && (
        <div className="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4">
          <AlertCircle size={20} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm font-medium">Liquida tu préstamo actual antes de solicitar uno nuevo.</p>
        </div>
      )}

      {/* Grid de tarjetas */}
      {isLoading ? (
        <div className="flex justify-center py-20 text-text-secondary">Cargando préstamos...</div>
      ) : visibleLoans.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Landmark size={48} className="mx-auto mb-4 opacity-30" />
          <p>No tienes préstamos registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibleLoans.map(loan => {
            const cfg = STATUS_CONFIG[loan.status] ?? STATUS_CONFIG.ACTIVE;
            const icon = STATUS_ICON[loan.status];

            const totalPaid = loan.installments.reduce((a, i) => a + Number(i.amountPaid), 0);
            const totalDue  = loan.installments.reduce((a, i) => a + Number(i.amountDue), 0);
            const progress  = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
            const debtActual = Math.max(0, totalDue - totalPaid);

            const nextInstallment = loan.installments
              .filter(i => i.status !== 'PAID')
              .sort((a, b) => Number(a.number) - Number(b.number))[0];

            const progressColor =
              progress >= 75 ? 'bg-brand-green' :
              progress >= 40 ? 'bg-brand-violet' : 'bg-sky-500';

            return (
              <button
                key={loan.id}
                onClick={() => navigate(`/loans/${loan.id}`)}
                className={`bg-surface-card border ${cfg.border} rounded-2xl shadow-xl overflow-hidden flex flex-col text-left w-full hover:bg-surface-elevated/60 transition-all group`}
              >
                {/* Card header */}
                <div className="p-5 border-b border-surface-border flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white truncate">{loan.concept}</h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {formatCurrency(loan.amount)} · {loan.termQuantity} {loan.termUnit === 'SEMANAS' ? 'sem' : 'meses'} · {Number(loan.interestRate)}% anual
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded border font-semibold whitespace-nowrap shrink-0 ${cfg.badge}`}>
                    {icon}
                    {cfg.label}
                  </span>
                </div>

                {/* Métricas */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-0.5">Deuda actual</p>
                      <p className={`text-lg font-extrabold ${loan.status === 'PAID' ? 'text-text-muted' : 'text-red-400'}`}>
                        {formatCurrency(debtActual)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-0.5">Pagado</p>
                      <p className="text-lg font-extrabold text-brand-green-light">{formatCurrency(totalPaid)}</p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  {totalDue > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-text-muted mb-1">
                        <span>Progreso</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${progressColor}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Próximo vencimiento */}
                  {nextInstallment && loan.status === 'ACTIVE' && (
                    <div className="bg-surface-base/50 rounded-lg px-3 py-2 text-xs">
                      <span className="text-text-muted">Próximo vencimiento: </span>
                      <span className="text-white font-semibold">{formatDate(nextInstallment.dueDate)}</span>
                      <span className="text-text-secondary"> · </span>
                      <span className="text-brand-violet font-semibold">{formatCurrency(Number(nextInstallment.amountDue) - Number(nextInstallment.amountPaid))}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between text-xs text-text-muted">
                  <span>Inicio: {formatDate(loan.startDate)}</span>
                  <ChevronRight size={16} className="text-text-muted group-hover:text-brand-green-light transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
