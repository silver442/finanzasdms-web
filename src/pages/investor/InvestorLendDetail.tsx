import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertTriangle, ArrowLeft, CalendarCheck, ChevronDown, History, Home, Loader2, MapPin, TrendingUp, UserRound, Wallet,
} from 'lucide-react';
import { API, FREQUENCY_LABELS, LOAN_STATUS_LABELS, authHeaders, fmt, fmtDate } from '../../components/investor/investorTypes';
import { LEVEL_LABELS, shortId, termLabel, type MarketplaceDetail } from '../../components/investor/walletTypes';
import { ProgressBar, RatingBadge, cardCls, inputCls, labelCls, primaryBtnCls } from '../../components/investor/investorUi';
import { fundAmountError, fundFromWallet } from '../../components/investor/fundFromWallet';
import { useWallet } from '../../hooks/useWallet';

const QUICK_AMOUNTS = [200, 500, 1000] as const;
const QUICK_SHARES = [25, 50, 100] as const;

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={`text-right tabular-nums ${strong ? 'text-brand-green-light font-bold' : 'text-text-primary'}`}>{value}</span>
    </div>
  );
}

function FundPanel({ detail, available, onFunded }: { detail: MarketplaceDetail; available: number; onFunded: () => void }) {
  const { loan, platformFeePercent } = detail;
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOpen = loan.remainingAmount > 0 && ['REQUESTED', 'ESPERANDO_CONFIRMACION', 'PENDIENTE_TRANSFERIR'].includes(loan.status);
  const error = fundAmountError(amount, loan.remainingAmount, available);
  const parsed = Number(amount);
  // Interés neto estimado de tu aportación: tu parte del interés pactado menos la comisión de la plataforma
  const estimatedGain = amount !== '' && !error && loan.amount > 0
    ? parsed * (loan.totalInterest / loan.amount) * (1 - platformFeePercent / 100)
    : null;
  const shareOf = (share: number) => (share === 100 ? loan.remainingAmount : Math.floor(loan.remainingAmount * share) / 100);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || error) return;
    setIsSubmitting(true);
    const ok = await fundFromWallet(loan.id, parsed, loan.purpose);
    setIsSubmitting(false);
    if (ok) { setAmount(''); onFunded(); }
  };

  const quickBtn = (value: number, label: string, sub?: string) => {
    const disabled = isSubmitting || value <= 0 || value > loan.remainingAmount + 0.001 || value > available + 0.001;
    const active = amount !== '' && Number(amount) === value;
    return (
      <button
        key={label} type="button" onClick={() => setAmount(String(value))} disabled={disabled}
        className={`rounded-xl border px-2 py-2 text-sm font-bold transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
          active ? 'bg-brand-green/10 text-brand-green-light border-brand-green/30' : 'bg-surface-elevated/60 text-text-primary border-white/5 hover:border-brand-green/30'
        }`}
      >
        {label}
        {sub && <span className="block text-[11px] font-normal text-text-secondary">{sub}</span>}
      </button>
    );
  };

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 bg-surface-base rounded-xl px-4 py-3">
        <span className="flex items-center gap-2 text-sm text-text-secondary"><Wallet size={16} className="text-brand-green-light" /> Disponible</span>
        <span className="font-extrabold text-brand-green-light tabular-nums">{fmt(available)}</span>
      </div>

      {!isOpen ? (
        <p className="text-sm text-text-muted">Esta solicitud ya no acepta aportaciones.</p>
      ) : (
        <>
          <div>
            <p className={labelCls}>Montos rápidos</p>
            <div className="grid grid-cols-3 gap-2">{QUICK_AMOUNTS.map((v) => quickBtn(v, fmt(v).replace('.00', '')))}</div>
          </div>
          <div>
            <p className={labelCls}>De lo que falta</p>
            <div className="grid grid-cols-3 gap-2">{QUICK_SHARES.map((s) => quickBtn(shareOf(s), `${s}%`, fmt(shareOf(s))))}</div>
          </div>
          <div>
            <label htmlFor="lend-amount" className={labelCls}>Monto a prestar (MXN)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
              <input id="lend-amount" type="number" inputMode="decimal" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputCls} pl-6 ${error ? 'border-red-500/60' : ''}`} />
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            {error === 'Saldo insuficiente' && <Link to="/investor/wallet" className="text-xs font-bold text-brand-green-light">Agregar fondos →</Link>}
            {estimatedGain !== null && (
              <p className="text-xs text-text-muted mt-1">
                Interés neto estimado: <span className="text-brand-green-light font-semibold">{fmt(estimatedGain)}</span> (después de {platformFeePercent}% de comisión)
              </p>
            )}
          </div>
          <button type="submit" disabled={isSubmitting || amount === '' || !!error} className={primaryBtnCls}>
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Prestando...</> : 'Prestar ahora'}
          </button>
        </>
      )}
    </form>
  );
}

// [INVESTOR, ADMIN, SUPER_ADMIN] /investor/lend/:id — detalle de la solicitud y perfil del solicitante
export default function InvestorLendDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [detail, setDetail] = useState<MarketplaceDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const { data } = await axios.get<MarketplaceDetail>(`${API}/loans/marketplace/${id}`, { headers: authHeaders() });
      setDetail(data);
    } catch {
      setNotFound(true);
    }
  }, [id]);

  useEffect(() => { void fetchDetail(); }, [fetchDetail]);

  const back = (
    <button type="button" onClick={() => navigate('/investor/lend')} className="self-start flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">
      <ArrowLeft size={16} /> Regresar
    </button>
  );

  if (notFound) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <div className={`${cardCls} p-10 text-center text-text-secondary`}>Esta solicitud ya no está disponible.</div>
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <div className="flex justify-center py-20 text-text-secondary gap-2"><Loader2 size={18} className="animate-spin" /> Cargando solicitud...</div>
      </div>
    );
  }

  const { loan, borrower } = detail;
  const h = borrower.history;
  const firstPayment = detail.amortization[0]?.amountDue ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {back}

      <div className="flex flex-wrap items-center gap-3">
        <RatingBadge rating={borrower.rating} level={borrower.level} />
        <h1 className="text-2xl md:text-3xl font-extrabold text-white min-w-0 break-words">{loan.purpose}</h1>
        <span className="font-mono text-xs text-text-muted">#{shortId(loan.id)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* ── Izquierda: préstamo y fondeo ── */}
        <section className={`${cardCls} p-5 sm:p-6 flex flex-col gap-5`}>
          <div className="space-y-2">
            <Row label="Nivel" value={<span className="font-semibold">{LEVEL_LABELS[borrower.level] ?? borrower.level}</span>} />
            <Row label="Tasa" value={<>{loan.interestRate}%{loan.rateIsEstimated && <span className="text-text-muted"> (estimada)</span>}</>} />
            <Row label="Monto" value={fmt(loan.amount)} />
            <Row label="Plazo" value={`${termLabel(loan.termQuantity, loan.termUnit)} · ${FREQUENCY_LABELS[loan.paymentFrequency] ?? loan.paymentFrequency}`} />
            <Row label="Pago estimado" value={`${fmt(firstPayment)} c/u (${detail.amortization.length} pagos)`} />
            <Row label="Interés total" value={fmt(loan.totalInterest)} />
            <Row label="Estatus" value={LOAN_STATUS_LABELS[loan.status] ?? loan.status} />
            <Row label="Cierra en" value={`${loan.daysRemaining} días`} />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-text-secondary">{loan.fundedPercentage.toFixed(1)}% fondeado</span>
              <span className="text-brand-green-light font-bold">Falta {fmt(loan.remainingAmount)}</span>
            </div>
            <ProgressBar pct={loan.fundedPercentage} className="h-2" />
            {detail.fundings.length > 0 && (
              <p className="text-xs text-text-muted mt-2">
                {detail.fundings.length} {detail.fundings.length === 1 ? 'inversionista' : 'inversionistas'}:{' '}
                {detail.fundings.map((f) => (f.isMine ? 'tú' : f.investorAlias ? `@${f.investorAlias}` : 'anónimo')).join(', ')}
              </p>
            )}
          </div>
          <div className="border-t border-surface-border pt-5">
            <FundPanel detail={detail} available={wallet?.availableBalance ?? 0} onFunded={() => void fetchDetail()} />
          </div>
        </section>

        {/* ── Derecha: perfil del solicitante ── */}
        <section className="flex flex-col gap-5">
          <div className={`${cardCls} p-5 sm:p-6 flex flex-col gap-4`}>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2"><UserRound size={18} className="text-text-secondary" /> Perfil del solicitante</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-base rounded-xl p-3">
                <p className="text-xs text-text-muted">Puntos en Cashi</p>
                <p className="text-lg font-extrabold text-text-primary tabular-nums">{borrower.points.toLocaleString('es-MX')}</p>
              </div>
              <div className="bg-surface-base rounded-xl p-3">
                <p className="text-xs text-text-muted">Miembro desde</p>
                <p className="text-sm font-bold text-text-primary">{fmtDate(borrower.memberSince)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
              {(borrower.state || borrower.country) && <span className="flex items-center gap-1.5"><MapPin size={14} /> {[borrower.state, borrower.country].filter(Boolean).join(', ')}</span>}
              {borrower.housingStatus && <span className="flex items-center gap-1.5"><Home size={14} /> {borrower.housingStatus}</span>}
            </div>
            <div>
              <p className={labelCls}>Destino del préstamo</p>
              <p className="text-sm text-text-primary whitespace-pre-line">{loan.purpose}</p>
            </div>
          </div>

          <div className={`${cardCls} p-5 sm:p-6 flex flex-col gap-3`}>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2"><History size={18} className="text-text-secondary" /> Historial en Cashi</h2>
            {h.totalLoans === 0 ? (
              <p className="text-sm text-text-muted">Es su primer préstamo en Cashi.</p>
            ) : (
              <div className="space-y-2">
                <Row label="Préstamos recibidos" value={h.totalLoans} />
                <Row label="Liquidados" value={h.paidLoans} />
                <Row label="Activos" value={h.activeLoans} />
                <Row label="Total prestado" value={fmt(h.totalBorrowed)} />
                <Row label="Cuotas pagadas a tiempo" value={h.onTimeRate === null ? '—' : `${h.installmentsPaidOnTime} de ${h.installmentsPaid} (${pct(h.onTimeRate)})`} strong={h.onTimeRate !== null && h.onTimeRate >= 0.9} />
              </div>
            )}
            {(h.hasOverdue || h.defaultedLoans > 0) && (
              <p className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <AlertTriangle size={15} className="shrink-0" />
                {h.defaultedLoans > 0 ? `${h.defaultedLoans} préstamo(s) en incumplimiento` : 'Tiene cuotas vencidas en otro préstamo'}
              </p>
            )}
          </div>

          <div className={`${cardCls} p-5 sm:p-6 flex flex-col gap-3`}>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2"><TrendingUp size={18} className="text-text-secondary" /> Estado financiero</h2>
            {borrower.monthlyIncome === null && borrower.monthlyExpenses === null ? (
              <p className="text-sm text-text-muted">El solicitante no compartió su información financiera.</p>
            ) : (
              <div className="space-y-2">
                <Row label="Ingreso mensual" value={borrower.monthlyIncome !== null ? fmt(borrower.monthlyIncome) : '—'} />
                <Row label="Gasto mensual" value={borrower.monthlyExpenses !== null ? fmt(borrower.monthlyExpenses) : '—'} />
                {borrower.monthlyIncome !== null && borrower.monthlyExpenses !== null && (
                  <Row label="Capacidad libre" value={fmt(borrower.monthlyIncome - borrower.monthlyExpenses)} strong={borrower.monthlyIncome > borrower.monthlyExpenses} />
                )}
                {borrower.expenseToIncomeRatio !== null && <Row label="Gasto / ingreso" value={pct(borrower.expenseToIncomeRatio)} />}
              </div>
            )}
          </div>

          <div className={`${cardCls} overflow-hidden`}>
            <button type="button" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable} className="w-full flex items-center justify-between gap-3 p-5 sm:px-6 text-left">
              <span className="text-base font-bold text-text-primary flex items-center gap-2"><CalendarCheck size={18} className="text-text-secondary" /> Tabla de amortización {loan.rateIsEstimated && <span className="text-xs font-normal text-text-muted">(estimada)</span>}</span>
              <ChevronDown size={18} className={`text-text-secondary transition-transform ${showTable ? 'rotate-180' : ''}`} />
            </button>
            {showTable && (
              <div className="overflow-x-auto border-t border-surface-border">
                <table className="w-full text-sm">
                  <thead className="text-xs text-text-muted uppercase tracking-wider">
                    <tr><th className="text-left px-4 py-2">#</th><th className="text-left px-4 py-2">Fecha</th><th className="text-right px-4 py-2">Pago</th><th className="text-right px-4 py-2">Capital</th><th className="text-right px-4 py-2">Interés</th><th className="text-right px-4 py-2">Saldo</th></tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {detail.amortization.map((r) => (
                      <tr key={r.number} className="border-t border-surface-border/60">
                        <td className="px-4 py-2 text-text-secondary">{r.number}</td>
                        <td className="px-4 py-2 text-text-primary whitespace-nowrap">{fmtDate(r.dueDate)}</td>
                        <td className="px-4 py-2 text-right text-text-primary">{fmt(r.amountDue)}</td>
                        <td className="px-4 py-2 text-right text-text-secondary">{fmt(r.principal)}</td>
                        <td className="px-4 py-2 text-right text-brand-green-light">{fmt(r.interest)}</td>
                        <td className="px-4 py-2 text-right text-text-secondary">{fmt(r.remainingPrincipal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
