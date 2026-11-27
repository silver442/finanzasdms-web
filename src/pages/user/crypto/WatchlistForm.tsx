import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import type { CryptoPosition, ReferenceMode } from './types';
import { POPULAR_COINS } from './types';
import { API, apiErrorMessage, authHeaders } from './utils/api';

interface WatchlistFormProps {
  positions: CryptoPosition[];
  referenceMode: ReferenceMode;
  // Con una posición, el formulario solo edita su precio de referencia manual
  editing: CryptoPosition | null;
  onCancelEdit: () => void;
  onSaved: () => void;
}

const INPUT_CLASS =
  'w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-brand-green';

export default function WatchlistForm({ positions, referenceMode, editing, onCancelEdit, onSaved }: WatchlistFormProps) {
  const [symbol, setSymbol] = useState(editing?.symbol ?? '');
  const [price, setPrice] = useState(editing?.referencePrice ? String(Number(editing.referencePrice)) : '');
  const [date, setDate] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalized = symbol.toUpperCase().trim();
  const isBought = positions.some((p) => p.symbol === normalized && p.status === 'BOUGHT');
  const periodLabel = referenceMode === 'DAY' ? 'hoy a las 00:00' : 'el lunes a las 00:00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const referencePrice = price.trim() === '' ? null : Number(price);
    if (referencePrice !== null && !(referencePrice > 0)) {
      toast.error('El precio de referencia debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        await axios.patch(`${API}/crypto/watchlist/${editing.symbol}`, { referencePrice }, { headers: authHeaders() });
        toast.success(`Referencia de ${editing.symbol} actualizada`);
        onCancelEdit();
      } else {
        await axios.post(
          `${API}/crypto/watchlist`,
          {
            symbol: normalized,
            ...(referencePrice !== null && { referencePrice }),
            ...(date && { referenceDate: date }),
          },
          { headers: authHeaders() },
        );
        toast.success(`${normalized} agregada a seguimiento`);
        setSymbol('');
        setPrice('');
        setDate('');
      }
      onSaved();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Error al guardar la moneda'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {editing ? (
        <p className="text-sm text-text-secondary">
          Editando la referencia de <span className="font-bold text-text-primary">{editing.symbol}</span>
        </p>
      ) : (
        <div className="relative">
          <label htmlFor="watch-symbol" className="block text-text-secondary text-xs font-medium mb-1">Moneda (Ticker)</label>
          <input
            id="watch-symbol"
            type="text"
            placeholder="Ej. PEPE"
            required
            autoComplete="off"
            value={symbol}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className={`${INPUT_CLASS} uppercase`}
          />
          {showSuggestions && symbol && (
            <div className="absolute z-10 w-full mt-1 bg-surface-card border border-surface-border rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
              {POPULAR_COINS.filter((c) => c.includes(normalized)).map((c) => (
                <div key={c} onClick={() => setSymbol(c)} className="px-4 py-2 hover:bg-surface-elevated cursor-pointer text-sm font-medium">
                  {c}
                </div>
              ))}
            </div>
          )}
          {isBought && <p className="text-xs text-red-400 mt-1">Esta moneda ya está comprada en tu portafolio.</p>}
        </div>
      )}

      <div>
        <label htmlFor="watch-price" className="block text-text-secondary text-xs font-medium mb-1">Precio de referencia (USD) <span className="text-text-muted font-normal">· opcional</span></label>
        <input id="watch-price" type="number" inputMode="decimal" step="0.00000001" min="0" placeholder="Vacío = apertura automática" value={price} onChange={(e) => setPrice(e.target.value)} className={INPUT_CLASS} />
        <p className="text-xs text-text-muted mt-1">
          {editing?.status === 'SOLD'
            ? 'Vacío = precio de tu última venta.'
            : `Vacío = precio de apertura de ${periodLabel}, según el selector Day / Swing.`}
        </p>
      </div>

      {!editing && (
        <div>
          <label htmlFor="watch-date" className="block text-text-secondary text-xs font-medium mb-1">Fecha de referencia <span className="text-text-muted font-normal">· opcional</span></label>
          <input id="watch-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${INPUT_CLASS} [&::-webkit-calendar-picker-indicator]:invert`} />
        </div>
      )}

      <div className="flex gap-3">
        {editing && (
          <button type="button" onClick={onCancelEdit} className="flex-1 bg-surface-elevated hover:bg-surface-elevated/70 text-text-primary py-2.5 rounded-xl transition-all font-medium">Cancelar</button>
        )}
        <button type="submit" disabled={isSubmitting || (!editing && (!normalized || isBought))} className="flex-1 bg-brand-green hover:bg-brand-green-light text-white py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-brand-green/20 disabled:opacity-40 disabled:cursor-not-allowed">
          {isSubmitting ? 'Guardando...' : editing ? 'Guardar referencia' : 'Enlistar moneda'}
        </button>
      </div>
    </form>
  );
}
