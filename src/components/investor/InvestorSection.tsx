import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import InvestorApplicationCard from './InvestorApplicationCard';
import InvestorAreaLink from './InvestorAreaLink';
import { API, authHeaders, type MyInvestorStatus } from './investorTypes';

// Mantiene el rol de localStorage al día (p. ej. recién aprobado como INVESTOR) para Sidebar y guards
function syncStoredRole(role: string) {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    const user = JSON.parse(raw) as { role?: string };
    if (user.role === role) return;
    localStorage.setItem('user', JSON.stringify({ ...user, role }));
    window.dispatchEvent(new Event('user-flags-updated'));
  } catch { /* localStorage no disponible */ }
}

// Gana Dinero: USER → solicitud para ser inversionista; INVESTOR/ADMIN/SUPER_ADMIN → acceso a su sección
export default function InvestorSection() {
  const [status, setStatus] = useState<MyInvestorStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get<MyInvestorStatus>(`${API}/investor-applications/me`, { headers: authHeaders() });
      setStatus(data);
      syncStoredRole(data.role);
    } catch {
      setStatus(null); // la sección es opcional: si falla, la página sigue funcionando
    }
  }, []);

  useEffect(() => { void fetchStatus(); }, [fetchStatus]);

  if (!status) return null;
  if (status.role === 'INVESTOR' || status.role === 'ADMIN' || status.role === 'SUPER_ADMIN') {
    return <InvestorAreaLink investorAlias={status.investorAlias} />;
  }
  if (status.role === 'USER') {
    return <InvestorApplicationCard status={status} />;
  }
  return null;
}
