import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { AlertTriangle, Check, SlidersHorizontal, X } from 'lucide-react';
import {
  API, FREQUENCIES, USER_LEVELS, authHeaders,
  type LoanLevel, type PaymentFrequency,
} from './loanLevelTypes';

interface LoanLevelFormModalProps {
  level: LoanLevel | null;      // null = alta
  availableLevels: string[];    // valores de UserLevel aún sin fila (solo alta)
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  level: string;
  name: string;
  minPoints: string;
  maxAmount: string;
  interestRate: string;
  term: string;
  order: string;
  frequencies: PaymentFrequency[];
  autoPromote: boolean;
  isActive: boolean;
}

const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors';
const labelCls = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1';

function toForm(level: LoanLevel | null, availableLevels: string[], nextOrder: number): FormState {
  if (level) {
    return {
      level: level.level,
      name: level.name,
      minPoints: String(level.minPoints),
      maxAmount: String(Number(level.maxAmount)),
      interestRate: String(Number(level.interestRate)),
      term: String(level.term),
      order: String(level.order),
      frequencies: level.frequencies,
      autoPromote: level.autoPromote,
      isActive: level.isActive,
    };
  }
  const first = availableLevels[0] ?? '';
  return {
    level: first,
    name: USER_LEVELS.find((l) => l.value === first)?.label ?? '',
    minPoints: '', maxAmount: '', interestRate: '', term: '',
    order: String(nextOrder),
    frequencies: FREQUENCIES.map((f) => f.value),
    autoPromote: first !== 'ELITE',
    isActive: true,
  };
}

function toPayload(f: FormState) {
  return {
    name: f.name.trim(),
    minPoints: Number(f.minPoints),
    maxAmount: Number(f.maxAmount),
    interestRate: Number(f.interestRate),
    term: Number(f.term),
    order: Number(f.order),
    frequencies: FREQUENCIES.map((x) => x.value).filter((v) => f.frequencies.includes(v)),
    autoPromote: f.autoPromote,
    isActive: f.isActive,
  };
}

