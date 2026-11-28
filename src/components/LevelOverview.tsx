import { ChevronRight, HelpCircle, Lock } from 'lucide-react';
import type { LoanLevelInfo } from '../hooks/useLoanLevels';
import { getLevelBar, getLevelBg, getLevelColor, getLevelIcon } from '../utils/levelStyles';

interface LevelOverviewProps {
  level: string;
  points: number;
  creditLimit: number | string;
  currentRate: number | string;
  levels: LoanLevelInfo[];
  // 'self' = el cliente en Mi Perfil; 'admin' = un SUPER_ADMIN viendo a otro usuario
  viewer?: 'self' | 'admin';
}

const TOOLTIP_LEVEL_TEXT = 'Tu límite y tasa están determinados por tu nivel actual. Sube de nivel realizando tus pagos puntualmente.';

function fmt(v: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group ml-1 align-middle">
      <HelpCircle size={13} className="text-text-muted group-hover:text-text-primary cursor-help transition-colors" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-surface-elevated border border-surface-border text-text-200 text-xs rounded-lg px-3 py-2 leading-snug shadow-xl z-50 pointer-events-none text-center">
        {text}
      </span>
    </span>
  );
}

// Nivel actual, progreso de puntos, beneficios vigentes y del siguiente nivel
export default function LevelOverview({ level, points, creditLimit, currentRate, levels, viewer = 'self' }: LevelOverviewProps) {
  const isSelf = viewer === 'self';
  const currentIdx = levels.findIndex((l) => l.level === level);
  const current = levels[currentIdx] ?? levels[0];
  const isElite = level === 'ELITE';
  const isMaxAuto = level === 'SOCIO_2';
  const next = !isElite ? levels[currentIdx + 1] ?? null : null;

  // Progreso hacia el siguiente nivel
  const pointsInRange = (next?.minPoints ?? current.minPoints) - current.minPoints;
  const pointsGained = points - current.minPoints;
  const pct = isElite ? 100 : pointsInRange > 0 ? Math.min(100, Math.max(0, (pointsGained / pointsInRange) * 100)) : 100;
  const pointsNeeded = next ? Math.max(0, next.minPoints - points) : 0;

  return (
    <>
      {/* ── Tarjeta de nivel actual ── */}
      <div className={`rounded-2xl border p-6 mb-6 ${getLevelBg(level)}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getLevelBg(level)} border`}>
              {getLevelIcon(level)}
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Nivel Actual</p>
              <h2 className={`text-2xl font-extrabold ${getLevelColor(level)}`}>{current.name}</h2>
              {isElite && <p className="text-xs text-purple-400/70 mt-0.5">Nivel máximo — acceso exclusivo</p>}
              {isMaxAuto && <p className="text-xs text-brand-violet/70 mt-0.5">Nivel tope automático — promoción ELITE manual</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Puntos Totales</p>
            <p className="text-4xl font-extrabold text-white">{points}</p>
            <p className="text-xs text-text-muted mt-0.5">pts</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-text-secondary mb-2">
            <span>{current.name} — {current.minPoints} pts</span>
            {next && !isMaxAuto
              ? <span>{next.name} — {next.minPoints} pts</span>
              : isElite
                ? <span className="text-purple-400">Nivel máximo alcanzado</span>
                : <span className="text-brand-violet flex items-center gap-1"><Lock size={10} /> ELITE — Promoción manual</span>}
          </div>
          <div className="w-full bg-surface-card rounded-full h-3 overflow-hidden border border-surface-border">
            <div className={`${getLevelBar(level)} h-3 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
          </div>
          {!isElite && (
            <p className="text-xs text-text-secondary mt-2 text-center">
              {isMaxAuto
                ? isSelf
                  ? 'Has alcanzado el máximo automático. Habla con el administrador para ser promovido a Élite.'
                  : 'Alcanzó el máximo automático. Solo un admin puede promoverlo a Élite.'
                : <><strong className={getLevelColor(level)}>{pointsNeeded} puntos</strong> más para llegar a <strong className="text-white">{next?.name}</strong></>}
            </p>
          )}
        </div>
      </div>

      {/* ── Beneficios actuales ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-card border border-surface-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">
            Límite de Crédito{isSelf && <InfoTooltip text={TOOLTIP_LEVEL_TEXT} />}
          </p>
          <p className="text-2xl font-extrabold text-white">{fmt(Number(creditLimit))}</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">
            Tasa de Interés{isSelf && <InfoTooltip text={TOOLTIP_LEVEL_TEXT} />}
          </p>
          <p className="text-2xl font-extrabold text-brand-green-light">{Number(currentRate).toFixed(0)}%</p>
          <p className="text-xs text-text-muted mt-0.5">anual</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">Plazo Máximo</p>
          <p className="text-2xl font-extrabold text-white">{current.term}</p>
          <p className="text-xs text-text-muted mt-0.5">meses</p>
        </div>
      </div>

      {/* ── Beneficios del siguiente nivel ── */}
      {next && !isElite && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ChevronRight size={16} className="text-text-secondary" />
            <p className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Próximo nivel: <span className={getLevelColor(next.level)}>{next.name}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-surface-base rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">Límite</p>
              <p className="text-white font-bold">{fmt(next.maxAmount)}</p>
              {next.maxAmount > current.maxAmount && (
                <p className="text-brand-green-light text-xs mt-0.5">+{fmt(next.maxAmount - current.maxAmount)}</p>
              )}
            </div>
            <div className="bg-surface-base rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">Tasa</p>
              <p className="text-brand-green-light font-bold">{next.interestRate}%</p>
              {next.interestRate < current.interestRate && (
                <p className="text-brand-green-light text-xs mt-0.5">-{current.interestRate - next.interestRate}%</p>
              )}
            </div>
            <div className="bg-surface-base rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">Plazo</p>
              <p className="text-white font-bold">{next.term} meses</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
