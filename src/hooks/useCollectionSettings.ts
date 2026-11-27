import { useEffect, useState } from 'react';
import axios from 'axios';

export interface CollectionSettings {
  moratoriumGraceDays: number; // días de gracia tras el vencimiento
  moratoriumFeePerDay: number; // MXN por día de mora pasada la gracia
}

// Respaldo mientras carga o si falla la petición (mismos valores por defecto que el backend)
export const DEFAULT_COLLECTION_SETTINGS: CollectionSettings = { moratoriumGraceDays: 10, moratoriumFeePerDay: 10 };

// Configuración de mora vigente (GET /collection-settings), editable por el SUPER_ADMIN
export function useCollectionSettings(): { settings: CollectionSettings; isLoading: boolean } {
  const [settings, setSettings] = useState<CollectionSettings>(DEFAULT_COLLECTION_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    axios.get<CollectionSettings>(`${import.meta.env.VITE_API_URL}/collection-settings`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(({ data }) => { if (!cancelled) setSettings(data); })
      .catch(() => { /* se queda con los valores por defecto */ })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { settings, isLoading };
}
