import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import type { CryptoPosition } from './types';
import { POPULAR_COINS } from './types';
import { todayMx } from '../../../utils/dates';
import { API, apiErrorMessage, authHeaders } from './utils/api';
import { formatMoney, formatPrice, formatTokens } from './utils/format';
import { writePref } from './utils/storage';

export type TradeType = 'BUY' | 'SELL';

/** Moneda y precio precargados al hacer clic en una fila del portafolio; `nonce` distingue clics repetidos */
export interface TradePreset {
  symbol: string;
  price?: number;
  nonce: number;
}

interface TradeFormProps {
  /** Lo eligen las pestañas Comprar / Vender del panel */
  type: TradeType;
  positions: CryptoPosition[];
  usdBalance: number;
  livePrices: Record<string, number>;
  preset: TradePreset | null;
  onSaved: () => void;
}

const INPUT_CLASS =
  'w-full h-10 bg-surface-base border border-surface-border text-text-primary rounded-lg px-3 text-base sm:text-sm tabular-nums focus:outline-none';

const QUICK_PERCENTS = [
  { value: 0.25, label: '25%' },
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: 'Todo' },
];

// Comisiones típicas de Bitget: 0.1% estándar, 0.08% pagando con BGB
const FEE_PRESETS = [0, 0.08, 0.1];
const FEE_KEY = 'crypto.feePercent';
const DEFAULT_FEE = 0.1;
const MAX_FEE = 10;

const isValidFee = (n: number) => Number.isFinite(n) && n >= 0 && n <= MAX_FEE;

// Se lee aparte de readNumberPref porque 0% es un valor válido
function readFeePref(): number {
  try {
    const raw = localStorage.getItem(FEE_KEY);
    const value = raw === null ? NaN : Number(raw);
    return isValidFee(value) ? value : DEFAULT_FEE;
  } catch {
    return DEFAULT_FEE;
  }
}

const emptyOp = (symbol = '', price = '') => ({ symbol, price, totalUsd: '', quantity: '', date: todayMx() });

const round8 = (n: number) => Math.round(n * 1e8) / 1e8;
// Las fracciones de un saldo se truncan para nunca pedir más de lo que se tiene
const floor8 = (n: number) => Math.floor(n * 1e8) / 1e8;

