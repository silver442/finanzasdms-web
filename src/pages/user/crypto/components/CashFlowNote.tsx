import type { Currency } from '../types';
import { formatMoney } from '../utils/format';

/** Aviso de depósitos/retiros del periodo, ya sumados al saldo inicial para no contarlos como ganancia. */
export function CashFlowNote({ amount, currency = 'USD' }: { amount: number; currency?: Currency }) {
  if (Math.abs(amount) < 0.005) return null;
  return (
    <p className="text-xs text-text-muted mt-1 truncate" title="Depósitos − retiros del periodo, ya incluidos en el saldo inicial">
      {amount > 0 ? 'Depósito' : 'Retiro'} {amount > 0 ? '+' : ''}{formatMoney(amount, currency)}
    </p>
  );
}
