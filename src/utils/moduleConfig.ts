import { useEffect, useState } from 'react';
import axios from 'axios';

export type ModuleStatus = 'DEVELOPMENT' | 'ADMIN_ONLY' | 'PUBLIC';
export type ModuleConfig = { key: string; flagKey: string; status: ModuleStatus };

// Se dispara tras cambiar la visibilidad de un módulo (Tienda) para refrescar Sidebar/BottomNav
export const MODULE_CONFIG_UPDATED = 'module-config-updated';

export async function fetchModuleConfig(): Promise<ModuleConfig[]> {
  const { data } = await axios.get<ModuleConfig[]>(`${import.meta.env.VITE_API_URL}/modules/config`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  return data;
}

// Estado por flag (hasCryptoModule → 'PUBLIC'). Vacío mientras carga o si falla.
export function useModuleStatuses(): Record<string, ModuleStatus> {
  const [statuses, setStatuses] = useState<Record<string, ModuleStatus>>({});

  useEffect(() => {
    const load = () => {
      fetchModuleConfig()
        .then((config) => setStatuses(Object.fromEntries(config.map((m) => [m.flagKey, m.status]))))
        .catch(() => { /* sin config: se muestran según los flags del usuario */ });
    };
    load();
    window.addEventListener(MODULE_CONFIG_UPDATED, load);
    return () => window.removeEventListener(MODULE_CONFIG_UPDATED, load);
  }, []);

  return statuses;
}

// Un módulo activado se oculta del menú si vuelve a "En desarrollo", o a "Solo Admin" para un USER
export function isStatusVisible(status: ModuleStatus | undefined, isAdmin: boolean): boolean {
  if (!status) return true;
  return status === 'PUBLIC' || (status === 'ADMIN_ONLY' && isAdmin);
}
