import { useEffect } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 h
const UPDATE_TOAST_ID = 'pwa-update';

// El navegador solo busca un SW nuevo al navegar; una PWA instalada puede quedar
// abierta horas. Forzamos la revisión periódica y al volver a la pestaña.
function scheduleUpdateChecks(registration: ServiceWorkerRegistration) {
  const check = () => {
    if (!navigator.onLine || registration.installing) return;
    void registration.update().catch(() => { /* sin red: se reintenta en el próximo ciclo */ });
  };

  setInterval(check, UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}

/** Registra el Service Worker y avisa (toast) cuando hay una versión nueva. Sin UI propia. */
export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) scheduleUpdateChecks(registration);
    },
    onRegisterError(error) {
      console.error('Error al registrar el Service Worker', error);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    toast('Hay una nueva versión disponible de FinanzasDMS', {
      id: UPDATE_TOAST_ID,
      duration: Infinity,
      icon: <RefreshCw size={16} className="text-brand-green-light" />,
      action: {
        label: 'Actualizar',
        onClick: () => void updateServiceWorker(true),
      },
      onDismiss: () => setNeedRefresh(false),
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  useEffect(() => {
    if (!offlineReady) return;
    toast.success('FinanzasDMS lista para usar sin conexión');
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  return null;
}
