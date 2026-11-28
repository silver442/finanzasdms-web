import { useNavigate } from 'react-router-dom';
import { Clock, HandCoins, Lock, XCircle } from 'lucide-react';
import { fmtDate, type MyInvestorStatus } from './investorTypes';

interface InvestorApplicationCardProps {
  status: MyInvestorStatus;
}

// [USER] Tarjeta "Quiero ser inversionista" en Inversiones: invita, muestra la solicitud en revisión o el rechazo
export default function InvestorApplicationCard({ status }: InvestorApplicationCardProps) {
  const navigate = useNavigate();
  const app = status.application;
  const isPending = app?.status === 'PENDING';
  const isRejected = app?.status === 'REJECTED';

  // Sin registro abierto y sin solicitud que mostrar: no se ofrece nada
  if (!isPending && !isRejected && !status.acceptingInvestors) return null;

  return (
    <section className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-3 self-start shrink-0">
          <HandCoins size={24} className="text-brand-green-light" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-text-primary text-lg">Invierte en préstamos de la comunidad</h2>
          {isPending ? (
            <p className="text-text-secondary text-sm flex items-center gap-1.5 mt-1">
              <Clock size={14} className="text-amber-400 shrink-0" />
              Tu solicitud como <strong className="text-text-primary">@{app.investorAlias}</strong> está en revisión desde el {fmtDate(app.createdAt)}.
            </p>
          ) : (
            <p className="text-text-secondary text-sm mt-1">
              Fondea préstamos de otros usuarios y recibe capital más intereses en cada pago que hagan.
            </p>
          )}
          {isRejected && (
            <p className="text-sm flex items-start gap-1.5 mt-2 text-red-400">
              <XCircle size={14} className="shrink-0 mt-0.5" />
              <span>Tu solicitud anterior no fue aprobada{app.rejectionReason ? `: ${app.rejectionReason}` : '.'}</span>
            </p>
          )}
          {!isPending && !status.canApply && (
            <p className="text-text-muted text-xs flex items-center gap-1.5 mt-2">
              <Lock size={12} />
              {!status.acceptingInvestors ? 'Por ahora no estamos recibiendo solicitudes.' : 'El cupo de inversionistas está lleno por ahora.'}
            </p>
          )}
        </div>
        {!isPending && status.canApply && (
          <button
            onClick={() => navigate('/investments/apply')}
            className="bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-brand-green/20 w-full sm:w-auto"
          >
            {isRejected ? 'Volver a solicitar' : 'Quiero ser inversionista'}
          </button>
        )}
      </div>
    </section>
  );
}
