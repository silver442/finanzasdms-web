import { Shield, Star, TrendingUp, Zap } from 'lucide-react';

// Colores e íconos por familia de nivel (Novato / Cumplidor / Socio / Élite)

export function getLevelColor(value: string): string {
  if (value.startsWith('NOVATO'))     return 'text-sky-400';
  if (value.startsWith('CUMPLIDOR'))  return 'text-brand-green-light';
  if (value.startsWith('SOCIO'))      return 'text-brand-violet';
  if (value === 'ELITE')              return 'text-purple-400';
  return 'text-text-secondary';
}

export function getLevelBg(value: string): string {
  if (value.startsWith('NOVATO'))     return 'bg-sky-500/10 border-sky-500/30';
  if (value.startsWith('CUMPLIDOR'))  return 'bg-brand-green/10 border-brand-green/30';
  if (value.startsWith('SOCIO'))      return 'bg-brand-violet/10 border-brand-violet/30';
  if (value === 'ELITE')              return 'bg-purple-500/10 border-purple-500/30';
  return 'bg-surface-elevated border-surface-border';
}

export function getLevelBar(value: string): string {
  if (value === 'ELITE')             return 'bg-purple-500';
  if (value.startsWith('SOCIO'))     return 'bg-brand-violet-400';
  if (value.startsWith('CUMPLIDOR')) return 'bg-brand-green';
  return 'bg-sky-500';
}

export function getLevelIcon(value: string) {
  if (value === 'ELITE') return <Zap size={20} className="text-purple-400" />;
  if (value.startsWith('SOCIO')) return <Shield size={20} className="text-brand-violet" />;
  if (value.startsWith('CUMPLIDOR')) return <TrendingUp size={20} className="text-brand-green-light" />;
  return <Star size={20} className="text-sky-400" />;
}
