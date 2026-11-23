import { useState } from 'react';
import { toast } from 'sonner';
import { Bitcoin, X } from 'lucide-react';
import axios from 'axios';
import type { CryptoPosition } from './types';
import { POPULAR_COINS } from './types';
import { todayMx } from '../../../utils/dates';
import { API, apiErrorMessage, authHeaders } from './utils/api';
import { formatMoney } from './utils/format';

interface RegisterTradeModalProps {
  positions: CryptoPosition[];
  usdBalance: number;
  /** Moneda y precio de mercado precargados al abrir el modal desde una fila del portafolio */
  initialSymbol?: string;
  initialPrice?: number;
  onClose: () => void;
  onSaved: () => void;
}

const today = todayMx;
const emptyOp = (symbol = '', price = '') => ({ symbol, type: 'BUY' as 'BUY' | 'SELL', price, totalUsd: '', quantity: '', date: today() });

const round8 = (n: number) => Math.round(n * 1e8) / 1e8;

export default function RegisterTradeModal({ positions, usdBalance, initialSymbol, initialPrice, onClose, onSaved }: RegisterTradeModalProps) {
  const [newOp, setNewOp] = useState(() => emptyOp(initialSymbol, initialPrice !== undefined ? String(initialPrice) : ''));
  const [affectCashBalance, setAffectCashBalance] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Campo que el usuario editó por última vez entre Total USD y Cantidad — el otro se recalcula solo
  const [lastEditedField, setLastEditedField] = useState<'totalUsd' | 'quantity' | null>(null);

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

  // Solo se venden monedas compradas; las vendidas o en seguimiento no tienen saldo
  const ownedCoins = positions.filter((p) => p.status === 'BOUGHT').map((p) => p.symbol);
  const availableQuantity = positions.find((p) => p.symbol === newOp.symbol.toUpperCase() && p.status === 'BOUGHT')?.quantity;
  const opPrice = parseFloat(newOp.price);
  const opQuantity = parseFloat(newOp.quantity);
  const opTotal = parseFloat(newOp.totalUsd);
  const mathIsConsistent =
    opPrice > 0 && opQuantity > 0 && opTotal > 0 && Math.abs(opPrice * opQuantity - opTotal) / opTotal < 0.005;
  const exceedsBalance = newOp.type === 'SELL' && availableQuantity !== undefined && opQuantity > Number(availableQuantity);
  const exceedsCash = newOp.type === 'BUY' && affectCashBalance && opTotal > usdBalance;
  const canSubmit = !!newOp.symbol && mathIsConsistent && !exceedsBalance && !exceedsCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error(exceedsBalance ? 'No tienes suficiente saldo de esta moneda para vender' : exceedsCash ? 'No tienes suficientes dólares disponibles para esta compra' : 'Revisa los datos capturados: el precio, total y cantidad no cuadran');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${API}/crypto/trades/manual`,
        {
          symbol: newOp.symbol.toUpperCase().trim(),
          type: newOp.type,
          quantity: opQuantity,
          price: opPrice,
          executedAt: newOp.date,
          affectCashBalance,
        },
        { headers: authHeaders() },
      );
      toast.success(`Operación de ${newOp.type === 'BUY' ? 'compra' : 'venta'} registrada`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Error al registrar la operación'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchType = (type: 'BUY' | 'SELL') => {
    setNewOp({ ...newOp, type, symbol: '' });
    setLastEditedField(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-surface-card/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-card w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6">
        <div className="flex justify-between items-center gap-3 mb-5 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <Bitcoin className="text-brand-green" /> Registrar operación
          </h2>
          <button onClick={onClose} className="p-1 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-surface-base rounded-lg p-1 border border-surface-border">
            <button type="button" onClick={() => switchType('BUY')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newOp.type === 'BUY' ? 'bg-brand-green text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}>Compra</button>
            <button type="button" onClick={() => switchType('SELL')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newOp.type === 'SELL' ? 'bg-red-500 text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}>Venta</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-text-secondary text-sm font-medium mb-1">Moneda (Ticker)</label>
              {newOp.type === 'SELL' ? (
                <select
                  required
                  value={newOp.symbol}
                  onChange={(e) => setNewOp({ ...newOp, symbol: e.target.value })}
                  className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-red-500 appearance-none"
                >
                  <option value="" disabled>{ownedCoins.length ? 'Selecciona...' : 'Sin monedas compradas'}</option>
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
                    className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-brand-green uppercase"
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
              <input type="date" required value={newOp.date} onChange={(e) => setNewOp({ ...newOp, date: e.target.value })} className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-brand-green [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1">Precio de la Moneda (USD)</label>
            <input type="number" step="0.00000001" placeholder="0.00" required value={newOp.price} onChange={(e) => handlePriceChange(e.target.value)} className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-brand-green" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1">Total a {newOp.type === 'BUY' ? 'Invertir' : 'Vender'} (USD)</label>
              <input type="number" step="0.01" placeholder="0.00" required value={newOp.totalUsd} onChange={(e) => handleTotalChange(e.target.value)} className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1">Cantidad de Cripto</label>
              <input type="number" step="0.00000001" placeholder="0.00000000" required value={newOp.quantity} onChange={(e) => handleQuantityChange(e.target.value)} className="w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-brand-green" />
            </div>
          </div>

          {newOp.type === 'SELL' && availableQuantity !== undefined && (
            <p className={`text-xs ${exceedsBalance ? 'text-red-400' : 'text-text-muted'}`}>
              Disponible: {availableQuantity} {newOp.symbol.toUpperCase()}
            </p>
          )}
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={affectCashBalance}
              onChange={(e) => setAffectCashBalance(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-brand-green cursor-pointer"
            />
            <span className="text-sm text-text-secondary">
              Actualizar saldo en Dólares automáticamente
              <span className={`block text-xs ${exceedsCash ? 'text-red-400' : 'text-text-muted'}`}>
                {newOp.type === 'BUY' ? 'Resta' : 'Suma'} el total de la operación · Disponible: {formatMoney(usdBalance)} USD
              </span>
            </span>
          </label>

          {newOp.price && newOp.totalUsd && newOp.quantity && !mathIsConsistent && (
            <p className="text-xs text-red-400">Los números no cuadran: precio × cantidad debe ser igual al total en USD.</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 border-t border-surface-border">
            <button type="button" onClick={onClose} className="flex-1 bg-surface-elevated hover:bg-surface-elevated text-text-primary py-2.5 rounded-xl transition-all font-medium">Cancelar</button>
            <button type="submit" disabled={isSubmitting || !canSubmit} className={`flex-1 text-white py-2.5 rounded-xl transition-all font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${newOp.type === 'BUY' ? 'bg-brand-green hover:bg-brand-green-light shadow-brand-green/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}>
              {isSubmitting ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
