import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { User, Star, TrendingUp, Shield, Zap, Lock, ChevronRight } from 'lucide-react';

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

const API = 'http://localhost:3000';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function fmt(v: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
}

function getLevelColor(value: string): string {
  if (value.startsWith('NOVATO'))     return 'text-sky-400';
  if (value.startsWith('CUMPLIDOR'))  return 'text-emerald-400';
  if (value.startsWith('SOCIO'))      return 'text-amber-400';
  if (value === 'ELITE')              return 'text-purple-400';
  return 'text-slate-400';
}

function getLevelBg(value: string): string {
  if (value.startsWith('NOVATO'))     return 'bg-sky-500/10 border-sky-500/30';
  if (value.startsWith('CUMPLIDOR'))  return 'bg-emerald-500/10 border-emerald-500/30';
  if (value.startsWith('SOCIO'))      return 'bg-amber-500/10 border-amber-500/30';
  if (value === 'ELITE')              return 'bg-purple-500/10 border-purple-500/30';
  return 'bg-slate-700 border-slate-600';
}

function getLevelIcon(value: string) {
  if (value === 'ELITE') return <Zap size={20} className="text-purple-400" />;
  if (value.startsWith('SOCIO')) return <Shield size={20} className="text-amber-400" />;
  if (value.startsWith('CUMPLIDOR')) return <TrendingUp size={20} className="text-emerald-400" />;
  return <Star size={20} className="text-sky-400" />;
}

export default function Profile() {
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
      <div className="flex justify-center items-center py-20 text-slate-400">
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
      ? 'bg-amber-400'
      : profile.level.startsWith('CUMPLIDOR')
        ? 'bg-emerald-500'
        : 'bg-sky-500';

  return (
    <div className="p-8 text-white font-sans max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <User size={32} className="text-emerald-400" />
          Mi Perfil
        </h1>
        <p className="text-slate-400 mt-2">Tu historial crediticio y progreso de nivel</p>
      </div>

      {/* ── Tarjeta de nivel actual ── */}
      <div className={`rounded-2xl border p-6 mb-6 ${getLevelBg(profile.level)}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getLevelBg(profile.level)} border`}>
              {getLevelIcon(profile.level)}
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Nivel Actual</p>
              <h2 className={`text-2xl font-extrabold ${getLevelColor(profile.level)}`}>
                {currentConfig.label}
              </h2>
              {isElite && (
                <p className="text-xs text-purple-400/70 mt-0.5">Nivel máximo — acceso exclusivo</p>
              )}
              {isMaxAuto && (
                <p className="text-xs text-amber-400/70 mt-0.5">Nivel tope automático — promoción ELITE manual</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Puntos Totales</p>
            <p className="text-4xl font-extrabold text-white">{profile.points}</p>
            <p className="text-xs text-slate-500 mt-0.5">pts</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>{currentConfig.label} — {currentConfig.minPoints} pts</span>
            {nextConfig && !isMaxAuto
              ? <span>{nextConfig.label} — {nextConfig.minPoints} pts</span>
              : isElite
                ? <span className="text-purple-400">Nivel máximo alcanzado</span>
                : <span className="text-amber-400 flex items-center gap-1"><Lock size={10} /> ELITE — Promoción manual</span>
            }
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
            <div
              className={`${barColor} h-3 rounded-full transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {!isElite && (
            <p className="text-xs text-slate-400 mt-2 text-center">
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
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Límite de Crédito</p>
          <p className="text-2xl font-extrabold text-white">{fmt(Number(profile.creditLimit))}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Tasa de Interés</p>
          <p className="text-2xl font-extrabold text-emerald-400">{Number(profile.currentRate).toFixed(0)}%</p>
          <p className="text-xs text-slate-500 mt-0.5">anual</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Plazo Máximo</p>
          <p className="text-2xl font-extrabold text-white">{currentConfig.maxMonths}</p>
          <p className="text-xs text-slate-500 mt-0.5">meses</p>
        </div>
      </div>

      {/* ── Beneficios del siguiente nivel ── */}
      {nextConfig && !isElite && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ChevronRight size={16} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Próximo nivel: <span className={getLevelColor(nextConfig.value)}>{nextConfig.label}</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Límite</p>
              <p className="text-white font-bold">{fmt(nextConfig.creditLimit)}</p>
              {nextConfig.creditLimit > currentConfig.creditLimit && (
                <p className="text-emerald-400 text-xs mt-0.5">+{fmt(nextConfig.creditLimit - currentConfig.creditLimit)}</p>
              )}
            </div>
            <div className="bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Tasa</p>
              <p className="text-emerald-400 font-bold">{nextConfig.rate}%</p>
              {nextConfig.rate < currentConfig.rate && (
                <p className="text-emerald-400 text-xs mt-0.5">-{currentConfig.rate - nextConfig.rate}%</p>
              )}
            </div>
            <div className="bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Plazo</p>
              <p className="text-white font-bold">{nextConfig.maxMonths} meses</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla de niveles ── */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Tabla de Niveles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Nivel</th>
                <th className="text-right px-5 py-3">Puntos</th>
                <th className="text-right px-5 py-3">Límite</th>
                <th className="text-right px-5 py-3">Tasa</th>
                <th className="text-right px-5 py-3">Plazo</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((lvl) => {
                const isCurrentLevel = lvl.value === profile.level;
                const isLocked = lvl.value === 'ELITE' && profile.level !== 'ELITE';
                return (
                  <tr
                    key={lvl.value}
                    className={`border-b border-slate-700/50 transition-colors ${isCurrentLevel ? 'bg-slate-700/40' : 'hover:bg-slate-700/20'}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {isCurrentLevel && (
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        )}
                        <span className={`font-semibold ${isCurrentLevel ? getLevelColor(lvl.value) : isLocked ? 'text-slate-600' : 'text-slate-300'}`}>
                          {lvl.label}
                        </span>
                        {isLocked && <Lock size={11} className="text-slate-600" />}
                      </div>
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isCurrentLevel ? 'text-white font-bold' : isLocked ? 'text-slate-600' : 'text-slate-400'}`}>
                      {lvl.value === 'ELITE' ? '✦ Manual' : `${lvl.minPoints} pts`}
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums font-semibold ${isCurrentLevel ? 'text-white' : isLocked ? 'text-slate-600' : 'text-slate-300'}`}>
                      {fmt(lvl.creditLimit)}
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isCurrentLevel ? 'text-emerald-400 font-bold' : isLocked ? 'text-slate-600' : 'text-slate-400'}`}>
                      {lvl.rate}%
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isCurrentLevel ? 'text-white' : isLocked ? 'text-slate-600' : 'text-slate-400'}`}>
                      {lvl.maxMonths} meses
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-700 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>+10 pts por pago puntual</span>
          <span>·</span>
          <span>+50 pts al liquidar un préstamo</span>
          <span>·</span>
          <span>Atrasos &gt;15 días resetean a Novato I</span>
        </div>
      </div>
    </div>
  );
}
