import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownUp, Bitcoin, DollarSign, Eye, Pencil, PieChart as PieChartIcon, RefreshCw, RotateCcw, Trash2, Wallet } from 'lucide-react';
import axios from 'axios';
import type { CryptoPosition, Currency, PortfolioResponse, PositionStatus, ReferenceMode } from './types';
import { API, apiErrorMessage, authHeaders } from './utils/api';
import { formatMoney, formatPercent, formatPrice, formatShortDate, formatTokens } from './utils/format';
import { getPeriodStart } from './utils/periods';
import { readPref, writePref } from './utils/storage';
import { useUsdMxnRate } from './hooks/useUsdMxnRate';
import { usePeriodOpens } from './hooks/usePeriodOpens';
import RegisterTradeModal from './RegisterTradeModal';
import WatchlistModal from './WatchlistModal';
import CashMovementModal from './CashMovementModal';

const STATUS_ORDER: Record<PositionStatus, number> = { BOUGHT: 0, WATCHLIST: 1, SOLD: 2 };

const STATUS_BADGE: Record<PositionStatus, { label: string; className: string }> = {
  BOUGHT: { label: 'Comprado', className: 'bg-brand-green/20 text-brand-green-light' },
  SOLD: { label: 'Vendido', className: 'bg-surface-elevated text-text-muted' },
  WATCHLIST: { label: 'Seguimiento', className: 'bg-white/5 text-text-secondary border border-white/10' },
};

interface RowMetrics {
  position: CryptoPosition;
  status: PositionStatus;
  quantity: number;
  invested: number;
  price: number | null;
  date: string | null;
  marketPrice: number | undefined;
  percent: number | null;
  profit: number;
}

function SegmentedToggle<T extends string>({ value, options, onChange, ariaLabel }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex bg-surface-base rounded-lg p-1 border border-surface-border">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${value === o.value ? 'bg-brand-green/15 text-brand-green-light shadow-inner' : 'text-text-secondary hover:text-text-primary'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: PositionStatus }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[status].className}`}>{STATUS_BADGE[status].label}</span>
  );
}

function CoinIcon({ symbol, size }: { symbol: string; size: 'sm' | 'md' }) {
  return (
    <div className={`${size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} shrink-0 rounded-full bg-surface-elevated flex items-center justify-center text-brand-green-light`}>
      {symbol.charAt(0)}
    </div>
  );
}

