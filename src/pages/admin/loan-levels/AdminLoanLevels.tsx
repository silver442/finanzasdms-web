import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Pencil, Plus, Power, SlidersHorizontal, Trash2 } from 'lucide-react';
import DangerConfirmModal from '../../../components/DangerConfirmModal';
import LoanLevelFormModal from './LoanLevelFormModal';
import MoratoriumSettingsCard from './MoratoriumSettingsCard';
import { API, FREQUENCIES, USER_LEVELS, authHeaders, fmt, type LoanLevel } from './loanLevelTypes';

type Confirm = { kind: 'delete' | 'deactivate'; level: LoanLevel };
type FormTarget = { level: LoanLevel | null };

const FREQ_SHORT: Record<string, string> = { SEMANAL: 'Sem', QUINCENAL: 'Qna', MENSUAL: 'Men' };

function apiMessage(err: any, fallback: string): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const msg = err?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg ?? fallback;
}

function FrequencyChips({ level }: { level: LoanLevel }) {
  return (
    <div className="flex flex-wrap gap-1">
      {FREQUENCIES.filter((f) => level.frequencies.includes(f.value)).map((f) => (
        <span key={f.value} title={f.label} className="bg-surface-elevated/70 text-text-secondary text-xs font-semibold px-2 py-0.5 rounded-md">
          {FREQ_SHORT[f.value]}
        </span>
      ))}
    </div>
  );
}

