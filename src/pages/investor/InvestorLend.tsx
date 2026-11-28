import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ChevronRight, Filter, Loader2, Search, Wallet } from 'lucide-react';
import { API, authHeaders, fmt } from '../../components/investor/investorTypes';
import { shortId, termLabel, type MarketplaceLoan } from '../../components/investor/walletTypes';
import { LoadingRows, ProgressBar, RatingBadge, cardCls, inputCls } from '../../components/investor/investorUi';
import { fundAmountError, fundFromWallet } from '../../components/investor/fundFromWallet';
import { useWallet } from '../../hooks/useWallet';

type RatingFilter = 'ALL' | 'A' | 'B' | 'C';
type TermFilter = 'ALL' | 'SHORT' | 'MID' | 'LONG';

const RATING_OPTIONS: { value: RatingFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'A', label: 'A · Socio / Élite' },
  { value: 'B', label: 'B · Cumplidor' },
  { value: 'C', label: 'C · Novato' },
];

const TERM_OPTIONS: { value: TermFilter; label: string }[] = [
  { value: 'ALL', label: 'Cualquier plazo' },
  { value: 'SHORT', label: 'Hasta 3 meses' },
  { value: 'MID', label: '4 a 12 meses' },
  { value: 'LONG', label: 'Más de 12 meses' },
];

const termInMonths = (l: Pick<MarketplaceLoan, 'termQuantity' | 'termUnit'>) =>
  l.termUnit === 'SEMANAS' ? l.termQuantity / 4 : l.termQuantity;

function matchesTerm(l: MarketplaceLoan, f: TermFilter) {
  const m = termInMonths(l);
  if (f === 'SHORT') return m <= 3;
  if (f === 'MID') return m > 3 && m <= 12;
  if (f === 'LONG') return m > 12;
  return true;
}

const selectCls = `${inputCls} py-2 appearance-none cursor-pointer`;
const colLabel = 'lg:hidden text-[10px] font-semibold text-text-muted uppercase tracking-wider';

