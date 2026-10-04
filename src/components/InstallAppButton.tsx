import { Download } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

/** Botón compacto de instalación — solo móvil y solo si el navegador permite instalar. */
export default function InstallAppButton() {
  const { canInstall, promptInstall } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <button
      onClick={() => void promptInstall()}
      className="md:hidden shrink-0 inline-flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-light active:scale-[0.98] text-white text-xs font-bold rounded-xl px-3 py-2 transition-all shadow-lg shadow-brand-green/20"
    >
      <Download size={14} />
      Instalar App
    </button>
  );
}
