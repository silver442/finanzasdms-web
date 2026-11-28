import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Percent, Save, Settings2, Users, Wallet } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

interface PlatformConfig {
  maxActiveLoans: number;
  maxInvestors: number;
  acceptingInvestors: boolean;
  platformFeePercent: number;
}

const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors';
const labelCls = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1';

// Formulario con los valores cargados; se monta cuando ya llegó la configuración
function PlatformConfigForm({ initial }: { initial: PlatformConfig }) {
  const [saved, setSaved] = useState(initial);
  const [maxActiveLoans, setMaxActiveLoans] = useState(String(initial.maxActiveLoans));
  const [maxInvestors, setMaxInvestors] = useState(String(initial.maxInvestors));
  const [platformFeePercent, setPlatformFeePercent] = useState(String(initial.platformFeePercent));
  const [acceptingInvestors, setAcceptingInvestors] = useState(initial.acceptingInvestors);
  const [isSaving, setIsSaving] = useState(false);

  // Solo se envía lo que cambió (cada campo queda auditado)
  const changes: Partial<PlatformConfig> = {
    ...(Number(maxActiveLoans) !== saved.maxActiveLoans && { maxActiveLoans: Number(maxActiveLoans) }),
    ...(Number(maxInvestors) !== saved.maxInvestors && { maxInvestors: Number(maxInvestors) }),
    ...(Number(platformFeePercent) !== saved.platformFeePercent && { platformFeePercent: Number(platformFeePercent) }),
    ...(acceptingInvestors !== saved.acceptingInvestors && { acceptingInvestors }),
  };
  const isDirty = Object.keys(changes).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    setIsSaving(true);
    try {
      const { data } = await axios.patch<PlatformConfig>(`${API}/platform-config`, changes, { headers: authHeaders() });
      setSaved(data);
      toast.success('Configuración de plataforma actualizada');
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg ?? 'No se pudo guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card p-5">
        <SectionTitle icon={<Wallet size={20} className="text-brand-green-light" />} title="Capacidad de préstamos"
          text="Tope de préstamos activos y en fondeo en toda la plataforma. Al alcanzarlo, las nuevas solicitudes se rechazan con un aviso de capacidad temporal." />
        <div className="max-w-xs">
          <label htmlFor="cfg-max-loans" className={labelCls}>Máximo de préstamos activos</label>
          <input id="cfg-max-loans" type="number" required min="0" max="10000" step="1" value={maxActiveLoans} onChange={(e) => setMaxActiveLoans(e.target.value)} className={inputCls} />
        </div>
      </section>

      <section className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card p-5">
        <SectionTitle icon={<Users size={20} className="text-brand-violet-light" />} title="Inversionistas"
          text="Controla si se pueden dar de alta nuevos inversionistas y cuántos admite la plataforma." />
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label htmlFor="cfg-max-investors" className={labelCls}>Máximo de inversionistas</label>
            <input id="cfg-max-investors" type="number" required min="0" max="10000" step="1" value={maxInvestors} onChange={(e) => setMaxInvestors(e.target.value)} className={inputCls} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none py-2">
            <button
              type="button" role="switch" aria-checked={acceptingInvestors} onClick={() => setAcceptingInvestors((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${acceptingInvestors ? 'bg-brand-green' : 'bg-surface-elevated'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${acceptingInvestors ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-text-primary">
              {acceptingInvestors ? 'Registro de inversionistas abierto' : 'Registro de inversionistas cerrado'}
            </span>
          </label>
        </div>
      </section>

      <section className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card p-5">
        <SectionTitle icon={<Percent size={20} className="text-amber-400" />} title="Comisión de plataforma"
          text="Porcentaje que retiene la plataforma sobre el interés que cobra cada cuota a ADMIN e INVESTOR. Lo que fondea el SuperAdmin no paga comisión. Aplica a los pagos que se registren desde ahora." />
        <div className="max-w-xs">
          <label htmlFor="cfg-fee" className={labelCls}>Comisión sobre intereses (%)</label>
          <input id="cfg-fee" type="number" required min="0" max="100" step="0.01" value={platformFeePercent} onChange={(e) => setPlatformFeePercent(e.target.value)} className={inputCls} />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit" disabled={!isDirty || isSaving}
          className="inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

function SectionTitle({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="bg-surface-elevated/60 border border-white/5 rounded-xl p-2 shrink-0">{icon}</span>
      <div>
        <h2 className="font-bold text-text-primary">{title}</h2>
        <p className="text-text-secondary text-sm">{text}</p>
      </div>
    </div>
  );
}

// [SUPER_ADMIN] Cupos, inversionistas y comisión (GET/PATCH /platform-config)
export default function AdminPlatformConfig() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);

  useEffect(() => {
    axios.get<PlatformConfig>(`${API}/platform-config`, { headers: authHeaders() })
      .then(({ data }) => setConfig(data))
      .catch(() => toast.error('No se pudo cargar la configuración de plataforma'));
  }, []);

  return (
    <div className="p-4 sm:p-8 text-white font-sans max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary flex items-center gap-3">
          <Settings2 size={30} className="text-brand-green-light" />
          Configuración de Plataforma
        </h1>
        <p className="text-text-secondary mt-2">Reglas globales del fondeo colectivo. Cada cambio queda en la bitácora.</p>
      </div>
      {config
        ? <PlatformConfigForm initial={config} />
        : <p className="text-text-secondary text-sm">Cargando...</p>}
    </div>
  );
}
