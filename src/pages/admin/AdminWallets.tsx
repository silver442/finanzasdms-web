import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowDownToLine, ArrowUpFromLine, Briefcase, CheckCircle2, Clock, ExternalLink, Landmark, Loader2, Wallet, X, XCircle,
} from 'lucide-react';
import { API, apiError, authHeaders, fmt } from '../../components/investor/investorTypes';
import { WALLET_TX_LABELS, notifyWalletUpdated, type BankAccountInfo, type WalletTransaction } from '../../components/investor/walletTypes';
import { LoadingRows, StatCard, cardCls, inputCls, labelCls } from '../../components/investor/investorUi';

// GET /admin/wallets
interface WalletRow {
  user: { id: string; email: string; name: string | null; role: string; investorAlias: string | null };
  walletId: string | null;
  availableBalance: number;
  investedBalance: number;
  totalAccountValue: number;
  payoutBank: BankAccountInfo | null;
  pendingRequests: WalletTransaction[];
}

type PendingItem = WalletTransaction & { owner: WalletRow };
type Review = { item: PendingItem; action: 'approve' | 'reject' };
type Tab = 'pending' | 'investors';

const ROLE_LABELS: Record<string, string> = { INVESTOR: 'Inversionista', ADMIN: 'Admin', SUPER_ADMIN: 'SuperAdmin' };

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ownerName = (r: WalletRow) => r.user.name ?? r.user.email;

// Qué pasa con el saldo al aprobar/rechazar, para que el SuperAdmin decida con claridad
function reviewEffect({ item, action }: Review): string {
  if (item.type === 'DEPOSIT') {
    return action === 'approve'
      ? `Confirma que recibiste la transferencia: se abonan ${fmt(item.amount)} al disponible del inversionista.`
      : 'El depósito se marca como rechazado y el disponible no cambia.';
  }
  return action === 'approve'
    ? `Confirma que ya transferiste ${fmt(item.amount)} a la cuenta del inversionista. El monto ya estaba apartado de su disponible.`
    : `Se regresan ${fmt(item.amount)} al disponible del inversionista.`;
}

