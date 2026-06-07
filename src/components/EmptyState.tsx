import React from 'react';
import { Link } from 'react-router-dom';

// ── Ilustración: Portafolio ───────────────────────────────────────────────────
// Donut chart abstracto: outer r=38, inner r=23, centro (60,65)
// Acento verde: arco superior (225°→315° CW a través del tope a 270°)
// Puntos angulares SVG calculados desde trigonometría exacta:
//   225°: (33.1, 38.1)  |  315°: (86.9, 38.1)  |  top(270°): (60, 27)
//   Inner 225°: (43.7, 48.7)  |  inner 315°: (76.3, 48.7)

export function PortfolioEmptyIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
      {/* Anillo exterior — muy sutil */}
      <circle cx="60" cy="65" r="38" stroke="white" strokeWidth="1.5" strokeOpacity="0.1" />
      {/* Anillo interior */}
      <circle cx="60" cy="65" r="23" stroke="white" strokeWidth="1.5" strokeOpacity="0.1" />

      {/* Divisores en mitad inferior (3 segmentos muted con guiones) */}
      <line x1="86.9" y1="91.9" x2="76.3" y2="81.3" stroke="white" strokeWidth="1" strokeOpacity="0.07" strokeDasharray="2.5 2" />
      <line x1="60"   y1="103"  x2="60"   y2="88"   stroke="white" strokeWidth="1" strokeOpacity="0.07" strokeDasharray="2.5 2" />
      <line x1="33.1" y1="91.9" x2="43.7" y2="81.3" stroke="white" strokeWidth="1" strokeOpacity="0.07" strokeDasharray="2.5 2" />

      {/* ── Acento verde: arco superior del donut ── */}
      <path
        d="M 33.1 38.1 A 38 38 0 0 1 86.9 38.1"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
      {/* Arco interior del segmento acento */}
      <path
        d="M 43.7 48.7 A 23 23 0 0 1 76.3 48.7"
        stroke="#10B981"
        strokeWidth="1"
        strokeLinecap="round"
        strokeOpacity="0.35"
      />
      {/* Lados del segmento (radio lines) */}
      <line x1="43.7" y1="48.7" x2="33.1" y2="38.1" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55" />
      <line x1="76.3" y1="48.7" x2="86.9" y2="38.1" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55" />

      {/* Nodo brillante en el tope del arco */}
      <circle cx="60" cy="27" r="2.8" fill="#10B981" fillOpacity="0.9" />
      <circle cx="60" cy="27" r="5" fill="#10B981" fillOpacity="0.15" />

      {/* Flecha ascendente sobre el donut */}
      <path
        d="M 56.5 16.5 L 60 9 L 63.5 16.5"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.7"
      />
      <line x1="60" y1="9" x2="60" y2="21" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />

      {/* Puntos decorativos en partes no-acento del anillo */}
      <circle cx="98" cy="65"  r="1.8" fill="white" fillOpacity="0.09" />
      <circle cx="60" cy="103" r="1.8" fill="white" fillOpacity="0.09" />
      <circle cx="22" cy="65"  r="1.8" fill="white" fillOpacity="0.09" />
    </svg>
  );
}

// ── Ilustración: Préstamos ────────────────────────────────────────────────────
// Stack de 3 monedas (elipses) + flecha verde ascendente
// Coins: cx=60, cy=82/72/62, rx=30, ry=7

export function LoansEmptyIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
      {/* ── Cuerpo principal: stack de monedas ── */}

      {/* Cara superior de moneda inferior */}
      <ellipse cx="60" cy="82" rx="30" ry="7" stroke="white" strokeWidth="1.5" strokeOpacity="0.09" />
      {/* Cara superior de moneda media */}
      <ellipse cx="60" cy="72" rx="30" ry="7" stroke="white" strokeWidth="1.5" strokeOpacity="0.1" />
      {/* Cara superior de moneda superior */}
      <ellipse cx="60" cy="62" rx="30" ry="7" stroke="white" strokeWidth="1.5" strokeOpacity="0.12" />

      {/* Lados cilíndricos del stack */}
      <line x1="30" y1="62" x2="30" y2="82" stroke="white" strokeWidth="1.5" strokeOpacity="0.08" />
      <line x1="90" y1="62" x2="90" y2="82" stroke="white" strokeWidth="1.5" strokeOpacity="0.08" />
      {/* Fondo visible del stack (mitad inferior de la última moneda) */}
      <path d="M 30 82 A 30 7 0 0 1 90 82" stroke="white" strokeWidth="1.5" strokeOpacity="0.08" />

      {/* Detalles de la cara superior (grabado de moneda) */}
      <line x1="46" y1="61"   x2="74" y2="61"   stroke="white" strokeWidth="1"    strokeOpacity="0.1"  />
      <line x1="49" y1="62.8" x2="71" y2="62.8" stroke="white" strokeWidth="0.75" strokeOpacity="0.07" />

      {/* Halo sutil de energía sobre la pila */}
      <path
        d="M 38 52 A 27 10 0 0 1 82 52"
        stroke="white"
        strokeWidth="1"
        strokeOpacity="0.06"
        strokeDasharray="3 2.5"
      />

      {/* ── Acento verde: flecha ascendente ── */}
      {/* Punta de flecha */}
      <path
        d="M 53.5 36 L 60 25 L 66.5 36"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.88"
      />
      {/* Eje de la flecha */}
      <line x1="60" y1="53" x2="60" y2="27" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.85" />

      {/* Nodo brillante en la punta */}
      <circle cx="60" cy="25" r="2.5" fill="#10B981" fillOpacity="0.9" />
      <circle cx="60" cy="25" r="5.5" fill="#10B981" fillOpacity="0.12" />

      {/* Pequeñas chispas dispersas */}
      <circle cx="79" cy="37" r="1.5" fill="#10B981" fillOpacity="0.6" />
      <circle cx="44" cy="33" r="1"   fill="#10B981" fillOpacity="0.45" />

      {/* Cruz/destello a la derecha */}
      <line x1="83" y1="46" x2="89" y2="46" stroke="#10B981" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.38" />
      <line x1="86" y1="43" x2="86" y2="49" stroke="#10B981" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.38" />
    </svg>
  );
}

// ── Componente EmptyState ─────────────────────────────────────────────────────

interface EmptyStateProps {
  illustration: React.ReactNode;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaTo?: string;
  onCta?: () => void;
}

export function EmptyState({ illustration, title, subtitle, ctaLabel, ctaTo, onCta }: EmptyStateProps) {
  const showCta = ctaLabel && (ctaTo || onCta);

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-8 text-center">
      {/* Ilustración con resplandor ambiental */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-28 h-28 bg-brand-green/[6%] blur-2xl rounded-full" />
        <div className="relative z-10">{illustration}</div>
      </div>

      {/* Texto */}
      <div className="flex flex-col gap-2">
        <p className="text-lg font-medium text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">{subtitle}</p>
      </div>

      {/* CTA ghost */}
      {showCta && (
        ctaTo ? (
          <Link
            to={ctaTo}
            className="mt-1 px-5 py-2.5 text-sm font-semibold rounded-xl border border-white/10 text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all"
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onCta}
            className="mt-1 px-5 py-2.5 text-sm font-semibold rounded-xl border border-white/10 text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all"
          >
            {ctaLabel}
          </button>
        )
      )}
    </div>
  );
}
