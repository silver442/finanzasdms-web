/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Bitcoin, RefreshCw, TrendingUp, TrendingDown, X, Wallet, DollarSign, PieChart as PieChartIcon, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import axios from 'axios';

interface CryptoAsset {
  id: string;
  coin: string;
  buyPriceUSD: number;
  investedUSD: number;
  status: 'Comprado' | 'Vendido';
  date: string;
}

const POPULAR_COINS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'ADA', 'AVAX', 'DOGE', 'DOT', 'LINK', 'MATIC', 'SHIB', 'UNI', 'PEPE', 'ONDO', 'SUI', 'VIRTUAL', 'AAVE', 'HBAR', 'PENGU'];

export default function Crypto() {
  const [globalDepositMXN, setGlobalDepositMXN] = useState<number>(80000);
  const [usdtBalance, setUsdtBalance] = useState<number>(2363.44);

  const [assets, setAssets] = useState<CryptoAsset[]>([
    { id: '1', coin: 'ETH', buyPriceUSD: 2297, investedUSD: 500, status: 'Comprado', date: '2026-05-09' },
    { id: '2', coin: 'BTC', buyPriceUSD: 77960, investedUSD: 0, status: 'Vendido', date: '2026-04-17' },
    { id: '3', coin: 'ONDO', buyPriceUSD: 0.4215, investedUSD: 200, status: 'Comprado', date: '2026-05-08' },
    { id: '4', coin: 'SUI', buyPriceUSD: 0.962, investedUSD: 0, status: 'Vendido', date: '2026-05-05' },
  ]);

  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [usdToMxn, setUsdToMxn] = useState<number>(17.17);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newOp, setNewOp] = useState({
    coin: '',
    buyPriceUSD: '',
    investedUSD: '',
    status: 'Comprado' as 'Comprado' | 'Vendido',
    date: new Date().toISOString().split('T')[0]
  });

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferType, setTransferType] = useState<'Depositar' | 'Retirar'>('Depositar');
  const [transferAmount, setTransferAmount] = useState('');

  const CRYPTO_API_KEY = "e0b7f598c999c2d9a4484c0c6c12e90f9047d90c6ab4d8ed0cde4da857dea374";
  const FX_API_KEY = "5e4543e870e938dbae331eef";

  const fetchLiveMarketData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fxRes = await axios.get(`https://v6.exchangerate-api.com/v6/${FX_API_KEY}/latest/USD`);
      setUsdToMxn(fxRes.data.conversion_rates.MXN);

      if (assets.length === 0) {
        setIsRefreshing(false);
        return;
      }

      const uniqueCoins = Array.from(new Set(assets.map(a => a.coin))).join(',');
      const cryptoRes = await axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${uniqueCoins}&tsyms=USD&api_key=${CRYPTO_API_KEY}`);
      
      const newPrices: Record<string, number> = {};
      if (cryptoRes.data) {
        Object.keys(cryptoRes.data).forEach(coin => {
          if (cryptoRes.data[coin] && cryptoRes.data[coin].USD) {
            newPrices[coin] = cryptoRes.data[coin].USD;
          }
        });
      }
      setLivePrices(newPrices);
    } catch (error) {
      console.error(error);
      toast.error('Error al conectar con el mercado');
    } finally {
      setIsRefreshing(false);
    }
  }, [assets]); 

  useEffect(() => {
    fetchLiveMarketData();
  }, [fetchLiveMarketData]);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amountUSD = parseFloat(transferAmount) || 0;
    
    if (amountUSD <= 0) return;

    if (transferType === 'Depositar') {
      setUsdtBalance(prev => prev + amountUSD);
      setGlobalDepositMXN(prev => prev + (amountUSD * usdToMxn));
      toast.success(`Se depositaron ${formatCurrency(amountUSD, 'USD')} a tu cuenta`);
    } else {
      if (amountUSD > usdtBalance) {
        toast.error('Fondos insuficientes para retirar');
        return;
      }
      setUsdtBalance(prev => prev - amountUSD);
      setGlobalDepositMXN(prev => prev - (amountUSD * usdToMxn));
      toast.success(`Retiro exitoso de ${formatCurrency(amountUSD, 'USD')}`);
    }

    setIsTransferModalOpen(false);
    setTransferAmount('');
  };

  const handleAddOperation = (e: React.FormEvent) => {
    e.preventDefault();
    const investment = parseFloat(newOp.investedUSD) || 0;

    if (newOp.status === 'Comprado') {
      if (investment > usdtBalance) {
        toast.error('No tienes suficiente USDT para comprar');
        return;
      }
      setUsdtBalance(prev => prev - investment);
    } else {
      setUsdtBalance(prev => prev + investment);
    }

    const newAsset: CryptoAsset = {
      id: Date.now().toString(),
      coin: newOp.coin.toUpperCase().trim(),
      buyPriceUSD: parseFloat(newOp.buyPriceUSD) || 0,
      investedUSD: investment,
      status: newOp.status,
      date: newOp.date
    };

    setAssets([...assets, newAsset]);
    setIsModalOpen(false);
    setNewOp({ coin: '', buyPriceUSD: '', investedUSD: '', status: 'Comprado', date: new Date().toISOString().split('T')[0] });
    toast.success(`Operación de ${newAsset.status.toLowerCase()} registrada`);
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'MXN' = 'USD') => new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
  const formatPercent = (percent: number) => new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 2 }).format(percent);

  let totalActiveValueUSD = 0;
  assets.forEach(asset => {
    if (asset.status === 'Comprado') {
      const currentPrice = livePrices[asset.coin] || asset.buyPriceUSD;
      const coinAmount = asset.buyPriceUSD > 0 ? asset.investedUSD / asset.buyPriceUSD : 0;
      totalActiveValueUSD += (coinAmount * currentPrice);
    }
  });

  const totalBalanceUSD = totalActiveValueUSD + usdtBalance;
  const totalBalanceMXN = totalBalanceUSD * usdToMxn;
  const globalProfitMXN = totalBalanceMXN - globalDepositMXN;
  const globalYield = globalDepositMXN > 0 ? globalProfitMXN / globalDepositMXN : 0;
  const ownedCoins = Array.from(new Set(assets.filter(a => a.status === 'Comprado').map(a => a.coin)));

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto relative">
      {/* --- ENCABEZADO CON BOTONES A LA DERECHA --- */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 flex items-center gap-3">
            <Bitcoin size={32} />
            Trading & Criptomonedas
          </h1>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="bg-slate-800 px-3 py-1 rounded-md border border-slate-700 text-slate-300">
              USD to MXN: <strong className="text-white">{formatCurrency(usdToMxn, 'MXN')}</strong>
            </span>
            <button onClick={fetchLiveMarketData} disabled={isRefreshing} className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors">
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>
        </div>

        {/* NUEVA BOTONERA EN LA ESQUINA */}
        <div className="flex gap-3">
          <button 
            onClick={() => { setTransferType('Depositar'); setIsTransferModalOpen(true); }} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors border border-slate-600 shadow-sm"
          >
            <ArrowDownToLine size={16} className="text-emerald-400" /> Depositar
          </button>
          <button 
            onClick={() => { setTransferType('Retirar'); setIsTransferModalOpen(true); }} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors border border-slate-600 shadow-sm"
          >
            <ArrowUpFromLine size={16} className="text-red-400" /> Retirar
          </button>
          <button 
            onClick={() => { setNewOp({...newOp, status: 'Comprado'}); setIsModalOpen(true); }} 
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <Bitcoin size={18} /> Operación
          </button>
        </div>
      </div>

      {/* --- TARJETAS DE RESUMEN GLOBAL --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Wallet size={14}/> Inversión Total</h2>
          <p className="text-2xl font-bold text-white">{formatCurrency(globalDepositMXN, 'MXN')}</p>
        </div>
        
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><PieChartIcon size={14}/> Balance Total</h2>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalBalanceMXN, 'MXN')}</p>
          <p className="text-xs text-slate-500 mt-1">~ {formatCurrency(totalBalanceUSD, 'USD')}</p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-lg ${globalProfitMXN >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <h2 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${globalProfitMXN >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Rendimiento</h2>
          <p className={`text-3xl font-extrabold ${globalProfitMXN >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
            {globalProfitMXN >= 0 ? '+' : ''}{formatPercent(globalYield)}
          </p>
          <p className={`text-xs font-medium mt-1 ${globalProfitMXN >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
            {formatCurrency(globalProfitMXN, 'MXN')}
          </p>
        </div>

        <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/30 shadow-lg">
          <h2 className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><DollarSign size={14}/> Liquidez (USDT)</h2>
          <p className="text-3xl font-extrabold text-amber-500">{formatCurrency(usdtBalance, 'USD')}</p>
        </div>
      </div>

      {/* --- TABLA PRINCIPAL --- */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr className="bg-slate-900/50 text-slate-300 uppercase tracking-wider border-b border-slate-700">
                <th className="p-4 font-semibold">Moneda</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-right">Precio Compra</th>
                <th className="p-4 font-semibold text-right">Invertido (USD)</th>
                <th className="p-4 font-semibold text-right bg-slate-900/80">Precio Mercado</th>
                <th className="p-4 font-semibold text-right">% Var</th>
                <th className="p-4 font-semibold text-right">Ganancia (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {assets.map((asset) => {
                const currentPrice = livePrices[asset.coin] || 0;
                const isBought = asset.status === 'Comprado';
                const percentChange = isBought && currentPrice > 0 ? (currentPrice - asset.buyPriceUSD) / asset.buyPriceUSD : 0;
                
                const coinAmount = asset.buyPriceUSD > 0 ? asset.investedUSD / asset.buyPriceUSD : 0;
                const currentValueUSD = coinAmount * currentPrice;
                const grossProfitUSD = isBought ? currentValueUSD - asset.investedUSD : 0;
                const netProfitMXN = isBought ? (grossProfitUSD * usdToMxn) - ((grossProfitUSD * usdToMxn) * 0.001) : 0;
                const isPositive = percentChange > 0;

                return (
                  <tr key={asset.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-emerald-400">
                        {asset.coin.charAt(0)}
                      </div>
                      {asset.coin}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${asset.status === 'Comprado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-300">{formatCurrency(asset.buyPriceUSD)}</td>
                    <td className="p-4 text-right font-medium text-white">{formatCurrency(asset.investedUSD)}</td>
                    <td className="p-4 text-right font-bold text-white bg-slate-900/30">
                      {isBought ? (currentPrice > 0 ? formatCurrency(currentPrice) : '...') : '-'}
                    </td>
                    <td className={`p-4 text-right font-bold flex justify-end items-center gap-1 ${isBought ? (isPositive ? 'text-emerald-400' : 'text-red-400') : 'text-slate-500'}`}>
                      {isBought && (isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />)}
                      {isBought ? formatPercent(percentChange) : '-'}
                    </td>
                    <td className={`p-4 text-right font-bold ${isBought ? (netProfitMXN >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-slate-500'}`}>
                      {isBought ? formatCurrency(netProfitMXN, 'MXN') : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL INTELIGENTE DE OPERACIÓN --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bitcoin className="text-emerald-500" /> Registrar {newOp.status}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddOperation} className="space-y-4">
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                <button type="button" onClick={() => setNewOp({...newOp, status: 'Comprado'})} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newOp.status === 'Comprado' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Compra</button>
                <button type="button" onClick={() => setNewOp({...newOp, status: 'Vendido'})} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newOp.status === 'Vendido' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Venta</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-slate-400 text-sm font-medium mb-1">Moneda (Ticker)</label>
                  {newOp.status === 'Vendido' ? (
                    <select 
                      required
                      value={newOp.coin}
                      onChange={(e) => setNewOp({...newOp, coin: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500 appearance-none"
                    >
                      <option value="" disabled>Selecciona...</option>
                      {ownedCoins.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ej. SOL" 
                        required 
                        value={newOp.coin} 
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onChange={(e) => setNewOp({...newOp, coin: e.target.value.toUpperCase()})} 
                        className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 uppercase"
                      />
                      {showSuggestions && newOp.coin && (
                        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                          {POPULAR_COINS.filter(c => c.includes(newOp.coin)).map(c => (
                            <div 
                              key={c} 
                              onClick={() => setNewOp({...newOp, coin: c})}
                              className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm font-medium"
                            >
                              {c}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Fecha</label>
                  <input type="date" required value={newOp.date} onChange={(e) => setNewOp({...newOp, date: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 [&::-webkit-calendar-picker-indicator]:invert"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">{newOp.status === 'Comprado' ? 'Precio de Compra' : 'Precio de Venta'}</label>
                  <input type="number" step="0.00000001" placeholder="0.00" required value={newOp.buyPriceUSD} onChange={(e) => setNewOp({...newOp, buyPriceUSD: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"/>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Cantidad (USD)</label>
                  <input type="number" step="0.01" placeholder="0.00" required value={newOp.investedUSD} onChange={(e) => setNewOp({...newOp, investedUSD: e.target.value})} className={`w-full bg-slate-900 border text-white rounded-lg px-4 py-2.5 focus:outline-none ${newOp.status === 'Comprado' ? 'border-amber-500/50 focus:border-amber-500' : 'border-emerald-500/50 focus:border-emerald-500'}`}/>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-4 border-t border-slate-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl transition-all font-medium">Cancelar</button>
                <button type="submit" className={`flex-1 text-white py-2.5 rounded-xl transition-all font-bold shadow-lg ${newOp.status === 'Comprado' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE TRANSFERENCIA --- */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {transferType === 'Depositar' ? <ArrowDownToLine className="text-emerald-500"/> : <ArrowUpFromLine className="text-red-500"/>}
                {transferType} USDT
              </h2>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Cantidad a {transferType.toLowerCase()} (USD)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ej. 100" 
                  required 
                  value={transferAmount} 
                  onChange={(e) => setTransferAmount(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 text-lg"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Esto ajustará tu balance de USDT y tu Inversión Total global.
                </p>
              </div>
              <button type="submit" className={`w-full text-white py-3 rounded-xl transition-all font-bold shadow-lg mt-4 ${transferType === 'Depositar' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}>
                Confirmar {transferType}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}