import { CircleCheck, Clock, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  CATEGORY_META, COMING_SOON_ICON, DEFAULT_CTA_LABEL, FEATURE_ICONS,
  categoryChip, resolveSections, type ReferralCard, type SectionKey, type TemplateSection,
} from './referralTypes';

interface Props {
  card: ReferralCard;
  /** Secciones a usar en lugar de las de la plantilla de la tarjeta (vista previa del editor) */
  sections?: TemplateSection[];
  /** Tarjeta ancha (ocupa media fila): código y botón lado a lado */
  wide?: boolean;
}

function copyCode(code: string) {
  void navigator.clipboard.writeText(code);
  toast.success('Código copiado');
}

function BrandLogo({ card, violet }: { card: ReferralCard; violet?: boolean }) {
  const Icon = violet ? COMING_SOON_ICON : CATEGORY_META[card.category].icon;
  return (
    <span className="w-11 h-11 rounded-xl bg-surface-elevated border border-white/5 flex items-center justify-center shrink-0 overflow-hidden">
      {card.logoUrl
        ? <img src={card.logoUrl} alt={card.brand} className="w-full h-full object-contain p-1" />
        : <Icon size={22} className={violet ? 'text-amber-400' : 'text-brand-green-light'} />}
    </span>
  );
}

function Header({ card, comingSoon }: { card: ReferralCard; comingSoon: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <BrandLogo card={card} violet={comingSoon} />
      <div className="min-w-0 flex-1">
        <h3 className="text-text-primary font-extrabold text-lg leading-tight truncate">{card.brand}</h3>
        <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${
          comingSoon ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-surface-elevated text-text-secondary border-white/10'
        }`}>
          {categoryChip(card)}
        </span>
      </div>
      <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${
        comingSoon ? 'bg-violet-500/20 text-violet-200 border-violet-500/40' : 'bg-brand-green/15 text-brand-green-light border-brand-green/30'
      }`}>
        {comingSoon ? 'Próximamente' : 'Disponible'}
      </span>
    </div>
  );
}

function Illustration({ card }: { card: ReferralCard }) {
  const meta = CATEGORY_META[card.category];
  const Icon = meta.illustration;
  return (
    <div className="relative hidden sm:flex items-center justify-center w-24 h-24 shrink-0" aria-hidden>
      <div className="absolute inset-2 rounded-full bg-sky-500/10 blur-2xl" />
      <Icon size={72} strokeWidth={1.25} className={`relative ${meta.illustrationCls} drop-shadow-lg`} />
    </div>
  );
}

function Benefit({ card }: { card: ReferralCard }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        {card.benefitLabel && <p className="text-text-primary text-sm font-semibold">{card.benefitLabel}</p>}
        <p className="text-brand-green-light text-3xl font-extrabold tracking-tight leading-tight">{card.title}</p>
      </div>
      <Illustration card={card} />
    </div>
  );
}

