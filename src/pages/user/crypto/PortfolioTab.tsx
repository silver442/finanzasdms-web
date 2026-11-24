import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeftRight, CircleDollarSign, Coins, Eye, Layers, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import axios from 'axios';
import type { CryptoPosition, PortfolioResponse, PositionStatus, ReferenceMode } from './types';
import { API, apiErrorMessage, authHeaders } from './utils/api';
import { formatMoney, formatPercent, formatPrice, formatShortDate, formatTokens } from './utils/format';
import { getPeriodStart } from './utils/periods';
import { readPref, writePref } from './utils/storage';
import { useCurrency } from './hooks/useCurrency';
import { CurrencyControls } from './components/CurrencyControls';
import { SegmentedToggle } from './components/SegmentedToggle';
import { usePeriodOpens } from './hooks/usePeriodOpens';
import RegisterTradeModal from './RegisterTradeModal';
import WatchlistModal from './WatchlistModal';
import CashMovementModal from './CashMovementModal';
import CoinIcon from './components/CoinIcon';
import PortfolioValueCard from './components/PortfolioValueCard';
import PortfolioDistributionCard from './components/PortfolioDistributionCard';
import DangerConfirmModal from './components/DangerConfirmModal';
import { usePortfolioHistory } from './hooks/usePortfolioHistory';

const STATUS_ORDER: Record<PositionStatus, number> = { BOUGHT: 0, WATCHLIST: 1, SOLD: 2 };

