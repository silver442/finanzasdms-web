import { useState } from 'react';
import { toast } from 'sonner';
import {
  CalendarClock, CalendarDays, Check, ChevronDown, Clock, CreditCard,
  DollarSign, RefreshCw, Users, X,
} from 'lucide-react';
import ServiceLogo from '../../../components/ServiceLogo';
import ServicePicker from './ServicePicker';
import MemberPicker from './MemberPicker';
import { type PickedMember, type SubFormValues } from './subscriptionUtils';

interface CardOption { id: string; name: string; }

interface SubscriptionFormProps {
  mode: 'create' | 'edit';
  initialValues: SubFormValues;
  cards: CardOption[];
  saving: boolean;
  onSubmit: (values: SubFormValues, shareEmails: string[]) => void;
  onCancel: () => void;
}

const fieldCls = 'w-full bg-surface-base/70 border border-surface-border text-white rounded-xl pl-14 pr-4 py-3.5 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-colors placeholder:text-text-muted';
const labelCls = 'block text-text-primary text-sm font-semibold mb-2';

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary pointer-events-none">
      {children}
    </span>
  );
}

// Panel ilustrado de la izquierda (solo en pantallas grandes)
function FormHero() {
  return (
    <div className="hidden lg:flex relative flex-col justify-end w-5/12 shrink-0 overflow-hidden bg-gradient-to-br from-brand-green/30 via-surface-card to-surface-base p-10 border-r border-white/5">
      <div className="absolute -bottom-24 -left-16 w-96 h-96 bg-brand-green-dark/20 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute inset-x-0 top-10 flex justify-center">
        <div className="relative w-64 h-64">
          <div className="absolute left-2 top-6 -rotate-12"><ServiceLogo name="Netflix" size="lg" /></div>
          <div className="absolute left-20 top-0 rotate-6"><ServiceLogo name="Spotify" size="lg" /></div>
          <div className="absolute right-4 top-10 rotate-12"><ServiceLogo name="Claude" size="lg" /></div>
          <div className="absolute right-0 top-32 rotate-6"><ServiceLogo name="YouTube" size="lg" /></div>
          <div className="absolute left-12 top-24 w-36 h-36 rounded-3xl bg-surface-elevated/90 border border-white/10 shadow-2xl shadow-black/40 flex items-center justify-center">
            <CalendarDays size={84} className="text-brand-green-light" strokeWidth={1.5} />
          </div>
          <div className="absolute left-36 top-48 w-16 h-16 rounded-full bg-surface-base border-4 border-brand-green flex items-center justify-center shadow-xl shadow-brand-green/20">
            <Clock size={30} className="text-brand-green-light" />
          </div>
        </div>
      </div>

      <div className="relative">
        <h3 className="text-3xl font-extrabold text-white leading-tight">
          Registra tu<br /><span className="text-brand-green-light text-4xl">suscripción</span>
        </h3>
        <p className="text-text-secondary mt-3 leading-relaxed">
          Mantén un control de tus suscripciones y nunca pierdas de vista tus pagos.
        </p>
      </div>
    </div>
  );
}

