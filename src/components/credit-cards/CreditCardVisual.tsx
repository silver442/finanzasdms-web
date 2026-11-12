import type { ReactNode } from 'react';
import { Nfc } from 'lucide-react';
import { DEFAULT_CARD_COLOR } from '../../utils/creditCards';

interface CreditCardVisualProps {
  color?: string;
  /** Muestra una segunda tarjeta detrás (estilo del panel de resumen) */
  stacked?: boolean;
  label?: string;
  lastFour?: string | null;
  /** Logo en la esquina superior izquierda (ej. <BankLogo />) */
  logo?: ReactNode;
  className?: string;
}

interface CardFaceProps {
  color: string;
  label?: string;
  lastFour?: string | null;
  logo?: ReactNode;
  className?: string;
}

function CardFace({ color, label, lastFour, logo, className = '' }: CardFaceProps) {
  return (
    <div
      className={`absolute aspect-[1.586] w-full rounded-2xl border border-white/15 overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color}F2 0%, ${color}B3 45%, ${color}66 100%)`,
        boxShadow: `0 0 32px ${color}59, inset 0 1px 0 rgb(255 255 255 / 0.25)`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/30" />
      {logo && <div className="absolute left-[8%] top-[10%]">{logo}</div>}
      <div className="absolute left-[12%] top-[38%] w-[16%] aspect-[1.25] rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-inner">
        <div className="absolute inset-x-0 top-1/3 h-px bg-amber-700/50" />
        <div className="absolute inset-x-0 top-2/3 h-px bg-amber-700/50" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-amber-700/50" />
      </div>
      <Nfc className={`absolute right-[10%] ${logo ? 'top-[10%]' : 'top-[36%]'} w-[14%] h-auto text-white/90`} strokeWidth={2.2} />
      {label && (
        <p className="absolute left-[12%] bottom-[12%] text-white/90 text-xs font-semibold tracking-wide truncate max-w-[50%]">
          {label}
        </p>
      )}
      {lastFour && (
        <p className="absolute right-[8%] bottom-[10%] text-white font-bold tracking-wider text-sm">
          <span className="tracking-[0.2em]">••••</span> {lastFour}
        </p>
      )}
    </div>
  );
}

export default function CreditCardVisual({
  color = DEFAULT_CARD_COLOR, stacked = false, label, lastFour, logo, className = '',
}: CreditCardVisualProps) {
  return (
    <div className={`relative w-full ${stacked ? 'aspect-[1.9]' : 'aspect-[1.586]'} ${className}`}>
      {stacked && <CardFace color={color} className="max-w-[78%] left-0 top-[4%] -rotate-12 opacity-60" />}
      <CardFace
        color={color}
        label={label}
        lastFour={lastFour}
        logo={logo}
        className={stacked ? 'max-w-[78%] right-0 top-[8%] -rotate-6' : 'inset-0'}
      />
    </div>
  );
}
