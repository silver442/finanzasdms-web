import {
  Bell, Bitcoin, ChartColumn, ChartColumnIncreasing, ChartLine, ChartPie, Code, Coins,
  Gift, Image, Info, Landmark, Layers, LayoutGrid, ListChecks, MousePointer, PiggyBank,
  Sparkles, Users, Zap, type LucideIcon,
} from 'lucide-react';

export const API = import.meta.env.VITE_API_URL;

export function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

export type ReferralCategory = 'BANK' | 'SOFIPO' | 'BROKER' | 'FINTECH';
export type ReferralCardStatus = 'DRAFT' | 'PUBLISHED' | 'COMING_SOON' | 'INACTIVE';
export type SectionKey = 'GENERAL' | 'BENEFIT' | 'STEPS' | 'CODE' | 'CTA' | 'LEGAL';

export interface TemplateSection {
  key: SectionKey;
  enabled: boolean;
}

export interface ReferralTemplate {
  id: string;
  name: string;
  description: string;
  category: ReferralCategory;
  sections: TemplateSection[];
  ctaLabel: string;
  isActive: boolean;
  updatedAt: string;
  _count?: { cards: number };
}

export interface ReferralCard {
  id: string;
  templateId: string | null;
  category: ReferralCategory;
  categoryLabel: string | null;
  brand: string;
  logoUrl: string | null;
  benefitLabel: string | null;
  title: string;
  description: string;
  steps: string[];
  features: string[];
  code: string | null;
  link: string | null;
  ctaLabel: string | null;
  termsUrl: string | null;
  status: ReferralCardStatus;
  order: number;
  updatedAt: string;
  template?: {
    id?: string;
    name?: string;
    category?: ReferralCategory;
    sections: TemplateSection[];
    ctaLabel: string;
  } | null;
}

export const SECTION_KEYS: SectionKey[] = ['GENERAL', 'BENEFIT', 'STEPS', 'CODE', 'CTA', 'LEGAL'];

export const DEFAULT_SECTIONS: TemplateSection[] = SECTION_KEYS.map((key) => ({ key, enabled: true }));

export const DEFAULT_CTA_LABEL = 'Obtener recompensa';

// Nombre en la plantilla (izq.) y en el editor (título + subtítulo)
export const SECTION_META: Record<SectionKey, { label: string; title: string; subtitle: string; icon: LucideIcon }> = {
  GENERAL: { label: 'Header / Marca', title: 'Información general', subtitle: 'Título, categoría e ícono', icon: Image },
  BENEFIT: { label: 'Beneficio / Recompensa', title: 'Beneficio destacado', subtitle: 'Texto principal del beneficio', icon: Gift },
  STEPS: { label: 'Pasos para obtener recompensa', title: 'Requisitos / pasos', subtitle: 'Pasos para obtener la recompensa', icon: ListChecks },
  CODE: { label: 'Código de referido', title: 'Código y enlace', subtitle: 'Formato del código y URL de registro', icon: Code },
  CTA: { label: 'CTA (botón principal)', title: 'Botón CTA', subtitle: 'Texto y estilo del botón principal', icon: MousePointer },
  LEGAL: { label: 'Términos y condiciones', title: 'Aviso legal', subtitle: 'Términos y condiciones', icon: Info },
};

export const CATEGORY_META: Record<ReferralCategory, {
  label: string;
  plural: string;
  icon: LucideIcon;
  tabIcon: LucideIcon;
  illustration: LucideIcon;
  illustrationCls: string;
}> = {
  BANK: { label: 'Banco', plural: 'Bancos', icon: Landmark, tabIcon: Landmark, illustration: Landmark, illustrationCls: 'text-sky-400' },
  SOFIPO: { label: 'SOFIPO', plural: 'SOFIPOs', icon: Layers, tabIcon: Layers, illustration: PiggyBank, illustrationCls: 'text-brand-green-light' },
  BROKER: { label: 'Broker', plural: 'Brokers', icon: Bitcoin, tabIcon: ChartColumn, illustration: ChartLine, illustrationCls: 'text-sky-400' },
  FINTECH: { label: 'Fintech', plural: 'Fintechs', icon: Zap, tabIcon: Users, illustration: Coins, illustrationCls: 'text-amber-400' },
};

export const CATEGORIES: ReferralCategory[] = ['BANK', 'SOFIPO', 'BROKER', 'FINTECH'];

export const ALL_TAB_ICON = LayoutGrid;
export const COMING_SOON_ICON = Bell;
// Íconos de las características de una tarjeta "Próximamente", en orden
export const FEATURE_ICONS: LucideIcon[] = [Bell, ChartColumnIncreasing, ChartPie, Sparkles];

export const STATUS_META: Record<ReferralCardStatus, { label: string; cls: string; dot: string }> = {
  PUBLISHED: { label: 'Publicada', cls: 'bg-brand-green/15 text-brand-green-light border-brand-green/30', dot: 'bg-brand-green-light' },
  DRAFT: { label: 'Borrador', cls: 'bg-surface-elevated text-text-secondary border-white/10', dot: 'bg-text-muted' },
  COMING_SOON: { label: 'Próximamente', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30', dot: 'bg-brand-violet-light' },
  INACTIVE: { label: 'Desactivada', cls: 'bg-red-500/10 text-red-300 border-red-500/30', dot: 'bg-red-400' },
};

// Secciones en el orden de la plantilla (o todas si la tarjeta no tiene plantilla)
export function resolveSections(card: Pick<ReferralCard, 'template'>, override?: TemplateSection[]): TemplateSection[] {
  const sections = override ?? card.template?.sections;
  return Array.isArray(sections) && sections.length > 0 ? sections : DEFAULT_SECTIONS;
}

export function categoryChip(card: Pick<ReferralCard, 'category' | 'categoryLabel'>) {
  return card.categoryLabel?.trim() || CATEGORY_META[card.category].label;
}

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiError(err: any, fallback: string): string {
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return typeof msg === 'string' ? msg : fallback;
}
