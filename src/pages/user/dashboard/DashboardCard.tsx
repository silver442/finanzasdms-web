import type { ReactNode, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

// Controles que el Dashboard inyecta a cada widget (plegado + agarre para arrastrar)
export interface CardControls {
  collapsed: boolean;
  onToggle: () => void;
  onGripPointerDown: (e: PointerEvent) => void;
}

interface DashboardCardProps extends CardControls {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  headerExtra?: ReactNode;
  to?: string;
  children: ReactNode;
}

export function DashboardCard({
  icon, title, subtitle, headerExtra, to,
  collapsed, onToggle, onGripPointerDown, children,
}: DashboardCardProps) {
  return (
    <div className={`bg-surface-card border border-surface-border rounded-3xl flex flex-col ${collapsed ? 'p-4 sm:p-5' : 'p-6 gap-5'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div className="min-w-0">
          {to ? (
            <Link to={to} className="font-bold text-white hover:text-brand-green-light transition-colors">{title}</Link>
          ) : (
            <p className="font-bold text-white">{title}</p>
          )}
          {subtitle && <p className="text-text-muted text-xs truncate">{subtitle}</p>}
        </div>

        <div className="ml-auto flex items-center gap-1 shrink-0">
          {headerExtra && !collapsed && <div className="mr-2">{headerExtra}</div>}
          <span
            role="button"
            aria-label={`Arrastrar ${title} para reordenar`}
            title="Arrastrar para reordenar"
            onPointerDown={onGripPointerDown}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-elevated/60 cursor-grab active:cursor-grabbing touch-none transition-colors"
          >
            <GripVertical size={16} />
          </span>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expandir ${title}` : `Plegar ${title}`}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-elevated/60 transition-colors"
          >
            {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {!collapsed && children}
    </div>
  );
}