export default function PortfolioTab() {
  const [positions, setPositions] = useState<CryptoPosition[]>([]);
  const [usdBalance, setUsdBalance] = useState(0);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currency, setCurrency] = useState<Currency>(() => readPref('crypto.currency', ['USD', 'MXN'] as const, 'USD'));
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>(() => readPref('crypto.referenceMode', ['DAY', 'SWING'] as const, 'DAY'));
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [watchlistModal, setWatchlistModal] = useState<{ editing: CryptoPosition | null } | null>(null);
  const [rateDraft, setRateDraft] = useState<string | null>(null);

  const { rate, isManual, setOverride } = useUsdMxnRate();
  const CRYPTO_API_KEY = import.meta.env.VITE_CRYPTO_API_KEY;

  const fetchLivePrices = useCallback(async (coinList: CryptoPosition[]) => {
    if (coinList.length === 0) {
      setLivePrices({});
      return;
    }
    setIsRefreshing(true);
    try {
      const uniqueCoins = Array.from(new Set(coinList.map((p) => p.symbol))).join(',');
      const cryptoRes = await axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${uniqueCoins}&tsyms=USD&api_key=${CRYPTO_API_KEY}`);
      const newPrices: Record<string, number> = {};
      if (cryptoRes.data) {
        Object.keys(cryptoRes.data).forEach((coin) => {
          if (cryptoRes.data[coin]?.USD) newPrices[coin] = cryptoRes.data[coin].USD;
        });
      }
      setLivePrices(newPrices);
    } catch {
      toast.error('Error al conectar con el mercado');
    } finally {
      setIsRefreshing(false);
    }
  }, [CRYPTO_API_KEY]);

  const loadPortfolio = useCallback(async () => {
    try {
      const { data } = await axios.get<PortfolioResponse>(`${API}/crypto/portfolio`, { headers: authHeaders() });
      setPositions(data.positions);
      setUsdBalance(data.usdBalance);
      await fetchLivePrices(data.positions);
    } catch {
      toast.error('Error al cargar tu portafolio');
    }
  }, [fetchLivePrices]);

  useEffect(() => {
    let cancelled = false;
    axios
      .get<PortfolioResponse>(`${API}/crypto/portfolio`, { headers: authHeaders() })
      .then(({ data }) => {
        if (cancelled) return;
        setPositions(data.positions);
        setUsdBalance(data.usdBalance);
        return fetchLivePrices(data.positions);
      })
      .catch(() => toast.error('Error al cargar tu portafolio'))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [fetchLivePrices]);

  // Solo las monedas en seguimiento sin precio manual necesitan la apertura del periodo
  const autoReferenceSymbols = useMemo(
    () => positions.filter((p) => p.status === 'WATCHLIST' && p.referencePrice === null).map((p) => p.symbol),
    [positions],
  );
  const periodOpens = usePeriodOpens(autoReferenceSymbols, referenceMode);
  const periodStartIso = getPeriodStart(referenceMode).toISOString();

  const toCurrency = (usd: number) => (currency === 'MXN' ? usd * rate : usd);
  const money = (usd: number) => formatMoney(toCurrency(usd), currency);
  const price = (usd: number) => formatPrice(toCurrency(usd), currency);

  const rows: RowMetrics[] = positions
    .map((p) => {
      const quantity = Number(p.quantity);
      const marketPrice = livePrices[p.symbol];
      let invested = 0;
      let refPrice: number | null;
      let date: string | null;
      let profit = 0;

      if (p.status === 'BOUGHT') {
        invested = Number(p.allocatedCapital);
        refPrice = Number(p.averageBuyPrice);
        date = p.lastOperationDate ?? p.trades[0]?.executedAt ?? null;
        profit = quantity * (marketPrice ?? refPrice) - invested;
      } else if (p.status === 'SOLD') {
        const lastSell = p.trades.find((t) => t.type === 'SELL');
        refPrice = p.referencePrice !== null ? Number(p.referencePrice) : lastSell ? Number(lastSell.price) : null;
        date = p.referenceDate ?? p.lastOperationDate;
      } else {
        refPrice = p.referencePrice !== null ? Number(p.referencePrice) : periodOpens[p.symbol] ?? null;
        date = p.referencePrice !== null ? p.referenceDate : (p.referenceDate ?? periodStartIso);
      }

      const percent = refPrice && marketPrice !== undefined ? (marketPrice - refPrice) / refPrice : null;
      return { position: p, status: p.status, quantity, invested, price: refPrice, date, marketPrice, percent, profit };
    })
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.position.symbol.localeCompare(b.position.symbol));

  let totalInvested = 0;
  let totalCurrentValue = 0;
  rows.filter((r) => r.status === 'BOUGHT').forEach((r) => {
    totalInvested += r.invested;
    totalCurrentValue += r.quantity * (r.marketPrice ?? r.price ?? 0);
  });
  const totalProfit = totalCurrentValue - totalInvested;
  const totalYield = totalInvested > 0 ? totalProfit / totalInvested : 0;
  // Efectivo disponible + valor de mercado de las monedas compradas (= dólares + invertido + ganancia)
  const totalBalance = usdBalance + totalCurrentValue;

  const changeCurrency = (value: Currency) => {
    setCurrency(value);
    writePref('crypto.currency', value);
  };

  const changeReferenceMode = (value: ReferenceMode) => {
    setReferenceMode(value);
    writePref('crypto.referenceMode', value);
  };

  const commitRate = () => {
    if (rateDraft === null) return;
    const value = Number(rateDraft);
    if (value > 0 && Math.abs(value - rate) > 1e-6) setOverride(Math.round(value * 10000) / 10000);
    setRateDraft(null);
  };

  const handleDelete = async (p: CryptoPosition) => {
    if (!window.confirm(`¿Quitar ${p.symbol} de tu lista? También se borra su historial de operaciones.`)) return;
    try {
      await axios.delete(`${API}/crypto/portfolio/${p.symbol}`, { headers: authHeaders() });
      toast.success(`${p.symbol} eliminada de tu lista`);
      setPositions((prev) => prev.filter((x) => x.symbol !== p.symbol));
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Error al eliminar la moneda'));
    }
  };

  const renderPercent = (r: RowMetrics) =>
    r.percent === null ? (
      <span className="text-text-muted">—</span>
    ) : (
      <span className={`font-bold ${r.percent >= 0 ? 'text-brand-green-light' : 'text-red-400'}`}>{formatPercent(r.percent)}</span>
    );

  const renderProfit = (r: RowMetrics) => (
    <span className={`font-bold ${r.status !== 'BOUGHT' ? 'text-text-muted' : r.profit >= 0 ? 'text-brand-green-light' : 'text-red-400'}`}>
      {money(r.profit)}
    </span>
  );

  const renderActions = (r: RowMetrics) =>
    r.quantity === 0 ? (
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => setWatchlistModal({ editing: r.position })} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated/60 transition-colors" aria-label={`Editar referencia de ${r.position.symbol}`} title="Editar precio de referencia">
          <Pencil size={14} />
        </button>
        <button onClick={() => handleDelete(r.position)} className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label={`Eliminar ${r.position.symbol}`} title="Eliminar de la lista">
          <Trash2 size={14} />
        </button>
      </div>
    ) : null;

  const emptyMessage = isLoading ? 'Cargando portafolio...' : 'Aún no tienes monedas. Registra una operación o enlista una moneda para seguirla.';

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ── Controles ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <SegmentedToggle ariaLabel="Divisa" value={currency} onChange={changeCurrency} options={[{ value: 'USD', label: 'USD' }, { value: 'MXN', label: 'MXN' }]} />

          <div className="inline-flex items-center gap-1 text-xs text-text-secondary bg-surface-card/60 border border-white/5 rounded-lg px-2.5 py-1.5">
            <span className="whitespace-nowrap">1 USD =</span>
            {rateDraft === null ? (
              <button onClick={() => setRateDraft(String(rate))} className="font-bold text-text-primary hover:text-brand-green-light inline-flex items-center gap-1 transition-colors" title="Editar tipo de cambio">
                ${rate.toFixed(2)} MXN <Pencil size={11} />
              </button>
            ) : (
              <input
                autoFocus
                type="number"
                step="0.0001"
                min="0"
                value={rateDraft}
                onChange={(e) => setRateDraft(e.target.value)}
                onBlur={commitRate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setRateDraft(null);
                }}
                aria-label="Tipo de cambio USD a MXN"
                className="w-20 bg-surface-base border border-surface-border rounded px-1.5 py-0.5 text-base sm:text-xs text-text-primary focus:outline-none focus:border-brand-green"
              />
            )}
            {isManual && rateDraft === null && (
              <button onClick={() => setOverride(null)} className="ml-1 text-text-muted hover:text-text-primary transition-colors" title="Restablecer al tipo de cambio de mercado" aria-label="Restablecer tipo de cambio">
                <RotateCcw size={12} />
              </button>
            )}
          </div>

          <SegmentedToggle ariaLabel="Referencia de seguimiento" value={referenceMode} onChange={changeReferenceMode} options={[{ value: 'DAY', label: 'Day (00:00)' }, { value: 'SWING', label: 'Swing (Lunes 00:00)' }]} />

          <button onClick={() => fetchLivePrices(positions)} disabled={isRefreshing} className="flex items-center gap-1 text-sm text-brand-green-light hover:text-brand-green-light/80 transition-colors px-1">
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            Actualizar precios
          </button>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
          <button onClick={() => setWatchlistModal({ editing: null })} className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-surface-elevated/70 hover:bg-surface-elevated text-text-primary text-sm font-bold rounded-xl border border-white/5 transition-all">
            <Eye size={16} /> Enlistar moneda
          </button>
          <button onClick={() => setIsTradeModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-brand-green hover:bg-brand-green-light text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-green/20">
            <Bitcoin size={16} /> Registrar operación
          </button>
        </div>
      </div>

      {/* ── KPIs (invertido y rendimiento: solo monedas compradas) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-surface-card/60 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/5 shadow-card flex flex-col">
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><DollarSign size={14} /> {currency === 'USD' ? 'Dólares' : 'Pesos MXN'}</h2>
          <p className="text-xl md:text-2xl font-bold text-text-primary tabular-nums truncate">{money(usdBalance)}</p>
          <button onClick={() => setIsCashModalOpen(true)} className="mt-2 self-start inline-flex items-center gap-1 text-xs font-bold text-brand-green-light hover:text-brand-green-light/80 transition-colors">
            <ArrowDownUp size={12} /> Depositar / Retirar
          </button>
        </div>

        <div className="bg-surface-card/60 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/5 shadow-card">
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Wallet size={14} /> Total Invertido</h2>
          <p className="text-xl md:text-2xl font-bold text-text-primary tabular-nums truncate">{money(totalInvested)}</p>
        </div>

        <div className="bg-surface-card/60 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/5 shadow-card">
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><PieChartIcon size={14} /> Saldo Total</h2>
          <p className="text-xl md:text-2xl font-bold text-text-primary tabular-nums truncate">{money(totalBalance)}</p>
        </div>

        <div className={`p-4 md:p-5 rounded-2xl border backdrop-blur-md shadow-card ${totalProfit >= 0 ? 'bg-brand-green/[6%] border-brand-green/20' : 'bg-red-500/[6%] border-red-500/20'}`}>
          <h2 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${totalProfit >= 0 ? 'text-brand-green-light' : 'text-red-400'}`}>Rendimiento</h2>
          <p className={`text-xl md:text-3xl font-extrabold ${totalProfit >= 0 ? 'text-brand-green-light' : 'text-red-400'}`}>
            {formatPercent(totalYield)}
          </p>
          <p className={`text-xs font-medium mt-1 ${totalProfit >= 0 ? 'text-brand-green-light/70' : 'text-red-400/70'}`}>
            {money(totalProfit)}
          </p>
        </div>
      </div>

      {/* ── Posiciones: tarjetas apiladas (móvil) ── */}
      <div className="md:hidden space-y-3">
        {rows.length === 0 ? (
          <div className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-6 text-center text-sm text-text-muted">{emptyMessage}</div>
        ) : (
          rows.map((r) => (
            <div key={r.position.symbol} className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 font-bold text-text-primary min-w-0">
                  <CoinIcon symbol={r.position.symbol} size="md" />
                  <span className="truncate">{r.position.symbol}</span>
                  <StatusBadge status={r.status} />
                </div>
                {renderActions(r)}
              </div>

              <div className="flex items-end justify-between gap-3 pb-3 mb-3 border-b border-white/5">
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">Precio de mercado</p>
                  <p className="text-xl font-bold text-text-primary truncate">{r.marketPrice !== undefined ? price(r.marketPrice) : '...'}</p>
                </div>
                <span className="shrink-0">{renderPercent(r)}</span>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="min-w-0">
                  <dt className="text-xs text-text-muted">{r.status === 'BOUGHT' ? 'Precio promedio' : r.status === 'SOLD' ? 'Precio de venta' : 'Precio de referencia'}</dt>
                  <dd className="text-text-primary truncate">{r.price !== null ? price(r.price) : '...'}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-text-muted">Invertido</dt>
                  <dd className="text-text-primary truncate">{money(r.invested)}</dd>
                  <dd className="text-xs text-text-muted truncate">{formatTokens(r.quantity)} {r.position.symbol}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-text-muted">Ganancia</dt>
                  <dd className="truncate">{renderProfit(r)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-text-muted">Fecha</dt>
                  <dd className="text-text-secondary truncate">{r.date ? formatShortDate(r.date) : '—'}</dd>
                </div>
              </dl>
            </div>
          ))
        )}
      </div>

      {/* ── Posiciones: tabla (md+) ── */}
      <div className="hidden md:block bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr className="bg-surface-base/50 text-text-primary uppercase tracking-wider border-b border-surface-border">
                <th className="p-4 font-semibold">Moneda</th>
                <th className="p-4 font-semibold text-right">Precio</th>
                <th className="p-4 font-semibold text-right">Invertido</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Fecha</th>
                <th className="p-4 font-semibold text-right bg-surface-base/80">Precio de mercado</th>
                <th className="p-4 font-semibold text-right">%</th>
                <th className="p-4 font-semibold text-right">Ganancia</th>
                <th className="p-4 w-px"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-text-muted">{emptyMessage}</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.position.symbol} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="p-4 font-bold text-text-primary">
                      <div className="flex items-center gap-2">
                        <CoinIcon symbol={r.position.symbol} size="sm" />
                        {r.position.symbol}
                      </div>
                    </td>
                    <td className="p-4 text-right text-text-primary tabular-nums">{r.price !== null ? price(r.price) : '...'}</td>
                    <td className="p-4 text-right tabular-nums">
                      <div className="text-text-primary">{money(r.invested)}</div>
                      <div className="text-xs text-text-muted">{formatTokens(r.quantity)} {r.position.symbol}</div>
                    </td>
                    <td className="p-4"><StatusBadge status={r.status} /></td>
                    <td className="p-4 text-right text-text-secondary">{r.date ? formatShortDate(r.date) : '—'}</td>
                    <td className="p-4 text-right font-bold text-text-primary bg-surface-base/30 tabular-nums">
                      {r.marketPrice !== undefined ? price(r.marketPrice) : '...'}
                    </td>
                    <td className="p-4 text-right tabular-nums">{renderPercent(r)}</td>
                    <td className="p-4 text-right tabular-nums">{renderProfit(r)}</td>
                    <td className="p-2 pr-4">{renderActions(r)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isTradeModalOpen && (
        <RegisterTradeModal positions={positions} usdBalance={usdBalance} onClose={() => setIsTradeModalOpen(false)} onSaved={loadPortfolio} />
      )}
      {isCashModalOpen && (
        <CashMovementModal usdBalance={usdBalance} marketRate={rate} onClose={() => setIsCashModalOpen(false)} onSaved={loadPortfolio} />
      )}
      {watchlistModal && (
        <WatchlistModal
          positions={positions}
          referenceMode={referenceMode}
          editing={watchlistModal.editing}
          onClose={() => setWatchlistModal(null)}
          onSaved={loadPortfolio}
        />
      )}
    </div>
  );
}
