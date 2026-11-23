import { useState } from 'react';
import { toast } from 'sonner';
import { DollarSign, X } from 'lucide-react';
import axios from 'axios';
import { todayMx } from '../../../utils/dates';
import { API, apiErrorMessage, authHeaders } from './utils/api';
import { formatMoney } from './utils/format';

interface CashMovementModalProps {
  usdBalance: number;
  // Tipo de cambio vigente en pantalla: solo se ofrece como sugerencia, el usuario captura el real
  marketRate: number;
  onClose: () => void;
  onSaved: () => void;
}

type CashMovementType = 'DEPOSIT' | 'WITHDRAWAL';

const INPUT_CLASS =
  'w-full bg-surface-base border border-surface-border text-text-primary rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-brand-green';

const today = todayMx;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Depósito o retiro de efectivo sin invertir. Se captura en MXN junto con el precio del dólar
 * de ese momento (obligatorio); el saldo vive en USD = MXN / tipo de cambio.
 */
export default function CashMovementModal({ usdBalance, marketRate, onClose, onSaved }: CashMovementModalProps) {
  const [type, setType] = useState<CashMovementType>('DEPOSIT');
  const [amountMxn, setAmountMxn] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(today);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mxn = Number(amountMxn);
  const rate = Number(exchangeRate);
  const hasRate = rate > 0;
  const convertedUsd = mxn > 0 && hasRate ? round2(mxn / rate) : 0;
  // Retirar "todo" puede pasarse por un centavo al convertir: el backend lo ajusta al saldo
  const exceedsBalance = type === 'WITHDRAWAL' && convertedUsd - usdBalance > 0.01;
  const canSubmit = mxn > 0 && hasRate && convertedUsd > 0 && !exceedsBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error(
        !hasRate ? 'Captura el precio del dólar del movimiento'
          : exceedsBalance ? 'No puedes retirar más de tu saldo disponible'
          : 'Captura un monto mayor a 0',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${API}/crypto/cash`,
        {
          type,
          amountMxn: round2(mxn),
          exchangeRate: Math.round(rate * 10000) / 10000,
          date,
          ...(notes.trim() && { notes: notes.trim() }),
        },
        { headers: authHeaders() },
      );
      toast.success(type === 'DEPOSIT' ? 'Depósito registrado' : 'Retiro registrado');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Error al registrar el movimiento'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-surface-card/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-card w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6">
        <div className="flex justify-between items-center gap-3 mb-5 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <DollarSign className="text-brand-green" /> Efectivo sin invertir
          </h2>
          <button onClick={onClose} className="p-1 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-surface-base rounded-lg p-1 border border-surface-border">
            <button type="button" onClick={() => setType('DEPOSIT')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'DEPOSIT' ? 'bg-brand-green text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}>Depositar</button>
            <button type="button" onClick={() => setType('WITHDRAWAL')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'WITHDRAWAL' ? 'bg-red-500 text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}>Retirar</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1">Monto (MXN)</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" required autoFocus value={amountMxn} onChange={(e) => setAmountMxn(e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1">Precio del dólar (MXN)</label>
              <input type="number" step="0.0001" min="0" placeholder={marketRate.toFixed(2)} required value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className={INPUT_CLASS} />
              <button type="button" onClick={() => setExchangeRate(marketRate.toFixed(4))} className="mt-1 text-xs text-brand-green-light hover:text-brand-green-light/80 transition-colors">
                Usar actual: ${marketRate.toFixed(2)}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1">Fecha</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={`${INPUT_CLASS} [&::-webkit-calendar-picker-indicator]:invert`} />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1">Notas (opcional)</label>
              <input type="text" maxLength={200} placeholder="Ej. Transferencia a Binance" value={notes} onChange={(e) => setNotes(e.target.value)} className={INPUT_CLASS} />
            </div>
          </div>

          <div className="bg-surface-base/60 border border-surface-border rounded-lg px-4 py-3 text-sm flex items-center justify-between gap-3">
            <span className="text-text-secondary">{type === 'DEPOSIT' ? 'Se abonan' : 'Se retiran'}</span>
            <span className={`font-bold tabular-nums ${exceedsBalance ? 'text-red-400' : 'text-text-primary'}`}>
              {hasRate && mxn > 0 ? `${formatMoney(convertedUsd)} USD` : '—'}
            </span>
          </div>

          <p className={`text-xs ${exceedsBalance ? 'text-red-400' : 'text-text-muted'}`}>
            Disponible: {formatMoney(usdBalance)} USD
            {hasRate && ` ≈ ${formatMoney(usdBalance * rate, 'MXN')} MXN`}
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 border-t border-surface-border">
            <button type="button" onClick={onClose} className="flex-1 bg-surface-elevated hover:bg-surface-elevated text-text-primary py-2.5 rounded-xl transition-all font-medium">Cancelar</button>
            <button type="submit" disabled={isSubmitting || !canSubmit} className={`flex-1 text-white py-2.5 rounded-xl transition-all font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${type === 'DEPOSIT' ? 'bg-brand-green hover:bg-brand-green-light shadow-brand-green/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}>
              {isSubmitting ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
