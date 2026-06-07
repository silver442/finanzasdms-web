import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, User, Star, TrendingUp, Shield, Zap, Lock, ChevronRight, HelpCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: string;
  creditLimit: string | number;
  currentRate: string | number;
  points: number;
  level: string;
  createdAt: string;
}

interface LevelConfig {
  value: string;
  label: string;
  minPoints: number;
  creditLimit: number;
  rate: number;
  maxMonths: number;
}

const LEVELS: LevelConfig[] = [
  { value: 'NOVATO_1',    label: 'Novato I',      minPoints: 0,    creditLimit: 500,   rate: 50, maxMonths: 6  },
  { value: 'NOVATO_2',    label: 'Novato II',     minPoints: 100,  creditLimit: 1000,  rate: 50, maxMonths: 6  },
  { value: 'NOVATO_3',    label: 'Novato III',    minPoints: 200,  creditLimit: 1500,  rate: 48, maxMonths: 9  },
  { value: 'CUMPLIDOR_1', label: 'Cumplidor I',   minPoints: 300,  creditLimit: 2000,  rate: 45, maxMonths: 12 },
  { value: 'CUMPLIDOR_2', label: 'Cumplidor II',  minPoints: 500,  creditLimit: 3000,  rate: 42, maxMonths: 12 },
  { value: 'CUMPLIDOR_3', label: 'Cumplidor III', minPoints: 750,  creditLimit: 4000,  rate: 40, maxMonths: 18 },
  { value: 'SOCIO_1',     label: 'Socio I',       minPoints: 1000, creditLimit: 7000,  rate: 35, maxMonths: 18 },
  { value: 'SOCIO_2',     label: 'Socio II',      minPoints: 1500, creditLimit: 10000, rate: 30, maxMonths: 24 },
  { value: 'ELITE',       label: 'Élite',         minPoints: 9999, creditLimit: 15000, rate: 25, maxMonths: 24 },
];

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function fmt(v: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
}

function getLevelColor(value: string): string {
  if (value.startsWith('NOVATO'))     return 'text-sky-400';
  if (value.startsWith('CUMPLIDOR'))  return 'text-brand-green-light';
  if (value.startsWith('SOCIO'))      return 'text-brand-violet';
  if (value === 'ELITE')              return 'text-purple-400';
  return 'text-text-secondary';
}

function getLevelBg(value: string): string {
  if (value.startsWith('NOVATO'))     return 'bg-sky-500/10 border-sky-500/30';
  if (value.startsWith('CUMPLIDOR'))  return 'bg-brand-green/10 border-brand-green/30';
  if (value.startsWith('SOCIO'))      return 'bg-brand-violet/10 border-brand-violet/30';
  if (value === 'ELITE')              return 'bg-purple-500/10 border-purple-500/30';
  return 'bg-surface-elevated border-surface-border';
}

function getFreqLabel(level: string): string {
  if (level === 'NOVATO_1') return 'Semanal';
  if (level === 'NOVATO_2' || level === 'NOVATO_3') return 'Semanal · Quincenal';
  return 'Semanal · Quincenal · Mensual';
}

const TOOLTIP_LEVEL_TEXT = 'Tu límite y tasa están determinados por tu nivel actual. Sube de nivel realizando tus pagos puntualmente.';

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

