import { Copy, ExternalLink, Gift, Info, X } from 'lucide-react';

const STEPS = [
  { icon: Gift, title: 'Elige una promoción', text: 'Revisa los bonos y recompensas de bancos, SOFIPOs, brokers y fintechs.' },
  { icon: Copy, title: 'Usa el código o enlace de Cashi', text: 'Copia el código de referido y abre la cuenta desde "Obtener recompensa".' },
  { icon: ExternalLink, title: 'Cumple los requisitos', text: 'Sigue los pasos de cada tarjeta; la institución te deposita el bono directamente.' },
];

export default function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 w-full max-w-lg shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-text-primary">¿Cómo funciona?</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <ol className="space-y-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-3">
              <span className="w-9 h-9 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-brand-green-light" />
              </span>
              <div>
                <p className="font-semibold text-text-primary">{i + 1}. {title}</p>
                <p className="text-sm text-text-secondary">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 flex gap-2 text-xs text-text-muted">
          <Info size={14} className="shrink-0 mt-0.5" />
          Cashi no administra tu dinero en estas plataformas. Cada promoción está sujeta a los términos y condiciones de la institución.
        </p>
      </div>
    </div>
  );
}