function LendRow({ loan, available, onFunded }: { loan: MarketplaceLoan; available: number; onFunded: () => void }) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const error = fundAmountError(amount, loan.remainingAmount, available);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || error) return;
    setIsSubmitting(true);
    const ok = await fundFromWallet(loan.id, Number(amount), loan.purpose);
    setIsSubmitting(false);
    if (ok) { setAmount(''); onFunded(); }
  };

  const open = () => navigate(`/investor/lend/${loan.id}`);

  return (
    <li
      className={`${cardCls} relative overflow-hidden cursor-pointer hover:border-brand-green/25 transition-colors`}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={`Ver solicitud ${shortId(loan.id)}: ${loan.purpose}`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-x-3 gap-y-3 items-center px-4 py-4">
        <div className="lg:col-span-1">
          <p className={colLabel}>ID</p>
          <p className="font-mono text-xs text-text-secondary">{shortId(loan.id)}</p>
        </div>
        <div className="lg:col-span-1 flex items-center gap-2">
          <RatingBadge rating={loan.rating} level={loan.level} />
          <span className="text-sm font-bold text-text-primary tabular-nums" title={loan.rateIsEstimated ? 'Tasa estimada: la fija el administrador al aprobar' : undefined}>
            {loan.interestRate}%{loan.rateIsEstimated && <span className="text-text-muted">*</span>}
          </span>
        </div>
        <div className="lg:col-span-1">
          <p className={colLabel}>Puntos</p>
          <p className="text-sm text-text-primary tabular-nums">{loan.points.toLocaleString('es-MX')}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 lg:col-span-2 min-w-0">
          <p className={colLabel}>Destino</p>
          <p className="text-sm text-text-primary font-semibold truncate" title={loan.purpose}>{loan.purpose}</p>
        </div>
        <div className="lg:col-span-1">
          <p className={colLabel}>Plazo</p>
          <p className="text-sm text-text-primary">{termLabel(loan.termQuantity, loan.termUnit)}</p>
        </div>
        <div className="lg:col-span-1">
          <p className={colLabel}>Monto</p>
          <p className="text-sm text-text-primary tabular-nums">{fmt(loan.amount)}</p>
        </div>
        <div className="lg:col-span-1">
          <p className={colLabel}>Falta</p>
          <p className="text-sm font-bold text-brand-green-light tabular-nums">{fmt(loan.remainingAmount)}</p>
        </div>
        <div className="lg:col-span-1">
          <p className={colLabel}>Días</p>
          <p className={`text-sm tabular-nums ${loan.daysRemaining <= 3 ? 'text-amber-400 font-bold' : 'text-text-primary'}`}>{loan.daysRemaining}</p>
        </div>
        <form
          onSubmit={(e) => void submit(e)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="col-span-2 sm:col-span-4 lg:col-span-3 flex items-start gap-2"
        >
          <div className="flex-1 min-w-0">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
              <input
                type="number" inputMode="decimal" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="Monto" aria-label={`Monto a prestar a ${shortId(loan.id)}`}
                className={`${inputCls} py-2 pl-6 ${error ? 'border-red-500/60' : ''}`}
              />
            </div>
            {error && <p className="text-red-400 text-[11px] mt-0.5">{error}</p>}
          </div>
          <button type="submit" disabled={isSubmitting || amount === '' || !!error} className="bg-brand-green hover:bg-brand-green-light text-white text-sm font-bold rounded-lg px-3 py-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1">
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Prestar'}
          </button>
          <ChevronRight size={18} className="hidden lg:block text-text-muted mt-2 shrink-0" aria-hidden />
        </form>
      </div>
      {loan.myContribution > 0 && (
        <p className="px-4 -mt-2 pb-3 text-xs text-brand-green-light">Ya aportaste {fmt(loan.myContribution)}</p>
      )}
      <div className="absolute inset-x-0 bottom-0" title={`${loan.fundedPercentage.toFixed(1)}% fondeado`}>
        <ProgressBar pct={loan.fundedPercentage} className="h-1 rounded-none" />
      </div>
    </li>
  );
}

// [INVESTOR, ADMIN, SUPER_ADMIN] /investor/lend — solicitudes en fondeo, estilo filas de marketplace
export default function InvestorLend() {
  const { wallet } = useWallet();
  const [loans, setLoans] = useState<MarketplaceLoan[] | null>(null);
  const [rating, setRating] = useState<RatingFilter>('ALL');
  const [term, setTerm] = useState<TermFilter>('ALL');
  const [purpose, setPurpose] = useState('');

  const fetchLoans = useCallback(async () => {
    try {
      const { data } = await axios.get<MarketplaceLoan[]>(`${API}/loans/marketplace`, { headers: authHeaders() });
      setLoans(data);
    } catch {
      toast.error('No se pudieron cargar las solicitudes');
      setLoans([]);
    }
  }, []);

  useEffect(() => { void fetchLoans(); }, [fetchLoans]);

  const filtered = useMemo(() => {
    const q = purpose.trim().toLowerCase();
    return (loans ?? []).filter((l) =>
      (rating === 'ALL' || l.rating.startsWith(rating))
      && matchesTerm(l, term)
      && (!q || l.purpose.toLowerCase().includes(q)));
  }, [loans, rating, term, purpose]);

  const available = wallet?.availableBalance ?? 0;
  const hasEstimated = filtered.some((l) => l.rateIsEstimated);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Ir a prestar</h1>
        <p className="text-text-secondary mt-1 text-sm md:text-base">Elige solicitudes de la comunidad y presta desde tu disponible.</p>
      </div>

      <div className={`${cardCls} p-4 flex flex-col lg:flex-row lg:items-center gap-4`}>
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-brand-green/10 border border-brand-green/25 rounded-xl p-2"><Wallet size={18} className="text-brand-green-light" /></div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Disponible</p>
            <p className="text-lg font-extrabold text-brand-green-light tabular-nums">{fmt(available)}</p>
          </div>
          {available <= 0 && wallet && (
            <Link to="/investor/wallet" className="text-xs font-bold text-brand-green-light hover:text-brand-green ml-2">Agregar fondos →</Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
          <label className="relative">
            <span className="sr-only">Calificación</span>
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <select value={rating} onChange={(e) => setRating(e.target.value as RatingFilter)} className={`${selectCls} pl-8`}>
              {RATING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Plazo</span>
            <select value={term} onChange={(e) => setTerm(e.target.value as TermFilter)} className={selectCls}>
              {TERM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="relative">
            <span className="sr-only">Destino</span>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Buscar destino" className={`${inputCls} py-2 pl-8`} />
          </label>
        </div>
      </div>

      {/* Encabezados de columna (solo escritorio) */}
      <div className="hidden lg:grid grid-cols-12 gap-x-3 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider -mb-2">
        <span className="col-span-1">ID</span>
        <span className="col-span-1">Nivel / Tasa</span>
        <span className="col-span-1">Puntos</span>
        <span className="col-span-2">Destino</span>
        <span className="col-span-1">Plazo</span>
        <span className="col-span-1">Monto</span>
        <span className="col-span-1">Falta</span>
        <span className="col-span-1">Días</span>
        <span className="col-span-3">Prestar</span>
      </div>

      {loans === null ? (
        <LoadingRows />
      ) : filtered.length === 0 ? (
        <div className={`${cardCls} p-10 text-center`}>
          <p className="text-text-primary font-semibold">{loans.length === 0 ? 'No hay solicitudes en fondeo por ahora' : 'Ninguna solicitud coincide con tus filtros'}</p>
          <p className="text-text-muted text-sm mt-1">{loans.length === 0 ? 'Te avisaremos cuando haya nuevas oportunidades.' : 'Prueba con otra calificación, plazo o destino.'}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((l) => <LendRow key={l.id} loan={l} available={available} onFunded={() => void fetchLoans()} />)}
        </ul>
      )}

      {hasEstimated && (
        <p className="text-xs text-text-muted">* Tasa estimada con el nivel del cliente; la definitiva la fija el administrador al aprobar la solicitud.</p>
      )}
    </div>
  );
}