export default function TradeForm({ type, positions, usdBalance, livePrices, preset, onSaved }: TradeFormProps) {
  const [newOp, setNewOp] = useState(() => emptyOp());
  const [affectCashBalance, setAffectCashBalance] = useState(true);
  const [feeInput, setFeeInput] = useState(() => String(readFeePref()));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Campo que el usuario editó por última vez entre Total USD y Cantidad — el otro se recalcula solo
  const [lastEditedField, setLastEditedField] = useState<'totalUsd' | 'quantity' | null>(null);

  // Solo se venden monedas compradas; las vendidas o en seguimiento no tienen saldo
  const boughtBySymbol = new Map(positions.filter((p) => p.status === 'BOUGHT').map((p) => [p.symbol, Number(p.quantity)]));
  const ownedCoins = Array.from(boughtBySymbol.keys());

  // Clic en una fila: precarga la moneda (el panel ya eligió la pestaña). Al cambiar de pestaña
  // se conserva la moneda, salvo al pasar a Vender una que no tiene saldo
  const [appliedNonce, setAppliedNonce] = useState<number | null>(null);
  const [appliedType, setAppliedType] = useState(type);
  if (preset && preset.nonce !== appliedNonce) {
    setAppliedNonce(preset.nonce);
    setAppliedType(type);
    setNewOp(emptyOp(preset.symbol, preset.price !== undefined ? String(preset.price) : ''));
    setLastEditedField(null);
  } else if (type !== appliedType) {
    setAppliedType(type);
    const current = newOp.symbol.toUpperCase().trim();
    const keepSymbol = type === 'BUY' || boughtBySymbol.has(current);
    setNewOp({ ...emptyOp(keepSymbol ? current : '', keepSymbol ? newOp.price : ''), date: newOp.date });
    setLastEditedField(null);
  }

  const symbol = newOp.symbol.toUpperCase().trim();
  const marketPrice = livePrices[symbol];
  const availableQuantity = boughtBySymbol.get(symbol);
  const isBuy = type === 'BUY';

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

  const handleQuantityChange = (value: string, priceValue = newOp.price) => {
    setLastEditedField('quantity');
    const price = parseFloat(priceValue);
    const quantity = parseFloat(value);
    const totalUsd = price > 0 && quantity > 0 ? (price * quantity).toFixed(2) : '';
    setNewOp({ ...newOp, price: priceValue, quantity: value, totalUsd });
  };

  // Al elegir moneda se propone el precio de mercado si aún no hay uno capturado
  const selectSymbol = (value: string) => {
    const live = livePrices[value.toUpperCase().trim()];
    setNewOp({ ...newOp, symbol: value, price: newOp.price || (live !== undefined ? String(live) : '') });
  };

  // "Todo" usa la cantidad exacta de la posición para que el saldo quede en 0 sin residuos
  const fillPercent = (percent: number) => {
    if (availableQuantity === undefined) return;
    const quantity = percent === 1 ? availableQuantity : floor8(availableQuantity * percent);
    const priceValue = newOp.price || (marketPrice !== undefined ? String(marketPrice) : '');
    handleQuantityChange(String(quantity), priceValue);
  };

  const opPrice = parseFloat(newOp.price);
  const opQuantity = parseFloat(newOp.quantity);
  const opTotal = parseFloat(newOp.totalUsd);
  const mathIsConsistent =
    opPrice > 0 && opQuantity > 0 && opTotal > 0 && Math.abs(opPrice * opQuantity - opTotal) / opTotal < 0.005;
  const exceedsBalance = !isBuy && availableQuantity !== undefined && opQuantity > availableQuantity;
  const exceedsCash = isBuy && affectCashBalance && opTotal > usdBalance;
  const feePercent = feeInput.trim() === '' ? NaN : Number(feeInput);
  const feeIsValid = isValidFee(feePercent);
  const feeUsd = feeIsValid && opTotal > 0 ? opTotal * (feePercent / 100) : 0;
  const canSubmit = !!symbol && mathIsConsistent && feeIsValid && !exceedsBalance && !exceedsCash;

  const changeFee = (value: string) => {
    setFeeInput(value);
    const parsed = Number(value);
    if (value.trim() !== '' && isValidFee(parsed)) writePref(FEE_KEY, String(parsed));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error(!feeIsValid ? `La comisión debe estar entre 0% y ${MAX_FEE}%` : exceedsBalance ? 'No tienes suficiente saldo de esta moneda para vender' : exceedsCash ? 'No tienes suficientes dólares disponibles para esta compra' : 'Revisa los datos capturados: el precio, total y cantidad no cuadran');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${API}/crypto/trades/manual`,
        {
          symbol,
          type,
          quantity: opQuantity,
          price: opPrice,
          executedAt: newOp.date,
          affectCashBalance,
          feePercent,
        },
        { headers: authHeaders() },
      );
      toast.success(`Operación de ${isBuy ? 'compra' : 'venta'} registrada`);
      setNewOp(emptyOp());
      setLastEditedField(null);
      onSaved();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Error al registrar la operación'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const focusClass = isBuy ? 'focus:border-brand-green' : 'focus:border-red-500';

  const labelClass = 'block text-text-secondary text-xs font-medium mb-1 truncate';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Fila 1: Moneda | Fecha | Disponible — Fila 2: Precio | Total | Cantidad (2 columnas en móvil) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="relative min-w-0">
          <label htmlFor="trade-symbol" className={labelClass}>Moneda</label>
          {isBuy ? (
            <>
              <input
                id="trade-symbol"
                type="text"
                placeholder="Ej. SOL"
                required
                autoComplete="off"
                value={newOp.symbol}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={(e) => setNewOp({ ...newOp, symbol: e.target.value.toUpperCase() })}
                className={`${INPUT_CLASS} ${focusClass} uppercase`}
              />
              {showSuggestions && newOp.symbol && (
                <div className="absolute z-10 w-full mt-1 bg-surface-card border border-surface-border rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                  {POPULAR_COINS.filter((c) => c.includes(symbol)).map((c) => (
                    <div key={c} onClick={() => selectSymbol(c)} className="px-4 py-2 hover:bg-surface-elevated cursor-pointer text-sm font-medium">
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <select
              id="trade-symbol"
              required
              value={newOp.symbol}
              onChange={(e) => selectSymbol(e.target.value)}
              className={`${INPUT_CLASS} ${focusClass} appearance-none`}
            >
              <option value="" disabled>{ownedCoins.length ? 'Selecciona...' : 'Sin monedas'}</option>
              {ownedCoins.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        <div className="min-w-0">
          <label htmlFor="trade-date" className={labelClass}>Fecha</label>
          <input id="trade-date" type="date" required value={newOp.date} onChange={(e) => setNewOp({ ...newOp, date: e.target.value })} className={`${INPUT_CLASS} ${focusClass} px-2 [&::-webkit-calendar-picker-indicator]:invert`} />
        </div>

        <div className="col-span-2 sm:col-span-1 min-w-0">
          <span className={labelClass}>Disponible</span>
          <div
            aria-live="polite"
            className={`h-10 flex flex-col justify-center px-3 rounded-lg bg-surface-base/40 border border-dashed leading-tight tabular-nums ${exceedsCash || exceedsBalance ? 'border-red-500/50 text-red-400' : 'border-white/10 text-text-primary'}`}
          >
            {isBuy ? (
              <span className="text-sm font-semibold truncate">{formatMoney(usdBalance)} <span className="text-xs font-normal text-text-muted">USD</span></span>
            ) : availableQuantity !== undefined ? (
              <>
                <span className="text-sm font-semibold truncate" title={`${formatTokens(availableQuantity)} ${symbol}`}>{formatTokens(availableQuantity)} <span className="text-xs font-normal text-text-muted">{symbol}</span></span>
                {marketPrice !== undefined && <span className="text-xs text-text-muted truncate">~{formatMoney(availableQuantity * marketPrice)} USD</span>}
              </>
            ) : (
              <span className="text-xs text-text-muted truncate">Elige una moneda</span>
            )}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 min-w-0">
          <label htmlFor="trade-price" className={labelClass}>Precio (USD)</label>
          <input id="trade-price" type="number" inputMode="decimal" step="0.00000001" placeholder="0.00" required value={newOp.price} onChange={(e) => handlePriceChange(e.target.value)} className={`${INPUT_CLASS} ${focusClass}`} />
          {marketPrice !== undefined && (
            <button type="button" onClick={() => handlePriceChange(String(marketPrice))} className="mt-1 block max-w-full truncate text-xs font-medium text-brand-green-light hover:text-brand-green-light/80 transition-colors tabular-nums" title="Usar precio de mercado">
              Mercado: {formatPrice(marketPrice)}
            </button>
          )}
        </div>

        <div className="min-w-0">
          <label htmlFor="trade-total" className={labelClass}>Total (USD)</label>
          <input id="trade-total" type="number" inputMode="decimal" step="0.01" placeholder="0.00" required value={newOp.totalUsd} onChange={(e) => handleTotalChange(e.target.value)} className={`${INPUT_CLASS} ${focusClass}`} />
        </div>

        <div className="min-w-0">
          <label htmlFor="trade-quantity" className={labelClass}>Cantidad</label>
          <input id="trade-quantity" type="number" inputMode="decimal" step="0.00000001" placeholder="0.00000000" required value={newOp.quantity} onChange={(e) => handleQuantityChange(e.target.value)} className={`${INPUT_CLASS} ${focusClass}`} />
        </div>
      </div>

      {!isBuy && (
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Porcentaje del saldo a vender">
          {QUICK_PERCENTS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={availableQuantity === undefined}
              onClick={() => fillPercent(p.value)}
              className="py-1 text-xs font-semibold rounded-lg border border-white/10 bg-surface-base/60 text-text-secondary hover:text-white hover:border-red-500/50 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2" role="group" aria-labelledby="trade-fee-label">
          <span id="trade-fee-label" className="shrink-0 text-text-secondary text-xs font-medium">Comisión</span>
          {FEE_PRESETS.map((fee) => {
            const active = feeIsValid && feePercent === fee;
            return (
              <button
                key={fee}
                type="button"
                aria-pressed={active}
                onClick={() => changeFee(String(fee))}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition-colors ${active ? (isBuy ? 'bg-brand-green/20 border-brand-green/60 text-white' : 'bg-red-500/15 border-red-500/60 text-white') : 'bg-surface-base/60 border-white/10 text-text-secondary hover:text-white'}`}
              >
                {fee}%
              </button>
            );
          })}
          <div className="relative w-20 shrink-0">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max={MAX_FEE}
              value={feeInput}
              onChange={(e) => changeFee(e.target.value)}
              aria-label="Comisión manual en porcentaje"
              title="Porcentaje manual"
              className={`w-full bg-surface-base border rounded-lg pl-2 pr-6 py-1 text-xs text-right text-text-primary tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${feeIsValid ? `border-surface-border ${focusClass}` : 'border-red-500/60'}`}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">%</span>
          </div>
        </div>
        {!feeIsValid && <p className="mt-1 text-xs text-red-400">La comisión debe estar entre 0% y {MAX_FEE}%.</p>}
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={affectCashBalance}
          onChange={(e) => setAffectCashBalance(e.target.checked)}
          className={`w-4 h-4 shrink-0 cursor-pointer ${isBuy ? 'accent-brand-green' : 'accent-red-500'}`}
        />
        <span className="text-sm text-text-secondary">
          Actualizar saldo en Dólares
          <span className="text-xs text-text-muted"> · {isBuy ? 'resta el total de la compra' : 'suma lo recibido tras la comisión'}</span>
        </span>
      </label>

      {newOp.price && newOp.totalUsd && newOp.quantity && !mathIsConsistent && (
        <p className="text-xs text-red-400">Los números no cuadran: precio × cantidad debe ser igual al total en USD.</p>
      )}

      {feeIsValid && opTotal > 0 && opQuantity > 0 && (
        <p className="rounded-lg bg-surface-base/60 border border-white/5 px-3 py-1.5 text-xs text-text-secondary tabular-nums">
          Comisión ({feePercent}%): <span className="text-text-primary">~{formatPrice(feeUsd)} USD</span>
          {' · '}Recibes neto:{' '}
          <span className="font-semibold text-white">
            {isBuy ? `${formatTokens(opQuantity * (1 - feePercent / 100))} ${symbol}` : `${formatMoney(opTotal - feeUsd)} USD`}
          </span>
        </p>
      )}

      <button type="submit" disabled={isSubmitting || !canSubmit} className={`w-full text-white py-2.5 rounded-xl transition-all font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${isBuy ? 'bg-brand-green hover:bg-brand-green-light shadow-brand-green/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}>
        {isSubmitting ? 'Guardando...' : `${isBuy ? 'Comprar' : 'Vender'}${symbol ? ` ${symbol}` : ''}`}
      </button>
    </form>
  );
}