const STATUS_BADGE: Record<PositionStatus, { label: string; className: string }> = {
  BOUGHT: { label: 'Comprado', className: 'bg-brand-green/15 text-brand-green-light border border-brand-green/30' },
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

function StatusBadge({ status }: { status: PositionStatus }) {
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[status].className}`}>{STATUS_BADGE[status].label}</span>
  );
}

export default function PortfolioTab() {
  const [positions, setPositions] = useState<CryptoPosition[]>([]);
  const [usdBalance, setUsdBalance] = useState(0);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>(() => readPref('crypto.referenceMode', ['DAY', 'SWING'] as const, 'DAY'));
  const [tradeModal, setTradeModal] = useState<{ symbol?: string; price?: number } | null>(null);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [watchlistModal, setWatchlistModal] = useState<{ editing: CryptoPosition | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CryptoPosition | null>(null);
  const [isDangerSubmitting, setIsDangerSubmitting] = useState(false);

  const fx = useCurrency();
  const { currency, rate, toView: toCurrency } = fx;

  const fetchLivePrices = useCallback(async (coinList: CryptoPosition[]) => {
    if (coinList.length === 0) {
      setLivePrices({});
      return;
    }
    setIsRefreshing(true);
    try {
      // El backend consulta Bitget (CryptoCompare de respaldo) y devuelve { BTC: 60797.89, ... } en USD
      const symbols = Array.from(new Set(coinList.map((p) => p.symbol))).join(',');
      const { data } = await axios.get<Record<string, number>>(`${API}/market/prices`, { params: { symbols }, headers: authHeaders() });
      setLivePrices(data);
    } catch {
      toast.error('Error al conectar con el mercado');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

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

  const boughtRows = rows.filter((r) => r.status === 'BOUGHT');
  const valueHistory = usePortfolioHistory(boughtRows.map((r) => ({ symbol: r.position.symbol, quantity: r.quantity })));
  // El histórico solo trae las monedas: se suma el efectivo actual para que la curva termine en el valor del portafolio
  const chartHistory = valueHistory.map((h) => ({ time: h.time, value: toCurrency(h.value + usdBalance) }));
  const distribution = boughtRows.map((r) => ({ symbol: r.position.symbol, value: r.quantity * (r.marketPrice ?? r.price ?? 0) }));

  const changeReferenceMode = (value: ReferenceMode) => {
    setReferenceMode(value);
    writePref('crypto.referenceMode', value);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { symbol } = deleteTarget;
    setIsDangerSubmitting(true);
    try {
      await axios.delete(`${API}/crypto/portfolio/${symbol}`, { headers: authHeaders() });
      toast.success(`${symbol} eliminada de tu portafolio`);
      setPositions((prev) => prev.filter((x) => x.symbol !== symbol));
      setDeleteTarget(null);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Error al eliminar la moneda'));
    } finally {
      setIsDangerSubmitting(false);
    }
  };



  const renderPercent = (r: RowMetrics) =>
    r.percent === null ? (
      <span className="text-text-muted">—</span>
    ) : (
      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold border ${r.percent >= 0 ? 'bg-brand-green/15 border-brand-green/40 text-brand-green-light' : 'bg-red-500/15 border-red-500/40 text-red-400'}`}>{formatPercent(r.percent)}</span>
    );

  const renderProfit = (r: RowMetrics) => (
    <span className={`font-bold text-base ${r.status !== 'BOUGHT' ? 'text-text-muted' : r.profit >= 0 ? 'text-brand-green-light' : 'text-red-400'}`}>
      {r.status === 'BOUGHT' && r.profit > 0 ? '+' : ''}{money(r.profit)}
    </span>
  );

  const renderActions = (r: RowMetrics) => (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {r.quantity === 0 && (
        <button onClick={() => setWatchlistModal({ editing: r.position })} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated/60 transition-colors" aria-label={`Editar referencia de ${r.position.symbol}`} title="Editar precio de referencia">
          <Pencil size={14} />
        </button>
      )}
      <button onClick={() => setDeleteTarget(r.position)} className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label={`Eliminar ${r.position.symbol}`} title="Eliminar moneda e historial">
        <Trash2 size={14} />
      </button>
    </div>
  );

  const openTradeFor = (r: RowMetrics) => setTradeModal({ symbol: r.position.symbol, price: r.marketPrice });

  // Fila/tarjeta clicable: abre el registro de compra o venta con la moneda precargada
  const rowTradeProps = (r: RowMetrics) => ({
    role: 'button',
    tabIndex: 0,
    title: `Registrar operación de ${r.position.symbol}`,
    onClick: () => openTradeFor(r),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openTradeFor(r);
      }
    },
  });

  const investmentsHeader = (
    <div className="flex items-center justify-between gap-3 mb-4 px-1">
      <h2 className="flex items-center gap-3 text-xl font-bold text-white">
        <Layers size={24} className="text-brand-green-light" /> Mis Inversiones
      </h2>
      <button onClick={() => fetchLivePrices(positions)} disabled={isRefreshing} className="flex items-center gap-1.5 text-sm font-medium text-brand-green-light hover:text-brand-green-light/80 hover:bg-brand-green/10 rounded-lg transition-colors px-2 py-1.5 whitespace-nowrap disabled:opacity-60">
        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        Actualizar precios
      </button>
    </div>
  );

  const emptyMessage = isLoading ? 'Cargando portafolio...' : 'Aún no tienes monedas. Registra una operación o enlista una moneda para seguirla.';

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ── Controles ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <CurrencyControls {...fx} />

          <span className="hidden sm:block w-px h-8 bg-white/10" aria-hidden="true" />

          <SegmentedToggle ariaLabel="Referencia de seguimiento" value={referenceMode} onChange={changeReferenceMode} options={[{ value: 'DAY', label: 'Day (00:00)' }, { value: 'SWING', label: 'Swing (Lunes 00:00)' }]} />

        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button onClick={() => setWatchlistModal({ editing: null })} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-card/60 hover:bg-surface-elevated text-text-primary text-sm font-semibold rounded-xl border border-white/10 transition-all whitespace-nowrap">
            <Eye size={16} /> Enlistar moneda
          </button>
          <button onClick={() => setTradeModal({})} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-green hover:bg-brand-green-light text-white text-sm font-bold rounded-xl border border-brand-green-light/40 transition-all shadow-lg shadow-brand-green/30 whitespace-nowrap">
            <Plus size={18} /> Registrar operación
          </button>
        </div>
      </div>

      {/* ── KPIs (invertido y rendimiento: solo monedas compradas) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-5">
          <PortfolioValueCard
            currency={currency}
            formattedValue={money(totalBalance)}
            formattedProfit={money(totalProfit)}
            profit={totalProfit}
            yieldRatio={totalYield}
            history={chartHistory}
          />
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6">
          <div className="bg-surface-card/60 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/5 shadow-card flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-brand-green/15 border border-brand-green/20 flex items-center justify-center text-brand-green-light">
              <Coins size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm text-text-secondary">Total Invertido</h2>
              <p className="text-xl md:text-2xl font-bold text-white tabular-nums truncate">
                {money(totalInvested)} <span className="text-sm font-medium text-text-secondary">{currency}</span>
              </p>
            </div>
          </div>

          <div className="bg-surface-card/60 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/5 shadow-card flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-brand-green/15 border border-brand-green/20 flex items-center justify-center text-brand-green-light">
              <CircleDollarSign size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm text-text-secondary">Disponible ({currency})</h2>
              <p className="text-xl md:text-2xl font-bold text-white tabular-nums truncate">
                {money(usdBalance)} <span className="text-sm font-medium text-text-secondary">{currency}</span>
              </p>
              <button onClick={() => setIsCashModalOpen(true)} className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-brand-green-light hover:text-brand-green-light/80 transition-colors">
                <ArrowLeftRight size={14} /> Depositar / Retirar
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <PortfolioDistributionCard slices={distribution} currency={currency} formattedTotal={money(totalCurrentValue)} />
        </div>
      </div>

      {/* ── Posiciones: tarjetas apiladas (móvil) ── */}
      <div className="md:hidden space-y-3">
        {investmentsHeader}
        {rows.length === 0 ? (
          <div className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-6 text-center text-sm text-text-muted">{emptyMessage}</div>
        ) : (
          rows.map((r) => (
            <div key={r.position.symbol} {...rowTradeProps(r)} className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-4 cursor-pointer hover:border-brand-green/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50 transition-colors">
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
      <div className="hidden md:block bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card p-4 lg:p-5">
        {investmentsHeader}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr className="bg-surface-base/40 text-text-primary text-xs uppercase tracking-wider border-b border-white/5">
                <th className="p-4 font-semibold">Moneda</th>
                <th className="p-4 font-semibold text-right">Precio</th>
                <th className="p-4 font-semibold text-right">Invertido</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-center">Fecha</th>
                <th className="p-4 font-semibold text-right">Precio de mercado</th>
                <th className="p-4 font-semibold text-center">Rendimiento</th>
                <th className="p-4 font-semibold text-right">Ganancia</th>
                <th className="p-4 w-px"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-text-muted">{emptyMessage}</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.position.symbol} {...rowTradeProps(r)} className="cursor-pointer hover:bg-surface-elevated/40 focus:outline-none focus-visible:bg-surface-elevated/40 transition-colors">
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-3">
                        <CoinIcon symbol={r.position.symbol} size="md" />
                        {r.position.symbol}
                      </div>
                    </td>
                    <td className="p-4 text-right text-text-primary tabular-nums">{r.price !== null ? price(r.price) : '...'}</td>
                    <td className="p-4 text-right tabular-nums">
                      <div className="text-text-primary">{money(r.invested)}</div>
                      <div className="text-xs text-text-muted">{formatTokens(r.quantity)} {r.position.symbol}</div>
                    </td>
                    <td className="p-4"><StatusBadge status={r.status} /></td>
                    <td className="p-4 text-center text-text-secondary">{r.date ? formatShortDate(r.date) : '—'}</td>
                    <td className="p-4 text-right font-bold text-white tabular-nums">
                      {r.marketPrice !== undefined ? price(r.marketPrice) : '...'}
                    </td>
                    <td className="p-4 text-center tabular-nums">{renderPercent(r)}</td>
                    <td className="p-4 text-right tabular-nums">{renderProfit(r)}</td>
                    <td className="p-2 pr-4">{renderActions(r)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {tradeModal && (
        <RegisterTradeModal
          positions={positions}
          usdBalance={usdBalance}
          initialSymbol={tradeModal.symbol}
          initialPrice={tradeModal.price}
          onClose={() => setTradeModal(null)}
          onSaved={loadPortfolio}
        />
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
      {deleteTarget && (
        <DangerConfirmModal
          title={`¿Eliminar ${deleteTarget.symbol}?`}
          confirmLabel="Sí, eliminar"
          isSubmitting={isDangerSubmitting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        >
          <p>
            Se eliminará <span className="font-semibold text-text-primary">{deleteTarget.symbol}</span> de tu portafolio junto con todo su historial de operaciones. Esta acción no se puede deshacer.
          </p>
          {Number(deleteTarget.quantity) > 0 && (
            <p className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-300">
              Aún tienes {formatTokens(Number(deleteTarget.quantity))} {deleteTarget.symbol} comprados ({money(Number(deleteTarget.allocatedCapital))} invertidos).
            </p>
          )}
          <p className="text-text-muted">Tu saldo disponible en dólares no cambia.</p>
        </DangerConfirmModal>
      )}
    </div>
  );
}
