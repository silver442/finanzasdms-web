import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, User, Lock } from 'lucide-react';
import LevelOverview from '../../components/LevelOverview';
import { getLevelColor } from '../../utils/levelStyles';
import { FREQUENCY_LABEL, useLoanLevels, type PaymentFrequency } from '../../hooks/useLoanLevels';

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

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function fmtMxn(v: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
}

function getFreqLabel(frequencies: PaymentFrequency[]): string {
  return frequencies.map((f) => FREQUENCY_LABEL[f]).join(' · ');
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Tabla de niveles configurada por el SUPER_ADMIN (GET /loan-levels)
  const { levels } = useLoanLevels();

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

      <LevelOverview
        level={profile.level}
        points={profile.points}
        creditLimit={profile.creditLimit}
        currentRate={profile.currentRate}
        levels={levels}
      />

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
              {levels.map((lvl) => {
                const isCurrentLevel = lvl.level === profile.level;
                const isLocked = !lvl.autoPromote && !isCurrentLevel;
                return (
                  <tr
                    key={lvl.level}
                    className={`border-b border-surface-border/50 transition-colors ${isCurrentLevel ? 'bg-surface-elevated/40' : 'hover:bg-surface-elevated/20'}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {isCurrentLevel && (
                          <div className="w-2 h-2 rounded-full bg-brand-green-400 animate-pulse shrink-0" />
                        )}
                        <span className={`font-semibold ${isCurrentLevel ? getLevelColor(lvl.level) : isLocked ? 'text-text-muted' : 'text-text-primary'}`}>
                          {lvl.name}
                        </span>
                        {isLocked && <Lock size={11} className="text-text-muted" />}
                      </div>
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isCurrentLevel ? 'text-white font-bold' : isLocked ? 'text-text-muted' : 'text-text-secondary'}`}>
                      {lvl.autoPromote ? `${lvl.minPoints} pts` : '✦ Manual'}
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums font-semibold ${isCurrentLevel ? 'text-white' : isLocked ? 'text-text-muted' : 'text-text-primary'}`}>
                      {fmtMxn(lvl.maxAmount)}
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isCurrentLevel ? 'text-brand-green-light font-bold' : isLocked ? 'text-text-muted' : 'text-text-secondary'}`}>
                      {lvl.interestRate}%
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isCurrentLevel ? 'text-white' : isLocked ? 'text-text-muted' : 'text-text-secondary'}`}>
                      {lvl.term} meses
                    </td>
                    <td className={`px-5 py-3 text-right text-xs ${isCurrentLevel ? 'text-brand-green-light font-semibold' : isLocked ? 'text-text-muted' : 'text-text-secondary'}`}>
                      {getFreqLabel(lvl.frequencies)}
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
