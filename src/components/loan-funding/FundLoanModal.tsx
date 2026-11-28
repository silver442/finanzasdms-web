import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { HandCoins, Landmark, X } from 'lucide-react';
import type { FundingProgress } from './fundingTypes';

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

const QUICK_SHARES = [25, 50, 100] as const;

interface FundingBank {
  id: string;
  bankName: string;
  clabe: string;
  accountHolder: string;
}

interface FundLoanModalProps {
  loanId: string;
  concept: string;
  progress: FundingProgress;
  onClose: () => void;
  onFunded: () => void;
  /** El SUPER_ADMIN fondea con capital propio: no necesita cuenta destino */
  showDestination: boolean;
}

// Aportar a un préstamo: % rápido del restante o monto libre (POST /loans/:id/fund)
export default function FundLoanModal({ loanId, concept, progress, onClose, onFunded, showDestination }: FundLoanModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banks, setBanks] = useState<FundingBank[] | null>(null);

  // Cuentas del SUPER_ADMIN marcadas para recibir aportaciones
  useEffect(() => {
    if (!showDestination) return;
    axios.get<FundingBank[]>(`${API}/admin-banks/funding`, { headers: authHeaders() })
      .then(({ data }) => setBanks(data))
      .catch(() => setBanks([]));
  }, [showDestination]);

  const remaining = progress.remainingAmount;
  const parsed = amount === '' ? NaN : Number(amount);
  const error =
    amount === '' ? null
      : isNaN(parsed) || parsed <= 0 ? 'Ingresa un monto mayor a 0'
        : parsed > remaining ? `No puede superar el restante (${fmt(remaining)})`
          : null;

  // El 100% es exacto; los parciales se redondean hacia abajo para no rebasar el restante
  const shareOf = (share: number) =>
    share === 100 ? remaining : Math.floor(remaining * share) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error || isNaN(parsed)) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/loans/${loanId}/fund`, { amount: parsed }, { headers: authHeaders() });
      toast.success(`Aportaste ${fmt(parsed)} a "${concept}"`);
      onFunded();
      onClose();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg ?? 'No se pudo registrar la aportación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        role="dialog" aria-modal="true" aria-label="Aportar al préstamo"
        className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full max-w-md max-h-[90dvh] overflow-y-auto p-5 sm:p-6"
      >
        <div className="flex justify-between items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <HandCoins size={20} className="text-brand-green-light" />
            Aportar al préstamo
          </h2>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="p-1 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <div className="bg-surface-base rounded-xl p-4 space-y-1.5 text-sm mb-4">
          <div className="flex justify-between gap-3"><span className="text-text-secondary">Préstamo</span><span className="text-text-primary font-semibold truncate">{concept}</span></div>
          <div className="flex justify-between gap-3"><span className="text-text-secondary">Monto total</span><span className="text-text-primary">{fmt(progress.loanAmount)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-text-secondary">Ya fondeado</span><span className="text-text-primary">{fmt(progress.fundedAmount)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-text-secondary">Restante</span><span className="text-brand-green-light font-bold">{fmt(remaining)}</span></div>
        </div>

        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Del restante</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {QUICK_SHARES.map((share) => {
            const value = shareOf(share);
            const isActive = amount !== '' && Number(amount) === value;
            return (
              <button
                key={share} type="button" onClick={() => setAmount(String(value))} disabled={isSubmitting || value <= 0}
                className={`rounded-xl border px-2 py-2 text-sm font-bold transition-all disabled:opacity-40 ${
                  isActive
                    ? 'bg-brand-green/10 text-brand-green-light border-brand-green/30'
                    : 'bg-surface-elevated/60 text-text-primary border-white/5 hover:border-brand-green/30'
                }`}
              >
                {share}%
                <span className="block text-xs font-normal text-text-secondary">{fmt(value)}</span>
              </button>
            );
          })}
        </div>

        <label htmlFor="fund-amount" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Monto libre (MXN)</label>
        <input
          id="fund-amount" type="number" min="0.01" step="0.01" max={remaining} inputMode="decimal"
          value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
          className="w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors"
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        {!error && !isNaN(parsed) && progress.loanAmount > 0 && (
          <p className="text-text-muted text-xs mt-1">
            Equivale al {((parsed / progress.loanAmount) * 100).toFixed(2)}% del préstamo.
          </p>
        )}

        {showDestination && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Transfiere tu aportación a</p>
            {banks === null ? (
              <p className="text-text-muted text-xs">Cargando cuentas...</p>
            ) : banks.length === 0 ? (
              <p className="text-amber-400 text-xs">El SuperAdmin aún no registra una cuenta para aportaciones. Contáctalo antes de transferir.</p>
            ) : (
              <div className="space-y-2">
                {banks.map((b) => (
                  <div key={b.id} className="flex items-start gap-2 bg-surface-base rounded-lg px-3 py-2 text-sm">
                    <Landmark size={15} className="text-text-secondary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-text-primary font-semibold">{b.bankName} · {b.accountHolder}</p>
                      <p className="font-mono text-text-secondary tracking-wider break-all">{b.clabe}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-surface-border">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 bg-surface-elevated text-text-primary py-2.5 rounded-xl transition-all font-medium">
            Cancelar
          </button>
          <button
            type="submit" disabled={isSubmitting || !!error || isNaN(parsed)}
            className="flex-1 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl py-2.5 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Aportando...' : 'Confirmar aportación'}
          </button>
        </div>
      </form>
    </div>
  );
}
