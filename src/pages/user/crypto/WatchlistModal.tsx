import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, X } from 'lucide-react';
import axios from 'axios';
import type { CryptoPosition, ReferenceMode } from './types';
import { POPULAR_COINS } from './types';
import { API, apiErrorMessage, authHeaders } from './utils/api';

interface WatchlistModalProps {
  positions: CryptoPosition[];
  referenceMode: ReferenceMode;
  // Con una posición, el modal solo edita su precio de referencia manual
  editing?: CryptoPosition | null;
  onClose: () => void;
  onSaved: () => void;
}

const INPUT_CLASS =
  'w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-brand-green';

export default function WatchlistModal({ positions, referenceMode, editing, onClose, onSaved }: WatchlistModalProps) {
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
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Error al guardar la moneda'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-surface-card/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-card w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6">
        <div className="flex justify-between items-center gap-3 mb-5 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <Eye className="text-brand-green" /> {editing ? `Referencia de ${editing.symbol}` : 'Enlistar moneda'}
          </h2>
          <button onClick={onClose} className="p-1 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editing && (
            <div className="relative">
              <label className="block text-text-secondary text-sm font-medium mb-1">Moneda (Ticker)</label>
              <input
                type="text"
                placeholder="Ej. PEPE"
                required
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
            <label className="block text-text-secondary text-sm font-medium mb-1">Precio de referencia (USD) <span className="text-text-muted font-normal">· opcional</span></label>
            <input type="number" step="0.00000001" min="0" placeholder="Vacío = apertura automática" value={price} onChange={(e) => setPrice(e.target.value)} className={INPUT_CLASS} />
            <p className="text-xs text-text-muted mt-1">
              {editing?.status === 'SOLD'
                ? 'Vacío = precio de tu última venta.'
                : `Vacío = precio de apertura de ${periodLabel}, según el selector Day / Swing.`}
            </p>
          </div>

          {!editing && (
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1">Fecha de referencia <span className="text-text-muted font-normal">· opcional</span></label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${INPUT_CLASS} [&::-webkit-calendar-picker-indicator]:invert`} />
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 border-t border-surface-border">
            <button type="button" onClick={onClose} className="flex-1 bg-surface-elevated hover:bg-surface-elevated text-text-primary py-2.5 rounded-xl transition-all font-medium">Cancelar</button>
            <button type="submit" disabled={isSubmitting || (!editing && (!normalized || isBought))} className="flex-1 bg-brand-green hover:bg-brand-green-light text-white py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-brand-green/20 disabled:opacity-40 disabled:cursor-not-allowed">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
