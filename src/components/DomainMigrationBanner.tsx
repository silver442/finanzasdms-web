import { useState } from 'react';
import { ExternalLink, Sparkles, X } from 'lucide-react';

const DISMISS_KEY = 'dismissed_cashi_migration_banner';
const NEW_DOMAIN = 'cashi.dev';

function wasDismissed(): boolean {
  try { return localStorage.getItem(DISMISS_KEY) === 'true'; } catch { return false; }
}

interface DomainMigrationBannerProps {
  className?: string;
}

/** Aviso temporal de la mudanza de finanzasdms.com a cashi.dev. Se cierra una sola vez por navegador. */
export default function DomainMigrationBanner({ className = '' }: DomainMigrationBannerProps) {
  const [dismissed, setDismissed] = useState(wasDismissed);

  if (dismissed) return null;

  const isOnNewDomain = window.location.hostname.endsWith(NEW_DOMAIN);

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch { /* sin storage */ }
  };

  return (
    <div
      role="status"
      className={`@container flex items-start gap-3 bg-surface-card/60 backdrop-blur-md border border-brand-green/20 rounded-xl shadow-card p-3 sm:p-4 ${className}`}
    >
      <div className="shrink-0 bg-brand-green/10 border border-brand-green/20 rounded-lg p-2">
        <Sparkles size={16} className="text-brand-green-light" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col @xl:flex-row @xl:items-center gap-2 @xl:gap-4">
        {isOnNewDomain ? (
          <p className="flex-1 text-sm text-text-secondary">
            ¡Bienvenido a <span className="font-bold text-text-primary">{NEW_DOMAIN}</span>! Ya estás en nuestro nuevo dominio; tus datos siguen intactos.
          </p>
        ) : (
          <>
            <p className="flex-1 text-sm text-text-secondary">
              Nos mudamos a <span className="font-bold text-text-primary">{NEW_DOMAIN}</span>. Tus datos siguen intactos; si usas la app instalada en tu celular, te recomendamos reinstalarla desde el nuevo enlace y volver a iniciar sesión.
            </p>
            <a
              href={`https://${NEW_DOMAIN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start @xl:self-auto shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-brand-green-light bg-brand-green/10 hover:bg-brand-green/20 border border-brand-green/20 rounded-lg px-3 py-1.5 transition-colors"
            >
              Ir a {NEW_DOMAIN} <ExternalLink size={14} />
            </a>
          </>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 -mr-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated/60 transition-colors"
        aria-label="Cerrar aviso"
      >
        <X size={16} />
      </button>
    </div>
  );
}
