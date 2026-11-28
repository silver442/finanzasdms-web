import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { CheckCircle2, HandCoins, Zap } from 'lucide-react';
import FundLoanModal from './FundLoanModal';
import { ROLE_LABELS, investorLabel, summarizeFunding, type LoanFunding } from './fundingTypes';

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

interface LoanFundingProgressProps {
  loanId: string;
  concept: string;
  amount: number;
  fundings?: LoanFunding[];
  /** false en el préstamo propio (conflicto de interés) */
  canFund: boolean;
  isSuperAdmin: boolean;
  onFunded: () => void;
}

// Barra de fondeo colectivo + aportantes + acciones (Aportar / Completar resto)
export default function LoanFundingProgress({
  loanId, concept, amount, fundings = [], canFund, isSuperAdmin, onFunded,
}: LoanFundingProgressProps) {
  const [showModal, setShowModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const progress = summarizeFunding(amount, fundings);
  const barPct = Math.min(progress.fundedPercentage, 100);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await axios.post(`${API}/loans/${loanId}/fund/complete`, {}, { headers: authHeaders() });
      toast.success(`Completaste ${fmt(progress.remainingAmount)}: "${concept}" quedó fondeado al 100%`);
      onFunded();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg ?? 'No se pudo completar el fondeo');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="bg-surface-base/60 border border-white/5 rounded-xl p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2 text-sm">
        <span className="text-text-primary font-semibold">
          {fmt(progress.fundedAmount)} / {fmt(progress.loanAmount)}
        </span>
        <span className={`font-bold ${progress.isFullyFunded ? 'text-brand-green-light' : 'text-text-secondary'}`}>
          {progress.fundedPercentage.toFixed(0)}% fondeado
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-surface-elevated overflow-hidden"
        role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(barPct)}
        aria-label={`Fondeo de ${concept}`}
      >
        <div className="h-full bg-brand-green rounded-full transition-all" style={{ width: `${barPct}%` }} />
      </div>

      {fundings.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-xs">
          {fundings.map((f) => (
            <li key={f.id} className="flex justify-between gap-3">
              <span className="text-text-secondary truncate">
                {investorLabel(f.investor)}
                <span className="text-text-muted"> · {ROLE_LABELS[f.investor.role] ?? f.investor.role}</span>
              </span>
              <span className="text-text-primary whitespace-nowrap">
                {fmt(Number(f.amount))} <span className="text-text-muted">({Number(f.percentage).toFixed(1)}%)</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-text-muted">Aún nadie ha aportado.</p>
      )}

      {progress.isFullyFunded ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-brand-green-light font-semibold">
          <CheckCircle2 size={14} /> Fondeado al 100%: listo para desembolsar
        </p>
      ) : canFund && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <button
            type="button" onClick={() => setShowModal(true)} disabled={isCompleting}
            className="sm:flex-1 inline-flex items-center justify-center gap-2 bg-brand-green/10 text-brand-green-light border border-brand-green/20 hover:bg-brand-green hover:text-white rounded-xl px-3 py-2 text-sm font-bold transition-all disabled:opacity-50"
          >
            <HandCoins size={16} /> Aportar
          </button>
          {isSuperAdmin && (
            <button
              type="button" onClick={() => void handleComplete()} disabled={isCompleting}
              className="sm:flex-1 inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-light text-white rounded-xl px-3 py-2 text-sm font-bold transition-all shadow-lg shadow-brand-green/20 disabled:opacity-50"
            >
              <Zap size={16} /> {isCompleting ? 'Completando...' : `Completar resto (${fmt(progress.remainingAmount)})`}
            </button>
          )}
        </div>
      )}

      {showModal && (
        <FundLoanModal
          loanId={loanId} concept={concept} progress={progress}
          onClose={() => setShowModal(false)} onFunded={onFunded} showDestination={!isSuperAdmin}
        />
      )}
    </div>
  );
}