function getLevelIcon(value: string) {
  if (value === 'ELITE') return <Zap size={20} className="text-purple-400" />;
  if (value.startsWith('SOCIO')) return <Shield size={20} className="text-brand-violet" />;
  if (value.startsWith('CUMPLIDOR')) return <TrendingUp size={20} className="text-brand-green-light" />;
  return <Star size={20} className="text-sky-400" />;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await axios.get<UserProfile>(`${API}/users/me`, { headers: authHeaders() });
      setProfile(data);
    } catch {
      toast.error('No se pudo cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchProfile(); }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-text-secondary">
        Cargando perfil...
      </div>
    );
  }

  if (!profile) return null;

  const currentConfig = LEVELS.find(l => l.value === profile.level) ?? LEVELS[0];
  const currentIdx = LEVELS.findIndex(l => l.value === profile.level);
  const isElite = profile.level === 'ELITE';
  const isMaxAuto = profile.level === 'SOCIO_2';
  const nextConfig = !isElite ? LEVELS[currentIdx + 1] : null;

  // Progress bar calculation
  const pointsForCurrent = currentConfig.minPoints;
  const pointsForNext = nextConfig?.minPoints ?? currentConfig.minPoints;
  const pointsInRange = pointsForNext - pointsForCurrent;
  const pointsGained = profile.points - pointsForCurrent;
  const pct = isElite ? 100 : pointsInRange > 0 ? Math.min(100, (pointsGained / pointsInRange) * 100) : 100;
  const pointsNeeded = nextConfig ? Math.max(0, nextConfig.minPoints - profile.points) : 0;

  const barColor = isElite
    ? 'bg-purple-500'
    : profile.level.startsWith('SOCIO')
      ? 'bg-brand-violet-400'
      : profile.level.startsWith('CUMPLIDOR')
        ? 'bg-brand-green'
        : 'bg-sky-500';

  return (
    <div className="p-8 text-white font-sans max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/loans')}
        className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-8 font-medium"
      >
        <ArrowLeft size={18} />
        Volver a Mis Préstamos
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <User size={32} className="text-brand-green-light" />
          Mi Perfil
        </h1>
        <p className="text-text-secondary mt-2">Tu historial crediticio y progreso de nivel</p>
      </div>

      {/* ── Tarjeta de nivel actual ── */}
      <div className={`rounded-2xl border p-6 mb-6 ${getLevelBg(profile.level)}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getLevelBg(profile.level)} border`}>
              {getLevelIcon(profile.level)}
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Nivel Actual</p>
              <h2 className={`text-2xl font-extrabold ${getLevelColor(profile.level)}`}>
                {currentConfig.label}
              </h2>
              {isElite && (
                <p className="text-xs text-purple-400/70 mt-0.5">Nivel máximo — acceso exclusivo</p>
              )}
              {isMaxAuto && (
                <p className="text-xs text-brand-violet/70 mt-0.5">Nivel tope automático — promoción ELITE manual</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Puntos Totales</p>
            <p className="text-4xl font-extrabold text-white">{profile.points}</p>
            <p className="text-xs text-text-muted mt-0.5">pts</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-text-secondary mb-2">
            <span>{currentConfig.label} — {currentConfig.minPoints} pts</span>
            {nextConfig && !isMaxAuto
              ? <span>{nextConfig.label} — {nextConfig.minPoints} pts</span>
              : isElite
                ? <span className="text-purple-400">Nivel máximo alcanzado</span>
                : <span className="text-brand-violet flex items-center gap-1"><Lock size={10} /> ELITE — Promoción manual</span>
            }
          </div>
          <div className="w-full bg-surface-card rounded-full h-3 overflow-hidden border border-surface-border">
            <div
              className={`${barColor} h-3 rounded-full transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {!isElite && (
            <p className="text-xs text-text-secondary mt-2 text-center">
              {isMaxAuto
                ? 'Has alcanzado el máximo automático. Habla con el administrador para ser promovido a Élite.'
                : <><strong className={getLevelColor(profile.level)}>{pointsNeeded} puntos</strong> más para llegar a <strong className="text-white">{nextConfig?.label}</strong></>
              }
            </p>
          )}
        </div>
      </div>

      {/* ── Beneficios actuales ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-card border border-surface-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">
            Límite de Crédito<InfoTooltip text={TOOLTIP_LEVEL_TEXT} />
          </p>
          <p className="text-2xl font-extrabold text-white">{fmt(Number(profile.creditLimit))}</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">
            Tasa de Interés<InfoTooltip text={TOOLTIP_LEVEL_TEXT} />
          </p>
          <p className="text-2xl font-extrabold text-brand-green-light">{Number(profile.currentRate).toFixed(0)}%</p>
          <p className="text-xs text-text-muted mt-0.5">anual</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">Plazo Máximo</p>
          <p className="text-2xl font-extrabold text-white">{currentConfig.maxMonths}</p>
          <p className="text-xs text-text-muted mt-0.5">meses</p>
        </div>
      </div>

      {/* ── Beneficios del siguiente nivel ── */}
      {nextConfig && !isElite && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ChevronRight size={16} className="text-text-secondary" />
            <p className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Próximo nivel: <span className={getLevelColor(nextConfig.value)}>{nextConfig.label}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-surface-base rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">Límite</p>
              <p className="text-white font-bold">{fmt(nextConfig.creditLimit)}</p>
              {nextConfig.creditLimit > currentConfig.creditLimit && (
                <p className="text-brand-green-light text-xs mt-0.5">+{fmt(nextConfig.creditLimit - currentConfig.creditLimit)}</p>
              )}
            </div>
            <div className="bg-surface-base rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">Tasa</p>
              <p className="text-brand-green-light font-bold">{nextConfig.rate}%</p>
              {nextConfig.rate < currentConfig.rate && (
                <p className="text-brand-green-light text-xs mt-0.5">-{currentConfig.rate - nextConfig.rate}%</p>
              )}
            </div>
            <div className="bg-surface-base rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">Plazo</p>
              <p className="text-white font-bold">{nextConfig.maxMonths} meses</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla de niveles ── */}
      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Tabla de Niveles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-text-muted uppercase tracking-wider">
                <th className="text-left px-5 py-3">Nivel</th>
                <th className="text-right px-5 py-3">Puntos</th>
                <th className="text-right px-5 py-3">Límite</th>
                <th className="text-right px-5 py-3">Tasa</th>
                <th className="text-right px-5 py-3">Plazo</th>
                <th className="text-right px-5 py-3">Frecuencias</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((lvl) => {
                const isCurrentLevel = lvl.value === profile.level;
                const isLocked = lvl.value === 'ELITE' && profile.level !== 'ELITE';
                return (
                  <tr
                    key={lvl.value}
                    className={`border-b border-surface-border/50 transition-colors ${isCurrentLevel ? 'bg-surface-elevated/40' : 'hover:bg-surface-elevated/20'}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {isCurrentLevel && (
                          <div className="w-2 h-2 rounded-full bg-brand-green-400 animate-pulse shrink-0" />
                        )}
                        <span className={`font-semibold ${isCurrentLevel ? getLevelColor(lvl.value) : isLocked ? 'text-text-muted' : 'text-text-primary'}`}>
                          {lvl.label}
                        </span>
                        {isLocked && <Lock size={11} className="text-text-muted" />}
                      </div>
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isCurrentLevel ? 'text-white font-bold' : isLocked ? 'text-text-muted' : 'text-text-secondary'}`}>
                      {lvl.value === 'ELITE' ? '✦ Manual' : `${lvl.minPoints} pts`}
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums font-semibold ${isCurrentLevel ? 'text-white' : isLocked ? 'text-text-muted' : 'text-text-primary'}`}>
                      {fmt(lvl.creditLimit)}
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isCurrentLevel ? 'text-brand-green-light font-bold' : isLocked ? 'text-text-muted' : 'text-text-secondary'}`}>
                      {lvl.rate}%
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isCurrentLevel ? 'text-white' : isLocked ? 'text-text-muted' : 'text-text-secondary'}`}>
                      {lvl.maxMonths} meses
                    </td>
                    <td className={`px-5 py-3 text-right text-xs ${isCurrentLevel ? 'text-brand-green-light font-semibold' : isLocked ? 'text-text-muted' : 'text-text-secondary'}`}>
                      {getFreqLabel(lvl.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-surface-border flex flex-wrap gap-4 text-xs text-text-muted">
          <span>+10puntos por cada pago puntual</span>
          <span>·</span>
          <span>+50 pts al liquidar un préstamo</span>
          <span>·</span>
          <span>Atrasos &gt;15 días resetean a Novato I</span>
        </div>
      </div>
    </div>
  );
}
