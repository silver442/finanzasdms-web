import { useSyncExternalStore } from 'react';

// `beforeinstallprompt` no está en lib.dom — tipado mínimo
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// ─── Store a nivel de módulo ──────────────────────────────────────────────────
// El navegador dispara `beforeinstallprompt` una sola vez y puede hacerlo antes de
// que monte el componente que lo usa; por eso se captura aquí, al cargar la app,
// y se comparte entre el banner y el botón de instalación.

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // evita el mini-infobar nativo de Chrome
    deferredPrompt = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emit();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Lanza el diálogo nativo de instalación. El evento solo puede usarse una vez. */
async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const promptEvent = deferredPrompt;
  if (!promptEvent) return 'unavailable';
  deferredPrompt = null;
  emit();
  await promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  return outcome;
}

export function usePwaInstall() {
  const canInstall = useSyncExternalStore(subscribe, () => deferredPrompt !== null, () => false);
  return { canInstall, promptInstall };
}
