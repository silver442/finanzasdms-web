import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Bitcoin, RefreshCw, TrendingUp, TrendingDown, Minus, X, Wallet, PieChart as PieChartIcon } from 'lucide-react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

interface CryptoTrade {
  id: string;
  type: 'BUY' | 'SELL';
  source: 'MANUAL' | 'AUTOMATED';
  quantity: string;
  price: string;
  total: string;
  executedAt: string;
}

interface CryptoPosition {
  symbol: string;
  quantity: string;
  averageBuyPrice: string;
  allocatedCapital: string;
  trades: CryptoTrade[];
}

type MarketState = 'LATERAL' | 'ALCISTA' | 'BAJISTA';

interface TrendAnalysis {
  symbol: string;
  marketState: MarketState;
}

interface CryptoAlertPayload {
  symbol: string;
  marketState: MarketState;
  type: 'BUY' | 'SELL' | 'SUPPORT';
  stepPercent: number | null;
  currentPrice: number;
  breakEven: number;
  diagnosis: string | null;
  message: string;
}

const TREND_BADGE_STYLES: Record<MarketState, string> = {
  ALCISTA: 'bg-brand-green/20 text-brand-green-light',
  LATERAL: 'bg-surface-elevated text-text-muted',
  BAJISTA: 'bg-red-500/20 text-red-400',
};

const TREND_ICONS: Record<MarketState, typeof TrendingUp> = {
  ALCISTA: TrendingUp,
  LATERAL: Minus,
  BAJISTA: TrendingDown,
};

const POPULAR_COINS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'ADA', 'AVAX', 'DOGE', 'DOT', 'LINK', 'MATIC', 'SHIB', 'UNI', 'PEPE', 'ONDO', 'SUI', 'VIRTUAL', 'AAVE', 'HBAR', 'PENGU'];

