import type React from 'react';
import { getLevelBg, getLevelColor } from '../../utils/levelStyles';
import { WALLET_STATUS_STYLES, type WalletTxStatus } from './walletTypes';

export const cardCls = 'bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card';
export const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted disabled:opacity-60';
export const labelCls = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1';
export const primaryBtnCls = 'bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl px-4 py-2.5 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}

export function StatCard({ icon: Icon, label, value, hint, accent }: StatCardProps) {
  return (
    <div className={`${cardCls} p-4 sm:p-5 flex items-start gap-3`}>
      <div className={`rounded-xl p-2.5 shrink-0 border ${accent ? 'bg-brand-green/10 border-brand-green/25' : 'bg-surface-elevated/70 border-white/5'}`}>
        <Icon size={20} className={accent ? 'text-brand-green-light' : 'text-text-secondary'} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</p>
        <p className={`text-xl sm:text-2xl font-extrabold tabular-nums truncate ${accent ? 'text-brand-green-light' : 'text-text-primary'}`}>{value}</p>
        {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

// Calificación (A+ … C3) con el color de la familia de nivel del cliente
export function RatingBadge({ rating, level, size = 'md' }: { rating: string; level: string; size?: 'sm' | 'md' }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-lg border font-extrabold tabular-nums ${getLevelBg(level)} ${getLevelColor(level)} ${size === 'sm' ? 'text-xs px-1.5 py-0.5 min-w-8' : 'text-sm px-2 py-1 min-w-10'}`}>
      {rating}
    </span>
  );
}

export function WalletStatusBadge({ status }: { status: WalletTxStatus }) {
  const { label, cls } = WALLET_STATUS_STYLES[status];
  return <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`}>{label}</span>;
}

export function ProgressBar({ pct, className = 'h-1.5' }: { pct: number; className?: string }) {
  return (
    <div className={`w-full bg-surface-800 rounded-full overflow-hidden ${className}`}>
      <div className="h-full bg-brand-green rounded-full transition-all duration-500" style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`${cardCls} h-16 animate-pulse`} />
      ))}
    </div>
  );
}
