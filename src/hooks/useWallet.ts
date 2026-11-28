import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API, authHeaders } from '../components/investor/investorTypes';
import { WALLET_UPDATED_EVENT, type WalletSummary } from '../components/investor/walletTypes';

// GET /wallet/me; se vuelve a pedir con el evento 'wallet-updated' (fondeo, depósito, retiro)
export function useWallet(enabled = true) {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [hasError, setHasError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await axios.get<WalletSummary>(`${API}/wallet/me`, { headers: authHeaders() });
      setWallet(data);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const onUpdate = () => void refresh();
    window.addEventListener(WALLET_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(WALLET_UPDATED_EVENT, onUpdate);
  }, [enabled, refresh]);

  return { wallet, isLoading, hasError, refresh };
}
