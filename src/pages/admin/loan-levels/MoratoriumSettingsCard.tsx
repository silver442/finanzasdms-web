import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Clock, Save } from 'lucide-react';
import { useCollectionSettings, type CollectionSettings } from '../../../hooks/useCollectionSettings';
import { API, authHeaders } from './loanLevelTypes';

const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors';
const labelCls = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1';

// Formulario con los valores cargados; se monta cuando ya llegó la configuración
function MoratoriumForm({ initial }: { initial: CollectionSettings }) {
  const [saved, setSaved] = useState(initial);
  const [graceDays, setGraceDays] = useState(String(initial.moratoriumGraceDays));
  const [feePerDay, setFeePerDay] = useState(String(initial.moratoriumFeePerDay));
  const [isSaving, setIsSaving] = useState(false);

  const changes: Partial<CollectionSettings> = {
    ...(Number(graceDays) !== saved.moratoriumGraceDays && { moratoriumGraceDays: Number(graceDays) }),
    ...(Number(feePerDay) !== saved.moratoriumFeePerDay && { moratoriumFeePerDay: Number(feePerDay) }),
  };
  const isDirty = Object.keys(changes).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    setIsSaving(true);
    try {
      const { data } = await axios.patch<CollectionSettings>(`${API}/collection-settings`, changes, { headers: authHeaders() });
      setSaved(data);
      toast.success('Mora por atraso actualizada');
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg ?? 'No se pudo guardar la mora');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-end gap-4">
      <div className="flex-1">
        <label htmlFor="mora-grace" className={labelCls}>Días de gracia</label>
        <input id="mora-grace" type="number" required min="0" max="365" step="1" value={graceDays} onChange={(e) => setGraceDays(e.target.value)} className={inputCls} />
      </div>
      <div className="flex-1">
        <label htmlFor="mora-fee" className={labelCls}>Mora por día (MXN)</label>
        <input id="mora-fee" type="number" required min="0" max="10000" step="0.01" value={feePerDay} onChange={(e) => setFeePerDay(e.target.value)} className={inputCls} />
      </div>
      <button
        type="submit" disabled={!isDirty || isSaving}
        className="inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl px-4 py-2 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}

// [SUPER_ADMIN] Mora diaria tras los días de gracia (PATCH /collection-settings)
export default function MoratoriumSettingsCard() {
  const { settings, isLoading } = useCollectionSettings();

  return (
    <div className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card p-5 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 shrink-0">
          <Clock size={20} className="text-amber-400" />
        </span>
        <div>
          <h2 className="font-bold text-text-primary">Mora por atraso</h2>
          <p className="text-text-secondary text-sm">
            Pasados los días de gracia desde el vencimiento, cada cuota vencida suma la mora por día a su saldo.
            Aplica desde el siguiente corte de medianoche; la mora ya cobrada no cambia.
          </p>
        </div>
      </div>
      {isLoading
        ? <p className="text-text-secondary text-sm">Cargando...</p>
        : <MoratoriumForm initial={settings} />}
    </div>
  );
}