export default function SubscriptionForm({ mode, initialValues, cards, saving, onSubmit, onCancel }: SubscriptionFormProps) {
  const [values, setValues] = useState<SubFormValues>(initialValues);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [members, setMembers] = useState<PickedMember[]>([]);

  const set = (key: keyof SubFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) { toast.error('Selecciona un servicio o escribe su nombre'); return; }
    if (shareEnabled && members.length === 0) { toast.error('Agrega al menos un miembro de Cashi para compartir'); return; }
    onSubmit(values, shareEnabled ? members.map((m) => m.email) : []);
  };

  const isCreate = mode === 'create';

  return (
    <div className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-3xl shadow-card overflow-hidden flex">
      <FormHero />

      <form onSubmit={handleSubmit} className="flex-1 p-5 sm:p-8 lg:p-10 flex flex-col gap-6 min-w-0">
        <div className="flex items-start gap-4 pb-6 border-b border-surface-border">
          <div className="bg-brand-green/10 border border-brand-green/25 rounded-2xl p-3 shrink-0">
            <CalendarClock size={26} className="text-brand-green-light" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{isCreate ? 'Nueva Suscripción' : 'Editar Suscripción'}</h2>
            <p className="text-text-secondary text-sm mt-1">
              {isCreate ? 'Completa la información para agregar tu suscripción.' : 'Actualiza los datos de tu suscripción.'}
            </p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar formulario" className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-surface-elevated/60 transition-colors">
            <X size={22} />
          </button>
        </div>

        <div>
          <label htmlFor="sub-name" className={labelCls}>Nombre del servicio *</label>
          <ServicePicker
            id="sub-name" value={values.name}
            onChange={(name) => setValues((prev) => ({ ...prev, name }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="sub-amount" className={labelCls}>Monto (MXN) *</label>
            <div className="relative">
              <FieldIcon><DollarSign size={18} className="text-brand-green-light" /></FieldIcon>
              <input id="sub-amount" type="number" required min="0.01" step="0.01" placeholder="0.00" value={values.amount} onChange={set('amount')} className={fieldCls} />
            </div>
          </div>

          <div>
            <label htmlFor="sub-frequency" className={labelCls}>Frecuencia *</label>
            <div className="relative">
              <FieldIcon><CalendarDays size={18} /></FieldIcon>
              <select id="sub-frequency" value={values.frequency} onChange={set('frequency')} className={`${fieldCls} appearance-none pr-10`}>
                <option value="MONTHLY">Mensual</option>
                <option value="BIMONTHLY">Bimestral</option>
                <option value="YEARLY">Anual</option>
              </select>
              <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="sub-day" className={labelCls}>Día de cobro (1–31) *</label>
            <div className="relative">
              <FieldIcon><CalendarDays size={18} /></FieldIcon>
              <input id="sub-day" type="number" required min="1" max="31" step="1" placeholder="Ej. 15" value={values.chargeDay} onChange={set('chargeDay')} className={fieldCls} />
            </div>
          </div>

          <div>
            <label htmlFor="sub-card" className={labelCls}>Tarjeta vinculada (opcional)</label>
            <div className="relative">
              <FieldIcon><CreditCard size={18} /></FieldIcon>
              <select id="sub-card" value={values.creditCardId} onChange={set('creditCardId')} className={`${fieldCls} appearance-none pr-10`}>
                <option value="">Selecciona una tarjeta</option>
                {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
          </div>
        </div>

        {isCreate && (
          <div className="bg-surface-base/50 border border-surface-border rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-3 shrink-0">
                <Users size={22} className="text-brand-green-light" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">¿Compartir este gasto?</p>
                <p className="text-text-secondary text-sm">Divide el costo con amigos o familiares.</p>
              </div>
              <button
                type="button" role="switch" aria-checked={shareEnabled} aria-label="Compartir este gasto"
                onClick={() => setShareEnabled((v) => !v)}
                className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${shareEnabled ? 'bg-brand-green' : 'bg-surface-elevated'}`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${shareEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {shareEnabled && (
              <div className="flex flex-col gap-2">
                <p className="text-text-muted text-xs">Solo puedes compartir con personas registradas en Cashi. Recibirán la invitación en su pestaña "Compartidas conmigo".</p>
                <MemberPicker members={members} onChange={setMembers} />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 bg-surface-elevated hover:bg-surface-elevated/70 text-white py-3.5 rounded-2xl transition-all font-semibold">
            Cancelar
          </button>
          <button
            type="submit" disabled={saving}
            className="flex-1 bg-brand-green hover:bg-brand-green-light text-white py-3.5 rounded-2xl transition-all font-bold shadow-lg shadow-brand-green/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <><RefreshCw size={16} className="animate-spin" /> Guardando...</>
              : <><Check size={18} /> {isCreate ? 'Guardar Suscripción' : 'Guardar Cambios'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
