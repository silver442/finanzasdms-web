import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowDownToLine, ArrowUpFromLine, Briefcase, Check, Clock, Copy, Landmark, Loader2, Paperclip, PiggyBank, Wallet, X,
} from 'lucide-react';
import { API, apiError, authHeaders, fmt, fmtDate } from '../../components/investor/investorTypes';
import { notifyWalletUpdated, type BankAccountInfo, type WalletTransaction } from '../../components/investor/walletTypes';
import { StatCard, cardCls, inputCls, labelCls, primaryBtnCls } from '../../components/investor/investorUi';
import { useWallet } from '../../hooks/useWallet';

type Tab = 'deposit' | 'withdraw';
const MAX_PROOF_BYTES = 5 * 1024 * 1024;

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('No se pudo copiar');
    }
  };
  return (
    <button type="button" onClick={() => void copy()} aria-label={`Copiar ${label}`} className="p-1.5 rounded-lg text-text-secondary hover:text-brand-green-light hover:bg-surface-elevated transition-colors shrink-0">
      {copied ? <Check size={16} className="text-brand-green-light" /> : <Copy size={16} />}
    </button>
  );
}

function BankCard({ bank }: { bank: BankAccountInfo }) {
  return (
    <div className="bg-surface-base rounded-xl p-4 flex items-start gap-3">
      <Landmark size={18} className="text-text-secondary mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-text-primary font-semibold">{bank.bankName}</p>
        <p className="text-text-secondary text-sm">{bank.accountHolder}</p>
        <div className="flex items-center gap-1 mt-1">
          <p className="font-mono text-text-primary tracking-wider break-all">{bank.clabe}</p>
          <CopyButton value={bank.clabe} label="CLABE" />
        </div>
      </div>
    </div>
  );
}

function PendingList({ items, empty }: { items: WalletTransaction[]; empty: string }) {
  if (items.length === 0) return <p className="text-text-muted text-sm">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 bg-surface-base rounded-xl px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-text-secondary min-w-0">
            <Clock size={15} className="text-amber-400 shrink-0" />
            <span className="truncate">{fmtDate(t.createdAt)}{t.notes ? ` · ${t.notes}` : ''}</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="font-bold tabular-nums text-text-primary">{fmt(t.amount)}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/25">En revisión</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function DepositPanel({ pending }: { pending: WalletTransaction[] }) {
  const [banks, setBanks] = useState<BankAccountInfo[] | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Cuentas del SUPER_ADMIN marcadas para recibir aportaciones de inversionistas
  useEffect(() => {
    axios.get<BankAccountInfo[]>(`${API}/admin-banks/funding`, { headers: authHeaders() })
      .then(({ data }) => setBanks(data))
      .catch(() => setBanks([]));
  }, []);

  const parsed = Number(amount);
  const error = amount === '' ? null : !(parsed >= 1) ? 'El monto mínimo es $1.00' : null;

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_PROOF_BYTES) {
      toast.error('El comprobante no puede pesar más de 5 MB');
      e.target.value = '';
      return;
    }
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error || amount === '') return;
    const body = new FormData();
    body.append('amount', String(parsed));
    if (notes.trim()) body.append('notes', notes.trim());
    if (file) body.append('proof', file);
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/wallet/deposit-request`, body, { headers: authHeaders() });
      toast.success('Depósito reportado. Lo verás en tu disponible cuando el SuperAdmin lo valide.');
      setAmount('');
      setNotes('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      notifyWalletUpdated();
    } catch (err) {
      toast.error(apiError(err, 'No se pudo reportar el depósito'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className={`${cardCls} p-5 sm:p-6 flex flex-col gap-4`}>
        <div>
          <h2 className="text-base font-bold text-text-primary">1. Transfiere por SPEI</h2>
          <p className="text-text-muted text-sm mt-1">Envía el monto que quieras invertir a cualquiera de estas cuentas de Cashi.</p>
        </div>
        {banks === null ? (
          <p className="text-text-muted text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Cargando cuentas...</p>
        ) : banks.length === 0 ? (
          <p className="text-amber-400 text-sm">Aún no hay una cuenta registrada para recibir depósitos. Contacta al SuperAdmin antes de transferir.</p>
        ) : (
          <div className="flex flex-col gap-2">{banks.map((b) => <BankCard key={b.id} bank={b} />)}</div>
        )}
      </section>

      <form onSubmit={(e) => void submit(e)} noValidate className={`${cardCls} p-5 sm:p-6 flex flex-col gap-4`}>
        <div>
          <h2 className="text-base font-bold text-text-primary">2. Reporta tu depósito</h2>
          <p className="text-text-muted text-sm mt-1">Queda <span className="text-amber-400 font-semibold">en revisión</span> hasta que confirmemos la transferencia.</p>
        </div>
        <div>
          <label htmlFor="dep-amount" className={labelCls}>Monto depositado (MXN)</label>
          <input id="dep-amount" type="number" inputMode="decimal" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputCls} ${error ? 'border-red-500/60' : ''}`} />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
        <div>
          <label htmlFor="dep-notes" className={labelCls}>Referencia / clave de rastreo (opcional)</label>
          <input id="dep-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} placeholder="Ej. 0123456789" className={inputCls} />
        </div>
        <div>
          <p className={labelCls}>Comprobante (opcional)</p>
          <input ref={fileRef} id="dep-proof" type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={pickFile} className="sr-only" />
          {file ? (
            <div className="flex items-center justify-between gap-2 bg-surface-base rounded-lg px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-text-primary min-w-0"><Paperclip size={15} className="shrink-0" /><span className="truncate">{file.name}</span></span>
              <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} aria-label="Quitar comprobante" className="p-1 text-text-secondary hover:text-red-400"><X size={16} /></button>
            </div>
          ) : (
            <label htmlFor="dep-proof" className="flex items-center justify-center gap-2 border border-dashed border-surface-border hover:border-brand-green/50 rounded-lg px-3 py-3 text-sm text-text-secondary hover:text-text-primary cursor-pointer transition-colors">
              <Paperclip size={15} /> Adjuntar imagen o PDF (máx. 5 MB)
            </label>
          )}
        </div>
        <button type="submit" disabled={isSubmitting || amount === '' || !!error} className={primaryBtnCls}>
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : <><ArrowDownToLine size={16} /> Reportar depósito</>}
        </button>
        <div className="pt-2 border-t border-surface-border">
          <p className={labelCls}>Depósitos en revisión</p>
          <PendingList items={pending} empty="No tienes depósitos en revisión." />
        </div>
      </form>
    </div>
  );
}

