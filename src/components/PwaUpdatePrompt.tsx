import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 h

// El navegador solo busca un SW nuevo al navegar; una PWA instalada puede quedar
// abierta horas. Revisamos al montar (para que un refresh normal detecte el deploy
// cuanto antes), cada hora y al volver a la pestaña.
function scheduleUpdateChecks(registration: ServiceWorkerRegistration) {
  const check = () => {
    if (!navigator.onLine || registration.installing) return;
    void registration.update().catch(() => { /* sin red: se reintenta en el próximo ciclo */ });
  };

  check();
  setInterval(check, UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}

/**
 * Registra el Service Worker en modo autoUpdate: el SW nuevo hace skipWaiting + clientsClaim
 * y el registro de vite-plugin-pwa recarga la página cuando toma el control. Sin UI propia.
 */
export default function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) scheduleUpdateChecks(registration);
    },
    onRegisterError(error) {
      console.error('Error al registrar el Service Worker', error);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast.success('Cashi lista para usar sin conexión');
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  return null;
}
