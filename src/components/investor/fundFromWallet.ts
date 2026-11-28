import axios from 'axios';
import { toast } from 'sonner';
import { API, apiError, authHeaders, fmt } from './investorTypes';
import { notifyWalletUpdated } from './walletTypes';

// Aporta a un préstamo descontando de la cartera (POST /loans/:id/fund con fromWallet). Devuelve true si se registró.
export async function fundFromWallet(loanId: string, amount: number, purpose: string): Promise<boolean> {
  try {
    await axios.post(`${API}/loans/${loanId}/fund`, { amount, fromWallet: true }, { headers: authHeaders() });
    toast.success(`Prestaste ${fmt(amount)} a "${purpose}"`);
    notifyWalletUpdated();
    return true;
  } catch (err) {
    toast.error(apiError(err, 'No se pudo registrar tu aportación'));
    return false;
  }
}

// Valida un monto contra lo que falta del préstamo y el disponible de la cartera
export function fundAmountError(value: string, remaining: number, available: number): string | null {
  if (value === '') return null;
  const n = Number(value);
  if (!(n > 0)) return 'Monto inválido';
  if (n > remaining + 0.001) return `Máximo ${fmt(remaining)}`;
  if (n > available + 0.001) return 'Saldo insuficiente';
  return null;
}
