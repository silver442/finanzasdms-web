import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowDownLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import { API, authHeaders, fmt } from '../../components/investor/investorTypes';
import {
  WALLET_TX_INCOMING, WALLET_TX_LABELS, WALLET_UPDATED_EVENT, shortId,
  type WalletTransaction, type WalletTxType,
} from '../../components/investor/walletTypes';
import { LoadingRows, WalletStatusBadge, cardCls, inputCls } from '../../components/investor/investorUi';

const TYPE_FILTERS: { value: WalletTxType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'DEPOSIT', label: 'Depósitos' },
  { value: 'WITHDRAWAL', label: 'Retiros' },
  { value: 'LOAN_FUNDING', label: 'Fondeos' },
  { value: 'PAYOUT_RECEIVED', label: 'Pagos recibidos' },
  { value: 'REFUND', label: 'Reembolsos' },
];

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// [INVESTOR, ADMIN, SUPER_ADMIN] /investor/movements — todos los WalletTransaction, del más reciente al más antiguo
export default function InvestorMovements() {
  const [rows, setRows] = useState<WalletTransaction[] | null>(null);
  const [type, setType] = useState<WalletTxType | 'ALL'>('ALL');

  useEffect(() => {
    const load = () =>
      axios.get<WalletTransaction[]>(`${API}/wallet/transactions`, {
        params: { limit: 200, ...(type !== 'ALL' && { type }) },
        headers: authHeaders(),
      })
        .then(({ data }) => setRows(data))
        .catch(() => { toast.error('No se pudieron cargar tus movimientos'); setRows([]); });
    const onUpdate = () => void load();
    onUpdate();
    window.addEventListener(WALLET_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(WALLET_UPDATED_EVENT, onUpdate);
  }, [type]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Mis movimientos</h1>
          <p className="text-text-secondary mt-1 text-sm md:text-base">Depósitos, retiros, fondeos y pagos que entraron a tu cartera.</p>
        </div>
        <label className="sm:w-56">
          <span className="sr-only">Tipo de movimiento</span>
          <select value={type} onChange={(e) => { setRows(null); setType(e.target.value as WalletTxType | 'ALL'); }} className={`${inputCls} py-2 cursor-pointer`}>
            {TYPE_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {rows === null ? (
        <LoadingRows />
      ) : rows.length === 0 ? (
        <div className={`${cardCls} p-10 text-center text-text-secondary`}>No hay movimientos {type === 'ALL' ? 'todavía' : 'de este tipo'}.</div>
      ) : (
        <div className={`${cardCls} overflow-hidden`}>
          <ul className="divide-y divide-surface-border/60">
            {rows.map((t) => {
              const incoming = WALLET_TX_INCOMING[t.type];
              const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
              const muted = t.status === 'REJECTED';
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`rounded-xl p-2 shrink-0 border ${incoming ? 'bg-brand-green/10 border-brand-green/20' : 'bg-surface-elevated/70 border-white/5'}`}>
                    <Icon size={18} className={incoming ? 'text-brand-green-light' : 'text-text-secondary'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">{WALLET_TX_LABELS[t.type]}</p>
                      <WalletStatusBadge status={t.status} />
                      {t.referenceId && <span className="font-mono text-[11px] text-text-muted">#{shortId(t.referenceId)}</span>}
                    </div>
                    <p className="text-xs text-text-muted truncate" title={t.notes ?? undefined}>
                      {fmtDateTime(t.createdAt)}{t.notes ? ` · ${t.notes}` : ''}
                    </p>
                    {t.proofUrl && (
                      <a href={t.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-brand-green-light">
                        Ver comprobante <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  <p className={`text-sm font-bold tabular-nums shrink-0 ${muted ? 'text-text-muted line-through' : incoming ? 'text-brand-green-light' : 'text-text-primary'}`}>
                    {incoming ? '+' : '−'}{fmt(t.amount)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
