import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, Save, UserRound } from 'lucide-react';
import { API, apiError, authHeaders } from '../../components/investor/investorTypes';
import { PAYOUT_TYPES, PHONE_DIGITS, onlyDigits, payoutTypeOf, type PayoutType } from '../../components/investor/payoutAccount';
import InvestorPageHeader from './InvestorPageHeader';

// GET/PATCH /investor-profile/me
interface InvestorProfileData {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  investorAlias: string | null;
  state: string | null;
  country: string | null;
  payoutBank: { id: string; bankName: string; clabe: string; accountHolder: string } | null;
}

const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted disabled:opacity-60';
const labelCls = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1';
const sectionCls = 'bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card p-5 sm:p-6';

const ALIAS_RE = /^[A-Za-z0-9._-]{3,30}$/;

type Form = {
  name: string; phone: string; investorAlias: string; state: string; country: string;
  payoutBankName: string; payoutClabe: string; payoutAccountHolder: string;
};

function toForm(p: InvestorProfileData): Form {
  return {
    name: p.name ?? '', phone: p.phone ?? '', investorAlias: p.investorAlias ?? '',
    state: p.state ?? '', country: p.country ?? '',
    payoutBankName: p.payoutBank?.bankName ?? '', payoutClabe: p.payoutBank?.clabe ?? '',
    payoutAccountHolder: p.payoutBank?.accountHolder ?? '',
  };
}

// Mismas reglas que UpdateInvestorProfileDto (backend)
function validate(f: Form, payoutType: PayoutType): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (f.name.trim().length < 3) e.name = 'Escribe tu nombre';
  if (f.phone.length !== PHONE_DIGITS) e.phone = `El teléfono debe tener ${PHONE_DIGITS} dígitos (llevas ${f.phone.length})`;
  if (f.investorAlias && !ALIAS_RE.test(f.investorAlias.trim())) e.investorAlias = '3 a 30 caracteres: letras, números, punto, guion o guion bajo';
  // La cuenta es opcional, pero si se empieza a capturar debe ir completa
  const hasBank = Boolean(f.payoutBankName.trim() || f.payoutClabe || f.payoutAccountHolder.trim());
  if (hasBank) {
    const { short, digits } = PAYOUT_TYPES[payoutType];
    if (!f.payoutBankName.trim()) e.payoutBankName = 'Requerido';
    if (!f.payoutAccountHolder.trim()) e.payoutAccountHolder = 'Requerido';
    if (f.payoutClabe.length !== digits) e.payoutClabe = `La ${short} debe tener ${digits} dígitos (llevas ${f.payoutClabe.length})`;
  }
  return e;
}

// Refleja nombre y alias en el usuario guardado (Sidebar lo saluda por nombre)
function syncStoredUser(p: InvestorProfileData) {
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as Record<string, unknown>;
    localStorage.setItem('user', JSON.stringify({ ...user, name: p.name, investorAlias: p.investorAlias }));
    window.dispatchEvent(new Event('user-flags-updated'));
  } catch { /* sin storage */ }
}