export default function Crypto() {
  const [positions, setPositions] = useState<CryptoPosition[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [trends, setTrends] = useState<Record<string, MarketState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newOp, setNewOp] = useState({
    symbol: '',
    type: 'BUY' as 'BUY' | 'SELL',
    price: '',
    totalUsd: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
  });
  // Campo que el usuario editó por última vez entre Total USD y Cantidad — el otro se recalcula solo
  const [lastEditedField, setLastEditedField] = useState<'totalUsd' | 'quantity' | null>(null);

  const CRYPTO_API_KEY = import.meta.env.VITE_CRYPTO_API_KEY;

  const fetchPortfolio = useCallback(async () => {
    try {
      const { data } = await axios.get<CryptoPosition[]>(`${API}/crypto/portfolio`, { headers: authHeaders() });
      setPositions(data);
      return data;
    } catch {
      toast.error('Error al cargar tu portafolio');
      return [];
    }
  }, []);

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

  const fetchTrends = useCallback(async () => {
    try {
      const { data } = await axios.get<TrendAnalysis[]>(`${API}/crypto/trend`, { headers: authHeaders() });
      const map: Record<string, MarketState> = {};
      data.forEach((t) => { map[t.symbol] = t.marketState; });
      setTrends(map);
    } catch {
      // La tendencia es informativa; si CryptoCompare falla no debe romper el dashboard
    }
  }, []);

  const loadAll = useCallback(async () => {
    const data = await fetchPortfolio();
    await Promise.all([fetchLivePrices(data), fetchTrends()]);
  }, [fetchPortfolio, fetchLivePrices, fetchTrends]);

  useEffect(() => {
    setIsLoading(true);
    loadAll().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Conexión WebSocket para alertas del bot Grid/DCA en tiempo real (usuarios Premium)
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(`${API}/crypto`, { auth: { token } });
    socketRef.current = socket;

    socket.on('crypto-alert', (payload: CryptoAlertPayload) => {
      if (payload.type === 'SUPPORT') {
        toast.info(payload.message);
      } else if (payload.type === 'BUY') {
        toast.success(payload.message);
      } else {
        toast.warning(payload.message);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleRefreshPrices = () => fetchLivePrices(positions);

  const round8 = (n: number) => Math.round(n * 1e8) / 1e8;

  const handlePriceChange = (value: string) => {
    const price = parseFloat(value);
    if (lastEditedField === 'quantity') {
      const quantity = parseFloat(newOp.quantity);
      const totalUsd = price > 0 && quantity > 0 ? (price * quantity).toFixed(2) : '';
      setNewOp({ ...newOp, price: value, totalUsd });
    } else if (lastEditedField === 'totalUsd') {
      const totalUsd = parseFloat(newOp.totalUsd);
      const quantity = price > 0 && totalUsd > 0 ? String(round8(totalUsd / price)) : '';
      setNewOp({ ...newOp, price: value, quantity });
    } else {
      setNewOp({ ...newOp, price: value });
    }
  };

  const handleTotalChange = (value: string) => {
    setLastEditedField('totalUsd');
    const price = parseFloat(newOp.price);
    const totalUsd = parseFloat(value);
    const quantity = price > 0 && totalUsd > 0 ? String(round8(totalUsd / price)) : '';
    setNewOp({ ...newOp, totalUsd: value, quantity });
  };

  const handleQuantityChange = (value: string) => {
    setLastEditedField('quantity');
    const price = parseFloat(newOp.price);
    const quantity = parseFloat(value);
    const totalUsd = price > 0 && quantity > 0 ? (price * quantity).toFixed(2) : '';
    setNewOp({ ...newOp, quantity: value, totalUsd });
  };

  const ownedCoins = positions.filter((p) => Number(p.quantity) > 0).map((p) => p.symbol);
  const availableQuantity = positions.find((p) => p.symbol === newOp.symbol.toUpperCase())?.quantity;
  const opPrice = parseFloat(newOp.price);
  const opQuantity = parseFloat(newOp.quantity);
  const opTotal = parseFloat(newOp.totalUsd);
  const mathIsConsistent =
    opPrice > 0 && opQuantity > 0 && opTotal > 0 && Math.abs(opPrice * opQuantity - opTotal) / opTotal < 0.005;
  const exceedsBalance = newOp.type === 'SELL' && availableQuantity !== undefined && opQuantity > Number(availableQuantity);
  const canSubmit = !!newOp.symbol && mathIsConsistent && !exceedsBalance;

  const handleAddOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseFloat(newOp.quantity);
    const price = parseFloat(newOp.price);
    if (!canSubmit) {
      toast.error(exceedsBalance ? 'No tienes suficiente saldo de esta moneda para vender' : 'Revisa los datos capturados: el precio, total y cantidad no cuadran');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${API}/crypto/trades/manual`,
        {
          symbol: newOp.symbol.toUpperCase().trim(),
          type: newOp.type,
          quantity,
          price,
          executedAt: newOp.date,
        },
        { headers: authHeaders() },
      );
      toast.success(`Operación de ${newOp.type === 'BUY' ? 'compra' : 'venta'} registrada`);
      setIsModalOpen(false);
      setLastEditedField(null);
      setNewOp({ symbol: '', type: 'BUY', price: '', totalUsd: '', quantity: '', date: new Date().toISOString().split('T')[0] });
      const data = await fetchPortfolio();
      fetchLivePrices(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al registrar la operación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(amount);
  const formatPercent = (percent: number) => new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 2 }).format(percent);
  const formatShortDate = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  let totalInvested = 0;
  let totalCurrentValue = 0;
  positions.forEach((p) => {
    const invested = Number(p.allocatedCapital);
    const quantity = Number(p.quantity);
    const currentPrice = livePrices[p.symbol] ?? Number(p.averageBuyPrice);
    totalInvested += invested;
    totalCurrentValue += quantity * currentPrice;
  });
  const totalProfit = totalCurrentValue - totalInvested;
  const totalYield = totalInvested > 0 ? totalProfit / totalInvested : 0;

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto relative">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-green-light flex items-center gap-3">
            <Bitcoin size={32} />
            Portafolio Cripto
          </h1>
          <div className="flex gap-4 mt-2 text-sm">
            <button onClick={handleRefreshPrices} disabled={isRefreshing} className="flex items-center gap-1 text-brand-green-light hover:text-brand-green-light transition-colors">
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              Actualizar precios
            </button>
          </div>
        </div>

        <button
          onClick={() => { setNewOp({ symbol: '', type: 'BUY', price: '', totalUsd: '', quantity: '', date: new Date().toISOString().split('T')[0] }); setLastEditedField(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2 bg-brand-green hover:bg-brand-green-light text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-green/20"
        >
          <Bitcoin size={18} /> Registrar operación
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-card/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-card">
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Wallet size={14} /> Total Invertido</h2>
          <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalInvested)}</p>
        </div>

        <div className="bg-surface-card/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-card">
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><PieChartIcon size={14} /> Valor Actual</h2>
          <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalCurrentValue)}</p>
        </div>

        <div className={`p-5 rounded-2xl border backdrop-blur-md shadow-card ${totalProfit >= 0 ? 'bg-brand-green/[6%] border-brand-green/20' : 'bg-red-500/[6%] border-red-500/20'}`}>
          <h2 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${totalProfit >= 0 ? 'text-brand-green-light' : 'text-red-400'}`}>Rendimiento</h2>
          <p className={`text-3xl font-extrabold ${totalProfit >= 0 ? 'text-brand-green-light' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatPercent(totalYield)}
          </p>
          <p className={`text-xs font-medium mt-1 ${totalProfit >= 0 ? 'text-brand-green-light/70' : 'text-red-400/70'}`}>
            {formatCurrency(totalProfit)}
          </p>
        </div>
      </div>

      <div className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr className="bg-surface-base/50 text-text-primary uppercase tracking-wider border-b border-surface-border">
                <th className="p-4 font-semibold">Moneda</th>
                <th className="p-4 font-semibold">Tendencia</th>
                <th className="p-4 font-semibold text-right">Cantidad</th>
                <th className="p-4 font-semibold text-right">
                  <div className="flex flex-col items-end">
                    <span>Precio Promedio</span>
                    <span className="text-xs text-text-muted normal-case tracking-normal font-normal">(Break-even)</span>
                  </div>
                </th>
                <th className="p-4 font-semibold text-right bg-surface-base/80">Precio Actual</th>
                <th className="p-4 font-semibold text-right">
                  <div className="flex flex-col items-end">
                    <span>% Rendimiento</span>
                    <span className="text-xs text-text-muted normal-case tracking-normal font-normal">(vs. Break-even)</span>
                  </div>
                </th>
                <th className="p-4 font-semibold text-right">Ganancia (USD)</th>
                <th className="p-4 font-semibold text-right">Última Operación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={8} className="p-6 text-center text-text-muted">Cargando portafolio...</td></tr>
              ) : positions.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-text-muted">Aún no tienes operaciones registradas</td></tr>
              ) : (
                positions.map((p) => {
                  const quantity = Number(p.quantity);
                  const averageBuyPrice = Number(p.averageBuyPrice);
                  const invested = Number(p.allocatedCapital);
                  const currentPrice = livePrices[p.symbol] ?? averageBuyPrice;
                  const currentValue = quantity * currentPrice;
                  const profit = currentValue - invested;
                  const percentChange = averageBuyPrice > 0 ? (currentPrice - averageBuyPrice) / averageBuyPrice : 0;
                  const isPositive = profit >= 0;
                  const lastTrade = p.trades[0];
                  const trend = trends[p.symbol];
                  const TrendIcon = trend ? TREND_ICONS[trend] : null;

                  return (
                    <tr key={p.symbol} className="hover:bg-surface-elevated/30 transition-colors">
                      <td className="p-4 font-bold text-text-primary flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-xs text-brand-green-light">
                          {p.symbol.charAt(0)}
                        </div>
                        {p.symbol}
                      </td>
                      <td className="p-4">
                        {trend && TrendIcon ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${TREND_BADGE_STYLES[trend]}`}>
                            <TrendIcon size={12} />
                            {trend}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right text-text-primary">{quantity}</td>
                      <td className="p-4 text-right text-text-primary">{formatCurrency(averageBuyPrice)}</td>
                      <td className="p-4 text-right font-bold text-text-primary bg-surface-base/30">
                        {livePrices[p.symbol] ? formatCurrency(currentPrice) : '...'}
                      </td>
                      <td className={`p-4 text-right font-bold ${isPositive ? 'text-brand-green-light' : 'text-red-400'}`}>
                        <span className="inline-flex items-center gap-1">
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {formatPercent(percentChange)}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-bold ${isPositive ? 'text-brand-green-light' : 'text-red-400'}`}>
                        {formatCurrency(profit)}
                      </td>
                      <td className="p-4 text-right text-text-secondary">
                        {lastTrade ? formatShortDate(lastTrade.executedAt) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-card w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Bitcoin className="text-brand-green" /> Registrar operación
              </h2>
              <button onClick={() => { setIsModalOpen(false); setLastEditedField(null); }} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddOperation} className="space-y-4">
              <div className="flex bg-surface-base rounded-lg p-1 border border-surface-border">
                <button type="button" onClick={() => { setNewOp({ ...newOp, type: 'BUY', symbol: '' }); setLastEditedField(null); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newOp.type === 'BUY' ? 'bg-brand-green text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}>Compra</button>
                <button type="button" onClick={() => { setNewOp({ ...newOp, type: 'SELL', symbol: '' }); setLastEditedField(null); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newOp.type === 'SELL' ? 'bg-red-500 text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}>Venta</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-text-secondary text-sm font-medium mb-1">Moneda (Ticker)</label>
                  {newOp.type === 'SELL' ? (
                    <select
                      required
                      value={newOp.symbol}
                      onChange={(e) => setNewOp({ ...newOp, symbol: e.target.value })}
                      className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500 appearance-none"
                    >
                      <option value="" disabled>Selecciona...</option>
                      {ownedCoins.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Ej. SOL"
                        required
                        value={newOp.symbol}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onChange={(e) => setNewOp({ ...newOp, symbol: e.target.value.toUpperCase() })}
                        className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-green uppercase"
                      />
                      {showSuggestions && newOp.symbol && (
                        <div className="absolute z-10 w-full mt-1 bg-surface-card border border-surface-border rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                          {POPULAR_COINS.filter((c) => c.includes(newOp.symbol)).map((c) => (
                            <div
                              key={c}
                              onClick={() => setNewOp({ ...newOp, symbol: c })}
                              className="px-4 py-2 hover:bg-surface-elevated cursor-pointer text-sm font-medium"
                            >
                              {c}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">Fecha</label>
                  <input type="date" required value={newOp.date} onChange={(e) => setNewOp({ ...newOp, date: e.target.value })} className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-green [&::-webkit-calendar-picker-indicator]:invert" />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-medium mb-1">Precio de la Moneda (USD)</label>
                <input type="number" step="0.00000001" placeholder="0.00" required value={newOp.price} onChange={(e) => handlePriceChange(e.target.value)} className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-green" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">Total a {newOp.type === 'BUY' ? 'Invertir' : 'Vender'} (USD)</label>
                  <input type="number" step="0.01" placeholder="0.00" required value={newOp.totalUsd} onChange={(e) => handleTotalChange(e.target.value)} className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-green" />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">Cantidad de Cripto</label>
                  <input type="number" step="0.00000001" placeholder="0.00000000" required value={newOp.quantity} onChange={(e) => handleQuantityChange(e.target.value)} className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-green" />
                </div>
              </div>

              {newOp.type === 'SELL' && availableQuantity !== undefined && (
                <p className={`text-xs ${exceedsBalance ? 'text-red-400' : 'text-text-muted'}`}>
                  Disponible: {availableQuantity} {newOp.symbol.toUpperCase()}
                </p>
              )}
              {newOp.price && newOp.totalUsd && newOp.quantity && !mathIsConsistent && (
                <p className="text-xs text-red-400">Los números no cuadran: precio × cantidad debe ser igual al total en USD.</p>
              )}

              <div className="flex gap-4 mt-8 pt-4 border-t border-surface-border">
                <button type="button" onClick={() => { setIsModalOpen(false); setLastEditedField(null); }} className="flex-1 bg-surface-elevated hover:bg-surface-elevated text-text-primary py-2.5 rounded-xl transition-all font-medium">Cancelar</button>
                <button type="submit" disabled={isSubmitting || !canSubmit} className={`flex-1 text-white py-2.5 rounded-xl transition-all font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${newOp.type === 'BUY' ? 'bg-brand-green hover:bg-brand-green-light shadow-brand-green/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}>
                  {isSubmitting ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
