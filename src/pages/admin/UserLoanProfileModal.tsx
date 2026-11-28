import { CheckCircle2, Tag, User, X, XCircle } from 'lucide-react';
import LevelOverview from '../../components/LevelOverview';
import type { LoanLevelInfo } from '../../hooks/useLoanLevels';

export interface ProfileUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  level: string;
  points: number;
  creditLimit: string | number;
  currentRate: string | number;
  isBlocked: boolean;
  familyCode?: string | null;
  referralCode?: string | null;
}

interface UserLoanProfileModalProps {
  user: ProfileUser;
  levels: LoanLevelInfo[];
  onClose: () => void;
}

// [SUPER_ADMIN] Perfil de préstamos de un usuario: nivel, puntos, límite, tasa y siguiente nivel
export default function UserLoanProfileModal({ user, levels, onClose }: UserLoanProfileModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={`Perfil de ${user.name ?? user.email}`}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-card/90 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full max-w-3xl max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6 text-white"
      >
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-2 shrink-0">
              <User size={22} className="text-brand-green-light" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-text-primary truncate">{user.name ?? '—'}</h2>
              <p className="text-text-secondary text-sm truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 text-xs font-semibold">
          {user.isBlocked
            ? <span className="bg-red-500/20 text-red-400 font-bold px-2 py-1 rounded-full">BLOQUEADO</span>
            : <span className="bg-brand-green/20 text-brand-green-light font-bold px-2 py-1 rounded-full">ACTIVO</span>}
          <span className="inline-flex items-center gap-1.5 bg-surface-elevated/60 text-text-secondary px-2 py-1 rounded-full">
            {user.familyCode
              ? <><CheckCircle2 size={13} className="text-brand-green-light" /> Trato familiar</>
              : <><XCircle size={13} className="text-text-muted" /> Sin trato familiar</>}
          </span>
          {user.referralCode && (
            <span className="inline-flex items-center gap-1.5 bg-brand-green/10 border border-brand-green/30 text-brand-green-light px-2 py-1 rounded-full font-mono">
              <Tag size={12} /> {user.referralCode}
            </span>
          )}
        </div>

        <LevelOverview
          level={user.level}
          points={user.points}
          creditLimit={user.creditLimit}
          currentRate={user.currentRate}
          levels={levels}
          viewer="admin"
        />
      </div>
    </div>
  );
}
