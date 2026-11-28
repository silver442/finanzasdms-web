import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Coins, HandCoins, Landmark, PiggyBank, Wallet, X } from 'lucide-react';
import { ROLE_LABELS } from '../../components/loan-funding/fundingTypes';

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

type PayoutStatus = 'PENDING' | 'PAID';
type StatusFilter = PayoutStatus | 'ALL';

interface InvestorBank {
  id: string;
  bankName: string;
  clabe: string;
  accountHolder: string;
}

interface InvestorPayout {
  id: string;
  loanId: string;
  investorId: string;
  principalAmount: number;
  interestAmount: number;
  platformFeeAmount: number;
  totalAmount: number;
  status: PayoutStatus;
  paidAt: string | null;
  createdAt: string;
  investor: { id: string; email: string; name: string | null; role: string; investorAlias: string | null };
  loan: { id: string; concept: string; amount: string | number };
  investorBanks: InvestorBank[];
}

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'PAID', label: 'Pagados' },
  { value: 'ALL', label: 'Todos' },
];

const selectCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors';
const labelCls = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1';

const sum = (rows: InvestorPayout[], key: 'totalAmount' | 'platformFeeAmount') =>
  rows.reduce((s, p) => s + p[key], 0);

// [SUPER_ADMIN] Reparto de pagos de clientes a los fondeadores (GET /payouts, PATCH /payouts/:id/mark-paid)
export default function AdminInvestorPayouts() {
  const [payouts, setPayouts] = useState<InvestorPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('PENDING');
  const [investorId, setInvestorId] = useState('');
  const [loanId, setLoanId] = useState('');
  const [markTarget, setMarkTarget] = useState<InvestorPayout | null>(null);
  const [isMarking, setIsMarking] = useState(false);

  const fetchPayouts = useCallback(async () => {
    try {
      const { data } = await axios.get<InvestorPayout[]>(`${API}/payouts`, { headers: authHeaders() });
      setPayouts(data);
    } catch {
      toast.error('No se pudieron cargar los pagos a inversionistas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchPayouts(); }, [fetchPayouts]);

  // Opciones de filtro a partir de los datos cargados
  const investors = useMemo(() => {
    const map = new Map<string, InvestorPayout['investor']>();
    payouts.forEach((p) => map.set(p.investorId, p.investor));
    return [...map.values()];
  }, [payouts]);
  const loans = useMemo(() => {
    const map = new Map<string, InvestorPayout['loan']>();
    payouts.forEach((p) => map.set(p.loanId, p.loan));
    return [...map.values()];
  }, [payouts]);

  const totals = useMemo(() => {
    const pending = payouts.filter((p) => p.status === 'PENDING');
    return {
      fees: sum(payouts, 'platformFeeAmount'),
      pending: sum(pending, 'totalAmount'),
      pendingCount: pending.length,
      paid: sum(payouts.filter((p) => p.status === 'PAID'), 'totalAmount'),
    };
  }, [payouts]);

  // Agrupado por inversionista para pagar con una sola transferencia por persona
  const groups = useMemo(() => {
    const filtered = payouts.filter((p) =>
      (status === 'ALL' || p.status === status)
      && (!investorId || p.investorId === investorId)
      && (!loanId || p.loanId === loanId),
    );
    const map = new Map<string, InvestorPayout[]>();
    filtered.forEach((p) => map.set(p.investorId, [...(map.get(p.investorId) ?? []), p]));
    return [...map.values()];
  }, [payouts, status, investorId, loanId]);

  const handleMarkPaid = async () => {
    if (!markTarget) return;
    setIsMarking(true);
    try {
      const { data } = await axios.patch<Pick<InvestorPayout, 'id' | 'status' | 'paidAt'>>(
        `${API}/payouts/${markTarget.id}/mark-paid`, {}, { headers: authHeaders() },
      );
      setPayouts((prev) => prev.map((p) => (p.id === data.id ? { ...p, status: data.status, paidAt: data.paidAt } : p)));
      toast.success(`Pago de ${fmt(markTarget.totalAmount)} marcado como pagado`);
      setMarkTarget(null);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg ?? 'No se pudo marcar el pago');
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 text-white font-sans max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary flex items-center gap-3">
          <HandCoins size={30} className="text-brand-green-light" />
          Reparto a Inversionistas
        </h1>
        <p className="text-text-secondary mt-2">
          Cada pago de un cliente genera la parte de cada fondeador: capital + interés neto, menos la comisión de la plataforma.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard icon={<PiggyBank size={20} className="text-brand-green-light" />} label="Comisiones ganadas (acumulado)" value={fmt(totals.fees)} highlight />
        <SummaryCard icon={<Wallet size={20} className="text-amber-400" />} label={`Por pagar (${totals.pendingCount})`} value={fmt(totals.pending)} />
        <SummaryCard icon={<CheckCircle2 size={20} className="text-text-secondary" />} label="Ya pagado a fondeadores" value={fmt(totals.paid)} />
      </div>

      {/* Filtros */}
      <div className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card p-4 mb-6 flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex gap-1 bg-surface-base rounded-xl p-1 self-start" role="tablist">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value} role="tab" aria-selected={status === t.value} onClick={() => setStatus(t.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                status === t.value ? 'bg-brand-green/10 text-brand-green-light' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <label htmlFor="payout-investor" className={labelCls}>Inversionista</label>
          <select id="payout-investor" value={investorId} onChange={(e) => setInvestorId(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {investors.map((i) => <option key={i.id} value={i.id}>{i.name ?? i.email}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="payout-loan" className={labelCls}>Préstamo</label>
          <select id="payout-loan" value={loanId} onChange={(e) => setLoanId(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {loans.map((l) => <option key={l.id} value={l.id}>{l.concept} · {fmt(Number(l.amount))}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-text-secondary">Cargando pagos...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Coins size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay pagos con estos filtros.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((rows) => {
            const { investor, investorBanks } = rows[0];
            const pendingRows = rows.filter((r) => r.status === 'PENDING');
            return (
              <section key={investor.id} className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card overflow-hidden">
                <header className="p-4 sm:p-5 border-b border-surface-border bg-surface-base/40 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-bold text-text-primary truncate">
                      {investor.name ?? investor.email}
                      <span className="ml-2 text-xs font-semibold text-text-muted">{ROLE_LABELS[investor.role] ?? investor.role}</span>
                    </h2>
                    <p className="text-text-secondary text-sm truncate">
                      {investor.investorAlias && <span className="text-brand-green-light">@{investor.investorAlias} · </span>}
                      {investor.email}
                    </p>
                    {pendingRows.length > 0 && (
                      <p className="text-sm mt-1">
                        <span className="text-text-secondary">Por pagar: </span>
                        <span className="text-brand-green-light font-bold">{fmt(sum(pendingRows, 'totalAmount'))}</span>
                      </p>
                    )}
                  </div>
                  {investorBanks.length > 0 ? (
                    <div className="space-y-1.5">
                      {investorBanks.map((b) => (
                        <div key={b.id} className="flex items-start gap-2 bg-surface-base rounded-lg px-3 py-2 text-sm">
                          <Landmark size={15} className="text-text-secondary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-text-primary font-semibold">{b.bankName} · {b.accountHolder}</p>
                            <p className="font-mono text-text-secondary tracking-wider break-all">{b.clabe}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      <AlertTriangle size={14} className="shrink-0" /> Sin cuenta para recibir rendimientos
                    </p>
                  )}
                </header>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-text-muted uppercase tracking-wider">
                        <th className="px-4 py-3 font-semibold">Préstamo</th>
                        <th className="px-4 py-3 font-semibold text-right">Capital</th>
                        <th className="px-4 py-3 font-semibold text-right">Interés neto</th>
                        <th className="px-4 py-3 font-semibold text-right">Comisión</th>
                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                        <th className="px-4 py-3 font-semibold text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr key={p.id} className="border-t border-surface-border">
                          <td className="px-4 py-3">
                            <p className="text-text-primary font-medium whitespace-nowrap">{p.loan.concept}</p>
                            <p className="text-text-muted text-xs">{fmtDate(p.createdAt)}</p>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap text-text-primary">{fmt(p.principalAmount)}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap text-text-primary">{fmt(p.interestAmount)}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap text-text-secondary">{fmt(p.platformFeeAmount)}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap text-brand-green-light font-bold">{fmt(p.totalAmount)}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {p.status === 'PAID' ? (
                              <span className="inline-flex flex-col items-end">
                                <span className="bg-brand-green/20 text-brand-green-light text-xs font-bold px-2 py-1 rounded-full">PAGADO</span>
                                {p.paidAt && <span className="text-text-muted text-xs mt-1">{fmtDate(p.paidAt)}</span>}
                              </span>
                            ) : (
                              <button
                                onClick={() => setMarkTarget(p)}
                                className="bg-brand-green hover:bg-brand-green-light text-white text-xs font-bold rounded-lg px-3 py-1.5 transition-all shadow-lg shadow-brand-green/20"
                              >
                                Marcar como pagado
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {markTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div role="alertdialog" aria-modal="true" aria-label="Marcar como pagado" className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full max-w-md max-h-[90dvh] overflow-y-auto p-5 sm:p-6">
            <div className="flex justify-between items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <CheckCircle2 size={20} className="text-brand-green-light" /> ¿Marcar como pagado?
              </h2>
              <button onClick={() => setMarkTarget(null)} disabled={isMarking} className="p-1 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar">
                <X size={22} />
              </button>
            </div>
            <p className="text-text-secondary text-sm mb-4">
              Confirma que ya transferiste este rendimiento a{' '}
              <strong className="text-text-primary">{markTarget.investor.name ?? markTarget.investor.email}</strong>. No se puede deshacer.
            </p>
            <div className="bg-surface-base rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3"><span className="text-text-secondary">Préstamo</span><span className="text-text-primary truncate">{markTarget.loan.concept}</span></div>
              <div className="flex justify-between gap-3"><span className="text-text-secondary">Capital</span><span className="text-text-primary">{fmt(markTarget.principalAmount)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-text-secondary">Interés neto</span><span className="text-text-primary">{fmt(markTarget.interestAmount)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-text-secondary">Comisión retenida</span><span className="text-text-secondary">{fmt(markTarget.platformFeeAmount)}</span></div>
              <div className="flex justify-between gap-3 pt-1.5 border-t border-surface-border"><span className="text-text-secondary">Total a transferir</span><span className="text-brand-green-light font-bold">{fmt(markTarget.totalAmount)}</span></div>
              {markTarget.investorBanks[0] && (
                <div className="flex justify-between gap-3"><span className="text-text-secondary">Destino</span><span className="text-text-primary font-mono text-xs text-right break-all">{markTarget.investorBanks[0].bankName} · {markTarget.investorBanks[0].clabe}</span></div>
              )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-surface-border">
              <button onClick={() => setMarkTarget(null)} disabled={isMarking} className="flex-1 bg-surface-elevated text-text-primary py-2.5 rounded-xl transition-all font-medium">
                Cancelar
              </button>
              <button
                onClick={() => void handleMarkPaid()} disabled={isMarking}
                className="flex-1 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl py-2.5 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-40"
              >
                {isMarking ? 'Guardando...' : 'Sí, ya lo pagué'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

function SummaryCard({ icon, label, value, highlight }: SummaryCardProps) {
  return (
    <div className={`bg-surface-card/60 backdrop-blur-md border rounded-2xl shadow-card p-5 ${highlight ? 'border-brand-green/20' : 'border-white/5'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-2xl font-extrabold ${highlight ? 'text-brand-green-light' : 'text-text-primary'}`}>{value}</p>
    </div>
  );
}