// [SUPER_ADMIN] Alta (POST /loan-levels) o edición (PATCH /loan-levels/:id) de un nivel
export default function LoanLevelFormModal({ level, availableLevels, nextOrder, onClose, onSaved }: LoanLevelFormModalProps) {
  const isEdit = level !== null;
  const [initial] = useState(() => toForm(level, availableLevels, nextOrder));
  const [form, setForm] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  const set = (key: 'name' | 'minPoints' | 'maxAmount' | 'interestRate' | 'term' | 'order') =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickLevel = (value: string) =>
    setForm((f) => ({
      ...f,
      level: value,
      name: USER_LEVELS.find((l) => l.value === value)?.label ?? f.name,
      autoPromote: value !== 'ELITE',
    }));

  const toggleFrequency = (value: PaymentFrequency) =>
    setForm((f) => ({
      ...f,
      frequencies: f.frequencies.includes(value) ? f.frequencies.filter((v) => v !== value) : [...f.frequencies, value],
    }));

  const ratesChanged = isEdit && (form.maxAmount !== initial.maxAmount || form.interestRate !== initial.interestRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.frequencies.length === 0) { toast.error('Selecciona al menos una frecuencia de pago'); return; }

    const payload = toPayload(form);
    setIsSaving(true);
    try {
      if (isEdit) {
        // Solo los campos que cambiaron: la bitácora registra exactamente lo editado
        const before = toPayload(initial);
        const changes = Object.fromEntries(
          Object.entries(payload).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(before[k as keyof typeof before])),
        );
        if (Object.keys(changes).length === 0) { onClose(); return; }
        await axios.patch(`${API}/loan-levels/${level.id}`, changes, { headers: authHeaders() });
        toast.success(`Nivel ${payload.name} actualizado`);
      } else {
        await axios.post(`${API}/loan-levels`, { level: form.level, ...payload }, { headers: authHeaders() });
        toast.success(`Nivel ${payload.name} creado`);
      }
      onSaved();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg ?? 'No se pudo guardar el nivel');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar nivel' : 'Nuevo nivel'}
        className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6"
      >
        <div className="flex justify-between items-center gap-3 mb-5">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
            <span className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-2">
              <SlidersHorizontal size={20} className="text-brand-green-light" />
            </span>
            {isEdit ? `Editar ${level.name}` : 'Nuevo nivel'}
          </h2>
          <button type="button" onClick={onClose} disabled={isSaving} className="p-1 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lvl-level" className={labelCls}>Nivel</label>
            {isEdit ? (
              <p id="lvl-level" className="font-mono text-sm text-text-primary py-2">{level.level}</p>
            ) : (
              <select id="lvl-level" value={form.level} onChange={(e) => pickLevel(e.target.value)} className={inputCls}>
                {availableLevels.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="lvl-name" className={labelCls}>Nombre</label>
            <input id="lvl-name" required maxLength={40} value={form.name} onChange={set('name')} className={inputCls} />
          </div>
          <div>
            <label htmlFor="lvl-points" className={labelCls}>Puntos requeridos</label>
            <input id="lvl-points" type="number" required min="0" step="1" value={form.minPoints} onChange={set('minPoints')} className={inputCls} />
          </div>
          <div>
            <label htmlFor="lvl-amount" className={labelCls}>Límite (MXN)</label>
            <input id="lvl-amount" type="number" required min="1" step="0.01" value={form.maxAmount} onChange={set('maxAmount')} className={inputCls} />
          </div>
          <div>
            <label htmlFor="lvl-rate" className={labelCls}>Tasa (%)</label>
            <input id="lvl-rate" type="number" required min="0" max="999" step="0.01" value={form.interestRate} onChange={set('interestRate')} className={inputCls} />
          </div>
          <div>
            <label htmlFor="lvl-term" className={labelCls}>Plazo máximo (meses)</label>
            <input id="lvl-term" type="number" required min="1" max="120" step="1" value={form.term} onChange={set('term')} className={inputCls} />
          </div>
          <div>
            <label htmlFor="lvl-order" className={labelCls}>Orden</label>
            <input id="lvl-order" type="number" required min="0" step="1" value={form.order} onChange={set('order')} className={inputCls} />
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className={labelCls}>Frecuencias permitidas</legend>
          <div className="flex flex-wrap gap-2">
            {FREQUENCIES.map(({ value, label }) => {
              const on = form.frequencies.includes(value);
              return (
                <button
                  key={value} type="button" aria-pressed={on} onClick={() => toggleFrequency(value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                    on ? 'bg-brand-green/15 border-brand-green/40 text-brand-green-light' : 'bg-surface-base border-surface-border text-text-secondary hover:text-white'
                  }`}
                >
                  {on && <Check size={14} />} {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-3 text-sm text-text-primary cursor-pointer">
            <input type="checkbox" checked={form.autoPromote} onChange={(e) => setForm((f) => ({ ...f, autoPromote: e.target.checked }))} className="accent-brand-green w-4 h-4" />
            Se alcanza automáticamente por puntos
            <span className="text-text-muted text-xs">(desmarcado = solo promoción manual)</span>
          </label>
          <label className="flex items-center gap-3 text-sm text-text-primary cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="accent-brand-green w-4 h-4" />
            Nivel activo
          </label>
        </div>

        {ratesChanged && (
          <p className="mt-4 flex gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <AlertTriangle size={16} className="shrink-0" />
            El nuevo límite y tasa se aplicarán de inmediato a todos los usuarios que hoy están en este nivel.
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-surface-border">
          <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 bg-surface-elevated hover:bg-surface-elevated/70 text-text-primary py-2.5 rounded-xl transition-all font-medium">
            Cancelar
          </button>
          <button type="submit" disabled={isSaving} className="flex-1 bg-brand-green hover:bg-brand-green-light text-white py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-brand-green/20 disabled:opacity-50">
            {isSaving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear nivel'}
          </button>
        </div>
      </form>
    </div>
  );
}