function Steps({ card }: { card: ReferralCard }) {
  if (card.steps.length === 0) return null;
  return (
    <div>
      <p className="text-text-primary text-sm font-bold mb-1.5">¿Cómo obtener tu recompensa?</p>
      <ul className="space-y-1">
        {card.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
            <CircleCheck size={16} className="text-brand-green-light shrink-0 mt-0.5" />
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodeBox({ card }: { card: ReferralCard }) {
  if (!card.code) return null;
  const code = card.code;
  return (
    <div className="flex items-center justify-between gap-3 bg-surface-base/60 border border-white/10 rounded-xl px-4 py-2">
      <div className="min-w-0">
        <p className="text-text-muted text-xs">Código de referido</p>
        <p className="font-mono font-bold text-text-primary tracking-wider truncate">{code}</p>
      </div>
      <button
        type="button"
        onClick={() => copyCode(code)}
        className="shrink-0 inline-flex items-center gap-1.5 border border-white/15 hover:border-brand-green/50 hover:text-brand-green-light text-text-primary text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        <Copy size={14} /> Copiar
      </button>
    </div>
  );
}

function Cta({ card }: { card: ReferralCard }) {
  const label = card.ctaLabel?.trim() || card.template?.ctaLabel || DEFAULT_CTA_LABEL;
  const cls = 'w-full inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl px-4 py-2.5 transition-all shadow-lg shadow-brand-green/20';
  if (!card.link) return <span className={`${cls} opacity-60`}>{label} <ExternalLink size={16} /></span>;
  return (
    <a href={card.link} target="_blank" rel="noopener noreferrer" className={cls}>
      {label} <ExternalLink size={16} />
    </a>
  );
}

function Legal({ card }: { card: ReferralCard }) {
  if (!card.termsUrl) return null;
  return (
    <a
      href={card.termsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-center text-xs text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors"
    >
      Consultar términos y condiciones
    </a>
  );
}

function ComingSoonCard({ card, showHeader }: { card: ReferralCard; showHeader: boolean }) {
  const Icon = COMING_SOON_ICON;
  return (
    <article className="h-full bg-violet-950/20 backdrop-blur-md border border-violet-500/40 rounded-2xl p-5 flex flex-col gap-4 shadow-card">
      {showHeader && <Header card={card} comingSoon />}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-amber-300 text-xl font-extrabold leading-tight">{card.title}</p>
          {card.description && <p className="text-text-secondary text-sm mt-1">{card.description}</p>}
        </div>
        <div className="relative hidden sm:flex items-center justify-center w-20 h-20 shrink-0" aria-hidden>
          <div className="absolute inset-2 rounded-full bg-violet-500/20 blur-2xl" />
          <Icon size={60} strokeWidth={1.25} className="relative text-brand-violet-light" />
        </div>
      </div>
      {card.features.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {card.features.map((f, i) => {
            const FIcon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <span key={i} className="inline-flex items-center gap-2 text-sm text-text-secondary">
                <FIcon size={16} className="text-brand-violet-light" /> {f}
              </span>
            );
          })}
        </div>
      )}
      <button
        type="button"
        disabled
        className="mt-auto w-full inline-flex items-center justify-center gap-2 bg-violet-500/10 border border-violet-500/40 text-violet-200 font-semibold rounded-xl px-4 py-2.5 cursor-not-allowed"
      >
        <Clock size={16} /> Próximamente disponible
      </button>
    </article>
  );
}

const BOTTOM_KEYS: SectionKey[] = ['CODE', 'CTA', 'LEGAL'];

// Tarjeta pública de Gana Dinero; pinta las secciones activas de su plantilla en el orden configurado
export default function ReferralCardView({ card, sections, wide }: Props) {
  const enabled = resolveSections(card, sections).filter((s) => s.enabled).map((s) => s.key);

  if (card.status === 'COMING_SOON') {
    return <ComingSoonCard card={card} showHeader={enabled.includes('GENERAL')} />;
  }

  const top = enabled.filter((k) => !BOTTOM_KEYS.includes(k));
  const bottom = enabled.filter((k) => BOTTOM_KEYS.includes(k));

  const renderTop = (key: SectionKey) => {
    switch (key) {
      case 'GENERAL': return <Header key={key} card={card} comingSoon={false} />;
      case 'BENEFIT': return <Benefit key={key} card={card} />;
      case 'STEPS': return <Steps key={key} card={card} />;
      default: return null;
    }
  };
  const renderBottom = (key: SectionKey) => {
    switch (key) {
      case 'CODE': return <CodeBox key={key} card={card} />;
      case 'CTA': return <Cta key={key} card={card} />;
      case 'LEGAL': return <Legal key={key} card={card} />;
      default: return null;
    }
  };

  // El encabezado va arriba a lo ancho; la ilustración acompaña al beneficio
  const headerFirst = top[0] === 'GENERAL';
  const body = headerFirst ? top.slice(1) : top;

  return (
    <article className="h-full bg-surface-card/60 backdrop-blur-md border border-brand-green/25 hover:border-brand-green/50 rounded-2xl p-5 flex flex-col gap-4 shadow-card transition-colors">
      {headerFirst && renderTop('GENERAL')}
      {body.length > 0 && <div className="space-y-3">{body.map(renderTop)}</div>}
      {bottom.length > 0 && (
        wide ? (
          <div className="mt-auto grid gap-3 xl:grid-cols-2 xl:items-end">
            {bottom.includes('CODE') && renderBottom('CODE')}
            <div className="space-y-2">{bottom.filter((k) => k !== 'CODE').map(renderBottom)}</div>
          </div>
        ) : (
          <div className="mt-auto space-y-3">{bottom.map(renderBottom)}</div>
        )
      )}
    </article>
  );
}
