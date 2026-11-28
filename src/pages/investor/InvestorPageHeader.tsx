import type React from 'react';

interface InvestorPageHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  alias?: string | null;
}

// Encabezado común de las páginas de la sección Inversionista
export default function InvestorPageHeader({ icon: Icon, title, subtitle, alias }: InvestorPageHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-brand-green/10 border border-brand-green/25 rounded-2xl p-4 shrink-0 shadow-lg shadow-brand-green/10">
        <Icon size={32} className="text-brand-green-light" />
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">{title}</h1>
        <p className="text-text-secondary mt-1 text-sm md:text-base">
          {subtitle}
          {alias && <span className="text-brand-green-light font-semibold"> · @{alias}</span>}
        </p>
      </div>
    </div>
  );
}