function StatusBadges({ level }: { level: LoanLevel }) {
  return (
    <div className="flex flex-wrap gap-1">
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${level.isActive ? 'bg-brand-green/20 text-brand-green-light' : 'bg-slate-500/20 text-slate-300'}`}>
        {level.isActive ? 'ACTIVO' : 'INACTIVO'}
      </span>
      {!level.autoPromote && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">MANUAL</span>
      )}
    </div>
  );
}

// [SUPER_ADMIN] Configuración de los niveles de préstamo (/loan-levels)
export default function AdminLoanLevels() {
  const [levels, setLevels] = useState<LoanLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() =>
    axios.get<LoanLevel[]>(`${API}/loan-levels`, { headers: authHeaders() })
      .then((res) => setLevels(res.data))
      .catch((err) => { toast.error(apiMessage(err, 'Error al cargar los niveles')); })
      .finally(() => setIsLoading(false)), []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () => [...levels].sort((a, b) => a.order - b.order || a.minPoints - b.minPoints),
    [levels],
  );
  const availableLevels = useMemo(
    () => USER_LEVELS.map((l) => l.value).filter((v) => !levels.some((l) => l.level === v)),
    [levels],
  );
  const nextOrder = levels.reduce((max, l) => Math.max(max, l.order), 0) + 1;

  const setActive = async (level: LoanLevel, isActive: boolean) => {
    setBusyId(level.id);
    try {
      await axios.patch(`${API}/loan-levels/${level.id}`, { isActive }, { headers: authHeaders() });
      toast.success(`${level.name} ${isActive ? 'activado' : 'desactivado'}`);
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo cambiar el estado del nivel'));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (level: LoanLevel) => {
    setBusyId(level.id);
    try {
      await axios.delete(`${API}/loan-levels/${level.id}`, { headers: authHeaders() });
      toast.success(`${level.name} eliminado`);
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo eliminar el nivel'));
    } finally {
      setBusyId(null);
    }
  };

  const onSaved = () => { setFormTarget(null); void load(); };

  const actions = (level: LoanLevel) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => setFormTarget({ level })}
        className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-surface-elevated/60 transition-colors"
        aria-label={`Editar ${level.name}`} title="Editar"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={() => (level.isActive ? setConfirm({ kind: 'deactivate', level }) : void setActive(level, true))}
        disabled={busyId === level.id}
        className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${level.isActive ? 'text-text-secondary hover:text-amber-400 hover:bg-amber-500/10' : 'text-brand-green-light hover:bg-brand-green/10'}`}
        aria-label={level.isActive ? `Desactivar ${level.name}` : `Activar ${level.name}`}
        title={level.isActive ? 'Desactivar' : 'Activar'}
      >
        <Power size={16} />
      </button>
      <button
        onClick={() => setConfirm({ kind: 'delete', level })}
        disabled={busyId === level.id}
        className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
        aria-label={`Eliminar ${level.name}`} title="Eliminar"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 text-white font-sans max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary flex items-center gap-3">
            <SlidersHorizontal size={32} className="text-brand-green-light" />
            Edición de Préstamos
          </h1>
          <p className="text-text-secondary mt-2">Mora por atraso y límite, tasa, plazo y frecuencias de cada nivel. Los cambios quedan en la bitácora.</p>
        </div>
        <button
          onClick={() => setFormTarget({ level: null })}
          disabled={availableLevels.length === 0}
          title={availableLevels.length === 0 ? 'Todos los niveles ya están configurados' : undefined}
          className="inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl px-4 py-2.5 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={18} /> Agregar nivel
        </button>
      </div>

      <MoratoriumSettingsCard />

      {isLoading ? (
        <div className="flex justify-center py-20 text-text-secondary">Cargando niveles...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <SlidersHorizontal size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay niveles configurados. Se usan los valores por defecto hasta que agregues uno.</p>
        </div>
      ) : (
        <div className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card overflow-hidden">
          {/* Tabla (escritorio) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-base/40 text-text-secondary">
                  <th className="text-left px-5 py-3 font-semibold">Nivel</th>
                  <th className="text-right px-5 py-3 font-semibold">Puntos</th>
                  <th className="text-right px-5 py-3 font-semibold">Límite</th>
                  <th className="text-right px-5 py-3 font-semibold">Tasa</th>
                  <th className="text-right px-5 py-3 font-semibold">Plazo</th>
                  <th className="text-left px-5 py-3 font-semibold">Frecuencia</th>
                  <th className="text-left px-5 py-3 font-semibold">Estado</th>
                  <th className="text-right px-5 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {sorted.map((level) => (
                  <tr key={level.id} className={`hover:bg-surface-elevated/20 transition-colors ${level.isActive ? '' : 'opacity-60'}`}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-white">{level.name}</p>
                      <p className="font-mono text-xs text-text-muted">{level.level}</p>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{level.autoPromote ? level.minPoints.toLocaleString('es-MX') : '—'}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold">{fmt(level.maxAmount)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{Number(level.interestRate)}%</td>
                    <td className="px-5 py-3 text-right tabular-nums">{level.term} meses</td>
                    <td className="px-5 py-3"><FrequencyChips level={level} /></td>
                    <td className="px-5 py-3"><StatusBadges level={level} /></td>
                    <td className="px-5 py-3">{actions(level)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas (móvil) */}
          <div className="md:hidden divide-y divide-surface-border/60">
            {sorted.map((level) => (
              <div key={level.id} className={`p-4 flex flex-col gap-3 ${level.isActive ? '' : 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{level.name}</p>
                    <p className="font-mono text-xs text-text-muted">{level.level}</p>
                  </div>
                  {actions(level)}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-text-muted text-xs">Puntos</dt><dd className="tabular-nums">{level.autoPromote ? level.minPoints.toLocaleString('es-MX') : 'Manual'}</dd></div>
                  <div><dt className="text-text-muted text-xs">Límite</dt><dd className="tabular-nums font-semibold">{fmt(level.maxAmount)}</dd></div>
                  <div><dt className="text-text-muted text-xs">Tasa</dt><dd className="tabular-nums">{Number(level.interestRate)}%</dd></div>
                  <div><dt className="text-text-muted text-xs">Plazo</dt><dd className="tabular-nums">{level.term} meses</dd></div>
                </dl>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FrequencyChips level={level} />
                  <StatusBadges level={level} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {formTarget && (
        <LoanLevelFormModal
          level={formTarget.level}
          availableLevels={availableLevels}
          nextOrder={nextOrder}
          onClose={() => setFormTarget(null)}
          onSaved={onSaved}
        />
      )}

      {confirm?.kind === 'delete' && (
        <DangerConfirmModal
          title="Eliminar nivel"
          confirmLabel="Eliminar"
          isSubmitting={busyId === confirm.level.id}
          onConfirm={() => void remove(confirm.level)}
          onClose={() => setConfirm(null)}
        >
          <p>¿Eliminar <strong className="text-white">{confirm.level.name}</strong> ({confirm.level.level})?</p>
          <p>Solo se puede eliminar si ningún usuario está en este nivel. Si hay usuarios, desactívalo en su lugar.</p>
        </DangerConfirmModal>
      )}

      {confirm?.kind === 'deactivate' && (
        <DangerConfirmModal
          title="Desactivar nivel"
          confirmLabel="Desactivar"
          isSubmitting={busyId === confirm.level.id}
          onConfirm={() => void setActive(confirm.level, false)}
          onClose={() => setConfirm(null)}
        >
          <p>¿Desactivar <strong className="text-white">{confirm.level.name}</strong>?</p>
          <p>Saldrá de la escalera de ascensos y descensos, y los usuarios que hoy están en él no podrán solicitar préstamos hasta que lo reactives.</p>
        </DangerConfirmModal>
      )}
    </div>
  );
}
