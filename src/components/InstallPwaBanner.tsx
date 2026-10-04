import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_DAYS = 7;

function wasRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_DAYS * 86_400_000;
  } catch { return false; }
}

function rememberDismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* sin storage */ }
}

export default function InstallPwaBanner() {
  const { canInstall, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed);

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'dismissed') rememberDismiss();
  };

  const handleDismiss = () => {
    setDismissed(true);
    rememberDismiss();
  };

  if (!canInstall || dismissed) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar FinanzasDMS"
      className="fixed inset-x-4 bottom-4 mb-[env(safe-area-inset-bottom)] z-40 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96"
    >
      <div className="flex items-center gap-3 bg-surface-card/90 backdrop-blur-md border border-white/5 rounded-2xl shadow-card p-4">
        <div className="shrink-0 bg-brand-green/10 border border-brand-green/20 rounded-xl p-2.5">
          <Download size={20} className="text-brand-green-light" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary">Instala FinanzasDMS</p>
          <p className="text-xs text-text-secondary">Acceso directo desde tu pantalla de inicio.</p>
        </div>

        <button
          onClick={() => void handleInstall()}
          className="shrink-0 bg-brand-green hover:bg-brand-green-light text-white text-sm font-bold rounded-xl px-4 py-2 transition-all shadow-lg shadow-brand-green/20"
        >
          Instalar App
        </button>

        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 -mr-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
