import { GENERIC_SERVICE_MARK, findService } from '../data/subscriptionServices';

interface ServiceLogoProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const DIM = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-14 h-14 rounded-2xl',
};

// Logo SVG del servicio (catálogo de data/subscriptionServices); ícono genérico si no se reconoce
export default function ServiceLogo({ name, size = 'md' }: ServiceLogoProps) {
  const service = findService(name);

  return (
    <div
      className={`${DIM[size]} shrink-0 flex items-center justify-center overflow-hidden ${
        service ? 'shadow-lg shadow-black/30 border border-white/10' : 'bg-brand-green/15 border border-brand-green/25'
      }`}
      style={service ? { background: service.bg } : undefined}
      title={service?.name}
    >
      <svg viewBox="0 0 24 24" className="w-3/4 h-3/4" aria-hidden="true">
        {service ? service.mark : GENERIC_SERVICE_MARK}
      </svg>
    </div>
  );
}