function WithdrawPanel({ available, pending }: { available: number; pending: WalletTransaction[] }) {
  const [bank, setBank] = useState<BankAccountInfo | null | undefined>(undefined);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    axios.get<{ payoutBank: BankAccountInfo | null }>(`${API}/investor-profile/me`, { headers: authHeaders() })
      .then(({ data }) => setBank(data.payoutBank))
      .catch(() => setBank(null));
  }, []);

  const parsed = Number(amount);
  const error =
    amount === '' ? null
      : !(parsed >= 1) ? 'El monto mínimo es $1.00'
        : parsed > available ? `Solo puedes retirar tu disponible (${fmt(available)})`
          : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error || amount === '') return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/wallet/withdrawal-request`, { amount: parsed, ...(notes.trim() ? { notes: notes.trim() } : {}) }, { headers: authHeaders() });
      toast.success(`Solicitaste un retiro de ${fmt(parsed)}. El monto queda apartado mientras se transfiere.`);
      setAmount('');
      setNotes('');
      notifyWalletUpdated();
    } catch (err) {
      toast.error(apiError(err, 'No se pudo solicitar el retiro'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className={`${cardCls} p-5 sm:p-6 flex flex-col gap-4`}>
        <div>
          <h2 className="text-base font-bold text-text-primary">Cuenta para recibir</h2>
          <p className="text-text-muted text-sm mt-1">Aquí te transferimos tus retiros.</p>
        </div>
        {bank === undefined ? (
          <p className="text-text-muted text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Cargando cuenta...</p>
        ) : bank === null ? (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 text-sm text-amber-300">
            Aún no registras una cuenta para recibir. <Link to="/investor/profile" className="font-bold underline hover:text-amber-200">Agrégala en Mi perfil</Link> para poder retirar.
          </div>
        ) : (
          <>
            <BankCard bank={bank} />
            <Link to="/investor/profile" className="text-sm text-text-secondary hover:text-brand-green-light self-start">Cambiar cuenta en Mi perfil →</Link>
          </>
        )}
      </section>

      <form onSubmit={(e) => void submit(e)} noValidate className={`${cardCls} p-5 sm:p-6 flex flex-col gap-4`}>
        <div>
          <h2 className="text-base font-bold text-text-primary">Solicitar retiro</h2>
          <p className="text-text-muted text-sm mt-1">Solo puedes retirar tu disponible; el capital prestado regresa conforme te pagan.</p>
        </div>
        <div>
          <div className="flex items-end justify-between gap-2 mb-1">
            <label htmlFor="wd-amount" className={`${labelCls} mb-0`}>Monto a retirar (MXN)</label>
            <button type="button" onClick={() => setAmount(available.toFixed(2))} disabled={available <= 0} className="text-xs font-bold text-brand-green-light hover:text-brand-green disabled:opacity-40">
              Retirar todo ({fmt(available)})
            </button>
          </div>
          <input id="wd-amount" type="number" inputMode="decimal" min="1" step="0.01" max={available} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputCls} ${error ? 'border-red-500/60' : ''}`} disabled={!bank} />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
        <div>
          <label htmlFor="wd-notes" className={labelCls}>Nota (opcional)</label>
          <input id="wd-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} className={inputCls} disabled={!bank} />
        </div>
        <button type="submit" disabled={isSubmitting || !bank || amount === '' || !!error} className={primaryBtnCls}>
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : <><ArrowUpFromLine size={16} /> Solicitar retiro</>}
        </button>
        <div className="pt-2 border-t border-surface-border">
          <p className={labelCls}>Retiros en proceso</p>
          <PendingList items={pending} empty="No tienes retiros en proceso." />
        </div>
      </form>
    </div>
  );
}