// [INVESTOR, ADMIN] /investor/profile — datos de contacto y cuenta para recibir rendimientos
export default function InvestorProfile() {
  const [profile, setProfile] = useState<InvestorProfileData | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [payoutType, setPayoutType] = useState<PayoutType>('CLABE');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    axios.get<InvestorProfileData>(`${API}/investor-profile/me`, { headers: authHeaders() })
      .then(({ data }) => {
        setProfile(data);
        setForm(toForm(data));
        setPayoutType(payoutTypeOf(data.payoutBank?.clabe));
      })
      .catch(() => toast.error('No se pudo cargar tu perfil'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-text-secondary gap-2">
        <Loader2 size={18} className="animate-spin" /> Cargando perfil...
      </div>
    );
  }
  if (!profile || !form) {
    return <p className="text-text-secondary text-sm py-20 text-center">No pudimos cargar tu perfil. Intenta de nuevo más tarde.</p>;
  }

  const errors = validate(form, payoutType);
  const hasErrors = Object.keys(errors).length > 0;
  const payout = PAYOUT_TYPES[payoutType];
  const isDirty = JSON.stringify(form) !== JSON.stringify(toForm(profile));

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [key]: e.target.value } : f));
  const setDigits = (key: keyof Form, max: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [key]: onlyDigits(e.target.value, max) } : f));
  const showError = (key: keyof Form) => Boolean(touched && errors[key]);
  const errorOf = (key: keyof Form) => showError(key) && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>;
  const fieldCls = (key: keyof Form, extra = '') => `${inputCls} ${extra} ${showError(key) ? 'border-red-500/60' : ''}`;

  const choosePayoutType = (type: PayoutType) => {
    setPayoutType(type);
    setForm((f) => (f ? { ...f, payoutClabe: f.payoutClabe.slice(0, PAYOUT_TYPES[type].digits) } : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) {
      toast.error('Revisa los campos marcados');
      return;
    }
    const hasBank = Boolean(form.payoutBankName.trim() || form.payoutClabe);
    setIsSaving(true);
    try {
      const { data } = await axios.patch<InvestorProfileData>(`${API}/investor-profile/me`, {
        name: form.name.trim(),
        phone: form.phone,
        state: form.state.trim(),
        country: form.country.trim(),
        ...(form.investorAlias.trim() ? { investorAlias: form.investorAlias.trim() } : {}),
        ...(hasBank ? {
          payoutBankName: form.payoutBankName.trim(),
          payoutClabe: form.payoutClabe,
          payoutAccountHolder: form.payoutAccountHolder.trim(),
        } : {}),
      }, { headers: authHeaders() });
      setProfile(data);
      setForm(toForm(data));
      setTouched(false);
      syncStoredUser(data);
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(apiError(err, 'No se pudo guardar tu perfil'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6">
      <InvestorPageHeader icon={UserRound} title="Mi perfil" subtitle="Tus datos como inversionista" alias={profile.investorAlias} />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <fieldset className={sectionCls}>
          <legend className="text-base font-bold text-text-primary mb-4 float-left w-full">Datos personales</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 clear-both">
            <div>
              <label htmlFor="ip-name" className={labelCls}>Nombre</label>
              <input id="ip-name" value={form.name} onChange={set('name')} className={fieldCls('name')} autoComplete="name" />
              {errorOf('name')}
            </div>
            <div>
              <label htmlFor="ip-email" className={labelCls}>Correo</label>
              <input id="ip-email" value={profile.email} disabled className={inputCls} />
              <p className="text-text-muted text-xs mt-1">Es tu acceso a Cashi; no se puede cambiar aquí.</p>
            </div>
            <div>
              <label htmlFor="ip-phone" className={labelCls}>Teléfono</label>
              <input id="ip-phone" type="tel" inputMode="numeric" maxLength={PHONE_DIGITS} value={form.phone} onChange={setDigits('phone', PHONE_DIGITS)} className={fieldCls('phone', 'tracking-wider')} placeholder="5512345678" autoComplete="tel-national" />
              <p className="text-text-muted text-xs mt-1 text-right">{form.phone.length}/{PHONE_DIGITS}</p>
              {errorOf('phone')}
            </div>
            <div>
              <label htmlFor="ip-alias" className={labelCls}>Usuario de inversionista</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
                <input id="ip-alias" value={form.investorAlias} onChange={set('investorAlias')} className={fieldCls('investorAlias', 'pl-7')} placeholder="tu.avatar" maxLength={30} autoCapitalize="off" />
              </div>
              <p className="text-text-muted text-xs mt-1">Así te ven los demás en los préstamos que fondeas.</p>
              {errorOf('investorAlias')}
            </div>
            <div>
              <label htmlFor="ip-state" className={labelCls}>Estado</label>
              <input id="ip-state" value={form.state} onChange={set('state')} className={inputCls} placeholder="Ej. Jalisco" maxLength={60} />
            </div>
            <div>
              <label htmlFor="ip-country" className={labelCls}>País</label>
              <input id="ip-country" value={form.country} onChange={set('country')} className={inputCls} placeholder="Ej. México" maxLength={60} />
            </div>
          </div>
        </fieldset>

        <fieldset className={sectionCls}>
          <legend className="text-base font-bold text-text-primary float-left w-full">Cuenta para recibir rendimientos</legend>
          <p className="text-text-muted text-xs pt-1 mb-4 clear-both">Aquí te deposita el SuperAdmin tus rendimientos. Solo la ven tú y el SuperAdmin.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className={labelCls}>Tipo de cuenta</p>
              <div role="radiogroup" aria-label="Tipo de cuenta" className="grid grid-cols-2 gap-2">
                {(Object.keys(PAYOUT_TYPES) as PayoutType[]).map((type) => {
                  const { label, digits, Icon } = PAYOUT_TYPES[type];
                  const active = payoutType === type;
                  return (
                    <button
                      key={type} type="button" role="radio" aria-checked={active} onClick={() => choosePayoutType(type)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        active ? 'bg-brand-green/10 border-brand-green/40 text-text-primary' : 'bg-surface-base border-surface-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Icon size={18} className={active ? 'text-brand-green-light shrink-0' : 'shrink-0'} />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="block text-xs text-text-muted">{digits} dígitos</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label htmlFor="ip-bank" className={labelCls}>Banco</label>
              <input id="ip-bank" value={form.payoutBankName} onChange={set('payoutBankName')} className={fieldCls('payoutBankName')} placeholder="Ej. BBVA" maxLength={60} />
              {errorOf('payoutBankName')}
            </div>
            <div>
              <label htmlFor="ip-holder" className={labelCls}>Titular</label>
              <input id="ip-holder" value={form.payoutAccountHolder} onChange={set('payoutAccountHolder')} className={fieldCls('payoutAccountHolder')} placeholder="Como aparece en el banco" maxLength={120} />
              {errorOf('payoutAccountHolder')}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="ip-clabe" className={labelCls}>{payoutType === 'CARD' ? 'Número de tarjeta' : 'CLABE interbancaria'}</label>
              <input id="ip-clabe" inputMode="numeric" maxLength={payout.digits} value={form.payoutClabe} onChange={setDigits('payoutClabe', payout.digits)} className={fieldCls('payoutClabe', 'font-mono tracking-wider')} placeholder={payout.placeholder} autoComplete="off" />
              <p className="text-text-muted text-xs mt-1 text-right">{form.payoutClabe.length}/{payout.digits}</p>
              {errorOf('payoutClabe')}
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end">
          <button
            type="submit" disabled={isSaving || !isDirty}
            className="bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl px-6 py-2.5 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {isSaving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar cambios</>}
          </button>
        </div>
      </form>
    </div>
  );
}
