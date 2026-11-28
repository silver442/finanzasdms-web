import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Briefcase, Coins, HandCoins, TrendingUp } from 'lucide-react';
import { API, LOAN_STATUS_LABELS, authHeaders, fmt, fmtDate } from '../../components/investor/investorTypes';
import { shortId, type InvestorLoan } from '../../components/investor/walletTypes';
import { LoadingRows, ProgressBar, RatingBadge, StatCard, cardCls } from '../../components/investor/investorUi';

const STATUS_CLS: Record<string, string> = {
  ACTIVE: 'bg-brand-green/15 text-brand-green-light border-brand-green/25',
  PAID: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
  DEFAULTED: 'bg-red-500/15 text-red-400 border-red-500/25',
  REJECTED: 'bg-surface-elevated text-text-muted border-surface-border',
  CANCELADO: 'bg-surface-elevated text-text-muted border-surface-border',
  CANCELADO_POR_ADMIN: 'bg-surface-elevated text-text-muted border-surface-border',
};
const FUNDING_STATUS_CLS = 'bg-amber-500/15 text-amber-400 border-amber-500/25';

function StatusBadge({ loan }: { loan: InvestorLoan }) {
  const label = loan.refundedAt ? 'Reembolsado' : LOAN_STATUS_LABELS[loan.status] ?? loan.status;
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_CLS[loan.status] ?? FUNDING_STATUS_CLS}`}>
      {label}
    </span>
  );
}

// Capital recuperado vs. lo aportado (los reembolsados cuentan como recuperados por completo)
const recoveredPct = (l: InvestorLoan) =>
  l.refundedAt ? 100 : l.contributedAmount > 0 ? (l.capitalRecovered / l.contributedAmount) * 100 : 0;

// [INVESTOR, ADMIN, SUPER_ADMIN] /investor/loans — préstamos donde aporté
export default function InvestorMyLoans() {
  const [loans, setLoans] = useState<InvestorLoan[] | null>(null);

  useEffect(() => {
    axios.get<InvestorLoan[]>(`${API}/investor/my-loans`, { headers: authHeaders() })
      .then(({ data }) => setLoans(data))
      .catch(() => { toast.error('No se pudieron cargar tus préstamos'); setLoans([]); });
  }, []);

  const active = (loans ?? []).filter((l) => !l.refundedAt);
  const sum = (k: 'contributedAmount' | 'capitalRecovered' | 'outstandingCapital' | 'interestEarned') =>
    active.reduce((s, l) => s + l[k], 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Mis préstamos</h1>
        <p className="text-text-secondary mt-1 text-sm md:text-base">Cada préstamo que fondeaste: lo que aportaste, lo que ya recuperaste y lo que falta.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HandCoins} label="Aportado" value={fmt(sum('contributedAmount'))} />
        <StatCard icon={Coins} label="Capital recuperado" value={fmt(sum('capitalRecovered'))} />
        <StatCard icon={Briefcase} label="Capital pendiente" value={fmt(sum('outstandingCapital'))} />
        <StatCard icon={TrendingUp} accent label="Interés ganado" value={fmt(sum('interestEarned'))} hint="Neto de comisión" />
      </div>

      {loans === null ? (
        <LoadingRows />
      ) : loans.length === 0 ? (
        <div className={`${cardCls} p-10 text-center`}>
          <p className="text-text-primary font-semibold">Aún no has fondeado ningún préstamo</p>
          <Link to="/investor/lend" className="inline-block mt-3 text-sm font-bold text-brand-green-light hover:text-brand-green">Ir a prestar →</Link>
        </div>
      ) : (
        <div className={`${cardCls} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-4xl">
              <thead className="text-xs text-text-muted uppercase tracking-wider bg-surface-elevated/40">
                <tr>
                  <th className="text-left px-4 py-3">Préstamo</th>
                  <th className="text-right px-4 py-3">Aportado</th>
                  <th className="text-right px-4 py-3">%</th>
                  <th className="text-left px-4 py-3">Estatus</th>
                  <th className="text-left px-4 py-3 w-48">Recuperado vs. pendiente</th>
                  <th className="text-right px-4 py-3">Interés ganado</th>
                  <th className="text-left px-4 py-3">Próximo pago</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {loans.map((l) => (
                  <tr key={l.fundingId} className="border-t border-surface-border/60 hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <RatingBadge rating={l.rating} level={l.level} size="sm" />
                        <div className="min-w-0">
                          <p className="text-text-primary font-semibold truncate max-w-48" title={l.purpose}>{l.purpose}</p>
                          <p className="text-xs text-text-muted font-mono">#{shortId(l.loanId)} · {l.interestRate}%</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-text-primary">{fmt(l.contributedAmount)}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{l.percentage.toFixed(2)}%</td>
                    <td className="px-4 py-3"><StatusBadge loan={l} /></td>
                    <td className="px-4 py-3">
                      <ProgressBar pct={recoveredPct(l)} />
                      <p className="text-xs text-text-secondary mt-1">
                        <span className="text-brand-green-light">{fmt(l.refundedAt ? l.contributedAmount : l.capitalRecovered)}</span>
                        {' / '}{fmt(l.outstandingCapital)} pend.
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-brand-green-light font-semibold">{fmt(l.interestEarned)}</p>
                      {!l.refundedAt && <p className="text-xs text-text-muted">de {fmt(l.expectedNetInterest)} esperado</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {l.nextPayment ? (
                        <>
                          <p className="text-text-primary">{fmtDate(l.nextPayment.dueDate)}</p>
                          <p className="text-xs text-text-muted">{fmt(l.nextPayment.principal + l.nextPayment.netInterest)}</p>
                        </>
                      ) : <span className="text-text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