// [INVESTOR, ADMIN, SUPER_ADMIN] /investor/wallet — saldos, agregar y retirar fondos
export default function InvestorWallet() {
  const { wallet, isLoading } = useWallet();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'withdraw' ? 'withdraw' : 'deposit';

  const pendingOf = (type: 'DEPOSIT' | 'WITHDRAWAL') =>
    (wallet?.transactions ?? []).filter((t) => t.type === type && t.status === 'PENDING');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Cartera</h1>
        <p className="text-text-secondary mt-1 text-sm md:text-base">Tu dinero para prestar, lo que ya tienes invertido y el valor de tu cuenta.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Wallet} accent label="Disponible para invertir" value={isLoading ? '—' : fmt(wallet?.availableBalance ?? 0)}
          hint={wallet && wallet.pendingWithdrawals > 0 ? `${fmt(wallet.pendingWithdrawals)} apartados en retiros` : undefined} />
        <StatCard icon={Briefcase} label="Invertido en préstamos" value={isLoading ? '—' : fmt(wallet?.investedBalance ?? 0)} hint="Capital que aún no te regresan" />
        <StatCard icon={PiggyBank} label="Valor total de la cuenta" value={isLoading ? '—' : fmt(wallet?.totalAccountValue ?? 0)}
          hint={wallet && wallet.pendingDeposits > 0 ? `+ ${fmt(wallet.pendingDeposits)} en revisión` : undefined} />
      </div>

      <div role="tablist" aria-label="Movimientos de cartera" className="grid grid-cols-2 gap-1 bg-surface-card/60 border border-white/5 rounded-xl p-1 w-full sm:w-96">
        {([
          { value: 'deposit', label: 'Agregar fondos', Icon: ArrowDownToLine },
          { value: 'withdraw', label: 'Retirar fondos', Icon: ArrowUpFromLine },
        ] as const).map(({ value, label, Icon }) => (
          <button
            key={value} role="tab" aria-selected={tab === value} onClick={() => setParams({ tab: value }, { replace: true })}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === value ? 'bg-brand-green/10 text-brand-green-light border border-brand-green/20' : 'text-text-secondary hover:text-text-primary border border-transparent'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'deposit'
        ? <DepositPanel pending={pendingOf('DEPOSIT')} />
        : <WithdrawPanel available={wallet?.availableBalance ?? 0} pending={pendingOf('WITHDRAWAL')} />}
    </div>
  );
}