function ReviewModal({ review, isSubmitting, onConfirm, onClose }: {
  review: Review; isSubmitting: boolean; onConfirm: (reason: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const { item, action } = review;
  const isApprove = action === 'approve';
  const title = `${isApprove ? 'Aprobar' : 'Rechazar'} ${item.type === 'DEPOSIT' ? 'depósito' : 'retiro'}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full max-w-md max-h-[90dvh] overflow-y-auto p-5 sm:p-6">
        <div className="flex justify-between items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-3">
            <span className={`rounded-xl p-2 border ${isApprove ? 'bg-brand-green/10 border-brand-green/25' : 'bg-red-500/10 border-red-500/20'}`}>
              {isApprove ? <CheckCircle2 size={20} className="text-brand-green-light" /> : <XCircle size={20} className="text-red-400" />}
            </span>
            {title}
          </h2>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="p-1 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar"><X size={22} /></button>
        </div>

        <div className="bg-surface-base rounded-xl p-4 space-y-1.5 text-sm mb-4">
          <div className="flex justify-between gap-3"><span className="text-text-secondary">Inversionista</span><span className="text-text-primary font-semibold truncate">{ownerName(item.owner)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-text-secondary">Monto</span><span className="text-text-primary font-bold tabular-nums">{fmt(item.amount)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-text-secondary">Solicitado</span><span className="text-text-primary">{fmtDateTime(item.createdAt)}</span></div>
          {item.notes && <div className="flex justify-between gap-3"><span className="text-text-secondary">Referencia</span><span className="text-text-primary text-right break-all">{item.notes}</span></div>}
          {item.type === 'WITHDRAWAL' && item.owner.payoutBank && (
            <div className="pt-2 mt-2 border-t border-surface-border">
              <p className="text-text-secondary text-xs mb-1">Transferir a</p>
              <p className="text-text-primary font-semibold">{item.owner.payoutBank.bankName} · {item.owner.payoutBank.accountHolder}</p>
              <p className="font-mono text-text-secondary tracking-wider break-all">{item.owner.payoutBank.clabe}</p>
            </div>
          )}
        </div>

        <p className="text-sm text-text-secondary">{reviewEffect(review)}</p>

        {!isApprove && (
          <div className="mt-4">
            <label htmlFor="wallet-reject-reason" className={labelCls}>Motivo (opcional, lo verá el inversionista)</label>
            <textarea id="wallet-reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} className={`${inputCls} resize-none`} placeholder="Ej. No encontramos la transferencia con esa referencia" />
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-surface-border">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 bg-surface-elevated text-text-primary py-2.5 rounded-xl transition-all font-medium">Cancelar</button>
          <button
            type="button" onClick={() => onConfirm(reason.trim())} disabled={isSubmitting}
            className={`flex-1 text-white font-bold rounded-xl py-2.5 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isApprove ? 'bg-brand-green hover:bg-brand-green-light shadow-brand-green/20' : 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
            }`}
          >
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Procesando...</> : isApprove ? 'Aprobar' : 'Rechazar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// [SUPER_ADMIN] /admin/wallets — carteras de inversionistas y validación de depósitos/retiros
export default function AdminWallets() {
  const [rows, setRows] = useState<WalletRow[] | null>(null);
  const [tab, setTab] = useState<Tab>('pending');
  const [review, setReview] = useState<Review | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRows = useCallback(async () => {
    try {
      const { data } = await axios.get<WalletRow[]>(`${API}/admin/wallets`, { headers: authHeaders() });
      setRows(data);
    } catch {
      toast.error('No se pudieron cargar las carteras');
      setRows([]);
    }
  }, []);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  const pending = useMemo<PendingItem[]>(
    () => (rows ?? [])
      .flatMap((r) => r.pendingRequests.map((t) => ({ ...t, owner: r })))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [rows],
  );
  const totals = useMemo(() => (rows ?? []).reduce(
    (acc, r) => ({ available: acc.available + r.availableBalance, invested: acc.invested + r.investedBalance }),
    { available: 0, invested: 0 },
  ), [rows]);

  const confirm = async (reason: string) => {
    if (!review) return;
    const { item, action } = review;
    setIsSubmitting(true);
    try {
      await axios.patch(
        `${API}/admin/wallet-transactions/${item.id}/${action}`,
        action === 'reject' && reason ? { reason } : {},
        { headers: authHeaders() },
      );
      toast.success(`${WALLET_TX_LABELS[item.type]} de ${fmt(item.amount)} ${action === 'approve' ? 'aprobado' : 'rechazado'}`);
      setReview(null);
      notifyWalletUpdated(); // por si el SuperAdmin revisó su propia cartera
      await fetchRows();
    } catch (err) {
      toast.error(apiError(err, 'No se pudo procesar la solicitud'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 text-white font-sans max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="bg-brand-green/10 border border-brand-green/25 rounded-2xl p-4 shrink-0 shadow-lg shadow-brand-green/10">
          <Wallet size={32} className="text-brand-green-light" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Carteras y Saldos</h1>
          <p className="text-text-secondary mt-1 text-sm md:text-base">Saldos de los inversionistas y solicitudes de depósito y retiro por validar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Wallet} accent label="Disponible total" value={rows ? fmt(totals.available) : '—'} hint="Dinero de inversionistas sin prestar" />
        <StatCard icon={Briefcase} label="Invertido total" value={rows ? fmt(totals.invested) : '—'} hint="Capital prestado aún sin recuperar" />
        <StatCard icon={Clock} label="Solicitudes pendientes" value={rows ? String(pending.length) : '—'} />
      </div>

      <div role="tablist" aria-label="Vista" className="flex gap-1 border-b border-surface-border">
        {([
          { value: 'pending', label: `Solicitudes pendientes${pending.length ? ` (${pending.length})` : ''}` },
          { value: 'investors', label: 'Inversionistas' },
        ] as const).map(({ value, label }) => (
          <button
            key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === value ? 'border-brand-green text-brand-green-light' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {rows === null ? (
        <LoadingRows />
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <div className={`${cardCls} p-10 text-center text-text-secondary`}>No hay depósitos ni retiros por validar.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((item) => {
              const isDeposit = item.type === 'DEPOSIT';
              return (
                <li key={item.id} className={`${cardCls} p-4 flex flex-col md:flex-row md:items-center gap-4`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`rounded-xl p-2.5 shrink-0 border ${isDeposit ? 'bg-brand-green/10 border-brand-green/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                      {isDeposit ? <ArrowDownToLine size={18} className="text-brand-green-light" /> : <ArrowUpFromLine size={18} className="text-amber-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">
                        {WALLET_TX_LABELS[item.type]} · <span className="tabular-nums">{fmt(item.amount)}</span>
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {ownerName(item.owner)}{item.owner.user.investorAlias ? ` (@${item.owner.user.investorAlias})` : ''} · {fmtDateTime(item.createdAt)}
                      </p>
                      {item.notes && <p className="text-xs text-text-muted truncate" title={item.notes}>Ref: {item.notes}</p>}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        {item.proofUrl && (
                          <a href={item.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-brand-green-light">
                            Ver comprobante <ExternalLink size={11} />
                          </a>
                        )}
                        {!isDeposit && (
                          item.owner.payoutBank ? (
                            <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                              <Landmark size={12} /> {item.owner.payoutBank.bankName} · <span className="font-mono">{item.owner.payoutBank.clabe}</span>
                            </span>
                          ) : <span className="text-xs text-amber-400">Sin cuenta de destino</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setReview({ item, action: 'reject' })} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 rounded-xl px-4 py-2 text-sm font-bold transition-colors">
                      <XCircle size={15} /> Rechazar
                    </button>
                    <button type="button" onClick={() => setReview({ item, action: 'approve' })} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-brand-green hover:bg-brand-green-light text-white rounded-xl px-4 py-2 text-sm font-bold transition-all shadow-lg shadow-brand-green/20">
                      <CheckCircle2 size={15} /> Aprobar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : rows.length === 0 ? (
        <div className={`${cardCls} p-10 text-center text-text-secondary`}>Aún no hay inversionistas con cartera.</div>
      ) : (
        <div className={`${cardCls} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-3xl">
              <thead className="text-xs text-text-muted uppercase tracking-wider bg-surface-elevated/40">
                <tr>
                  <th className="text-left px-4 py-3">Inversionista</th>
                  <th className="text-right px-4 py-3">Disponible</th>
                  <th className="text-right px-4 py-3">Invertido</th>
                  <th className="text-right px-4 py-3">Valor total</th>
                  <th className="text-left px-4 py-3">Cuenta de rendimientos</th>
                  <th className="text-center px-4 py-3">Pendientes</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {rows.map((r) => (
                  <tr key={r.user.id} className="border-t border-surface-border/60">
                    <td className="px-4 py-3">
                      <p className="text-text-primary font-semibold">{ownerName(r)}</p>
                      <p className="text-xs text-text-muted">
                        {r.user.investorAlias ? `@${r.user.investorAlias} · ` : ''}{ROLE_LABELS[r.user.role] ?? r.user.role}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-brand-green-light font-bold">{fmt(r.availableBalance)}</td>
                    <td className="px-4 py-3 text-right text-text-primary">{fmt(r.investedBalance)}</td>
                    <td className="px-4 py-3 text-right text-text-primary">{fmt(r.totalAccountValue)}</td>
                    <td className="px-4 py-3">
                      {r.payoutBank
                        ? <><p className="text-text-primary">{r.payoutBank.bankName}</p><p className="text-xs font-mono text-text-muted">{r.payoutBank.clabe}</p></>
                        : <span className="text-xs text-amber-400">Sin registrar</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.pendingRequests.length > 0
                        ? <button type="button" onClick={() => setTab('pending')} className="text-xs font-bold px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/25">{r.pendingRequests.length}</button>
                        : <span className="text-text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {review && <ReviewModal review={review} isSubmitting={isSubmitting} onConfirm={(r) => void confirm(r)} onClose={() => setReview(null)} />}
    </div>
  );
}
