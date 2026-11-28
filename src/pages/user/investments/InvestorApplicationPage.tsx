import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, HandCoins, Loader2, Lock } from 'lucide-react';
import { API, apiError, authHeaders, type MyInvestorStatus } from '../../../components/investor/investorTypes';
import { PAYOUT_TYPES, PHONE_DIGITS, onlyDigits, type PayoutType } from '../../../components/investor/payoutAccount';

const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted';
const labelCls = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1';
const sectionCls = 'bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card p-5 sm:p-6';

const BACK_PATH = '/investments';

const EMPTY = {
  fullName: '', investorAlias: '', age: '', phone: '', estimatedAmount: '', reason: '',
  payoutBankName: '', payoutClabe: '', payoutAccountHolder: '',
};
type Form = typeof EMPTY;

const ALIAS_RE = /^[A-Za-z0-9._-]{3,30}$/;
const MIN_REASON = 20;
const MIN_AGE = 18;
const MAX_AGE = 100;

// Mismas reglas que CreateInvestorApplicationDto (backend)
function validate(f: Form, payoutType: PayoutType): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (f.fullName.trim().length < 5) e.fullName = 'Escribe tu nombre completo';
  if (!ALIAS_RE.test(f.investorAlias.trim())) e.investorAlias = '3 a 30 caracteres: letras, números, punto, guion o guion bajo';
  const age = Number(f.age);
  if (!f.age) e.age = 'Indica tu edad';
  else if (age < MIN_AGE) e.age = `Debes tener al menos ${MIN_AGE} años para invertir`;
  else if (age > MAX_AGE) e.age = 'Edad no válida';
  if (f.phone.length !== PHONE_DIGITS) e.phone = `El teléfono debe tener ${PHONE_DIGITS} dígitos (llevas ${f.phone.length})`;
  if (!(Number(f.estimatedAmount) >= 1)) e.estimatedAmount = 'Indica cuánto te gustaría invertir';
  if (f.reason.trim().length < MIN_REASON) e.reason = `Cuéntanos un poco más (mín. ${MIN_REASON} caracteres)`;
  if (!f.payoutBankName.trim()) e.payoutBankName = 'Requerido';
  const { short, digits } = PAYOUT_TYPES[payoutType];
  if (f.payoutClabe.length !== digits) e.payoutClabe = `La ${short} debe tener ${digits} dígitos (llevas ${f.payoutClabe.length})`;
  if (!f.payoutAccountHolder.trim()) e.payoutAccountHolder = 'Requerido';
  return e;
}

// Solo un USER con registro abierto, cupo y sin solicitud en revisión puede llenar el formulario
function blockedReasonOf(status: MyInvestorStatus): string | null {
  if (status.role !== 'USER') return 'Tu cuenta ya tiene acceso al panel de inversionista.';
  if (status.application?.status === 'PENDING') return `Ya tienes una solicitud en revisión como @${status.application.investorAlias}.`;
  if (!status.acceptingInvestors) return 'Por ahora no estamos recibiendo solicitudes.';
  if (!status.canApply) return 'El cupo de inversionistas está lleno por ahora.';
  return null;
}

// [USER] /investments/apply — solicitud para ser inversionista (subpágina de Gana Dinero)
export default function InvestorApplicationPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<MyInvestorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [payoutType, setPayoutType] = useState<PayoutType>('CLABE');
  const [touched, setTouched] = useState(false);
  const [blurred, setBlurred] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAlias, setSubmittedAlias] = useState<string | null>(null);
  const errors = validate(form, payoutType);
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    axios.get<MyInvestorStatus>(`${API}/investor-applications/me`, { headers: authHeaders() })
      .then(({ data }) => setStatus(data))
      .catch(() => toast.error('No se pudo consultar tu estado de inversionista'))
      .finally(() => setIsLoading(false));
  }, []);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  // Campos numéricos: solo dígitos y nunca más del largo permitido
  const setDigits = (key: keyof Form, max: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: onlyDigits(e.target.value, max) }));
  const blur = (key: keyof Form) => () => setBlurred((b) => ({ ...b, [key]: true }));
  // El error aparece al salir del campo o al intentar enviar
  const showError = (key: keyof Form) => Boolean((touched || blurred[key]) && errors[key]);
  const errorOf = (key: keyof Form) => showError(key) && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>;
  const fieldCls = (key: keyof Form, extra = '') => `${inputCls} ${extra} ${showError(key) ? 'border-red-500/60' : ''}`;

  const choosePayoutType = (type: PayoutType) => {
    setPayoutType(type);
    setForm((f) => ({ ...f, payoutClabe: f.payoutClabe.slice(0, PAYOUT_TYPES[type].digits) }));
  };
  const payout = PAYOUT_TYPES[payoutType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) {
      toast.error('Revisa los campos marcados');
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/investor-applications`, {
        fullName: form.fullName.trim(),
        investorAlias: form.investorAlias.trim(),
        age: Number(form.age),
        phone: form.phone.trim(),
        estimatedAmount: Number(form.estimatedAmount),
        reason: form.reason.trim(),
        payoutBankName: form.payoutBankName.trim(),
        payoutClabe: form.payoutClabe.trim(),
        payoutAccountHolder: form.payoutAccountHolder.trim(),
      }, { headers: authHeaders() });
      toast.success('Solicitud enviada. Te avisaremos cuando sea revisada.');
      setSubmittedAlias(form.investorAlias.trim());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(apiError(err, 'No se pudo enviar tu solicitud'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const blockedReason = status ? blockedReasonOf(status) : 'No pudimos cargar el formulario. Intenta de nuevo más tarde.';

  return (
    <div className="p-4 md:p-8 text-white font-sans max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <Link
          to={BACK_PATH}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary bg-surface-card/60 border border-white/5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={18} /> Regresar
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-brand-green/10 border border-brand-green/25 rounded-2xl p-4 shrink-0 shadow-lg shadow-brand-green/10">
          <HandCoins size={32} className="text-brand-green-light" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Quiero ser inversionista</h1>
          <p className="text-text-secondary mt-1 text-sm md:text-base">El SuperAdmin revisará tu solicitud. Todos los campos son obligatorios.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-text-secondary gap-2">
          <Loader2 size={18} className="animate-spin" /> Cargando...
        </div>
      ) : submittedAlias ? (
        <section className={`${sectionCls} text-center flex flex-col items-center gap-4 py-10`}>
          <span className="bg-brand-green/10 border border-brand-green/20 rounded-full p-4">
            <CheckCircle2 size={40} className="text-brand-green-light" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-text-primary">¡Solicitud enviada!</h2>
            <p className="text-text-secondary text-sm mt-2 max-w-md">
              Recibimos tu solicitud como <strong className="text-text-primary">@{submittedAlias}</strong>. Te avisaremos en la campana de notificaciones cuando sea revisada.
            </p>
          </div>
          <button
            type="button" onClick={() => navigate(BACK_PATH)}
            className="bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl px-6 py-2.5 transition-all shadow-lg shadow-brand-green/20"
          >
            Volver a Gana Dinero
          </button>
        </section>
      ) : blockedReason ? (
        <section className={`${sectionCls} flex flex-col items-center text-center gap-4 py-10`}>
          <Lock size={32} className="text-text-muted" />
          <p className="text-text-secondary text-sm max-w-md">{blockedReason}</p>
          <Link to={BACK_PATH} className="text-brand-green-light hover:text-brand-green font-semibold text-sm">Volver a Gana Dinero</Link>
        </section>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <fieldset className={sectionCls}>
            <legend className="text-base font-bold text-text-primary mb-4 float-left w-full">Sobre ti</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 clear-both">
              <div>
                <label htmlFor="ia-name" className={labelCls}>Nombre completo</label>
                <input id="ia-name" value={form.fullName} onChange={set('fullName')} onBlur={blur('fullName')} className={fieldCls('fullName')} placeholder="Nombre(s) y apellidos" autoComplete="name" />
                {errorOf('fullName')}
              </div>
              <div>
                <label htmlFor="ia-alias" className={labelCls}>Usuario de inversionista</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
                  <input id="ia-alias" value={form.investorAlias} onChange={set('investorAlias')} onBlur={blur('investorAlias')} className={fieldCls('investorAlias', 'pl-7')} placeholder="tu.avatar" maxLength={30} autoCapitalize="off" />
                </div>
                <p className="text-text-muted text-xs mt-1">Así te identificarán en los préstamos que fondees.</p>
                {errorOf('investorAlias')}
              </div>
              <div>
                <label htmlFor="ia-age" className={labelCls}>Edad</label>
                <input id="ia-age" inputMode="numeric" maxLength={3} value={form.age} onChange={setDigits('age', 3)} onBlur={blur('age')} className={fieldCls('age')} placeholder="18 o más" />
                <p className="text-text-muted text-xs mt-1">Debes ser mayor de edad.</p>
                {errorOf('age')}
              </div>
              <div>
                <label htmlFor="ia-phone" className={labelCls}>Teléfono</label>
                <input id="ia-phone" type="tel" inputMode="numeric" maxLength={PHONE_DIGITS} value={form.phone} onChange={setDigits('phone', PHONE_DIGITS)} onBlur={blur('phone')} className={fieldCls('phone', 'tracking-wider')} placeholder="5512345678" autoComplete="tel-national" />
                <p className="text-text-muted text-xs mt-1 text-right">{form.phone.length}/{PHONE_DIGITS}</p>
                {errorOf('phone')}
              </div>
            </div>
          </fieldset>

          <fieldset className={sectionCls}>
            <legend className="text-base font-bold text-text-primary mb-4 float-left w-full">Tu interés</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 clear-both">
              <div>
                <label htmlFor="ia-amount" className={labelCls}>¿Cuánto te gustaría invertir? (MXN)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                  <input id="ia-amount" type="number" inputMode="decimal" min="1" step="0.01" value={form.estimatedAmount} onChange={set('estimatedAmount')} onBlur={blur('estimatedAmount')} className={fieldCls('estimatedAmount', 'pl-7')} placeholder="5000" />
                </div>
                <p className="text-text-muted text-xs mt-1">Una cantidad aproximada para conocerte; no se te cobra nada al enviar la solicitud.</p>
                {errorOf('estimatedAmount')}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="ia-reason" className={labelCls}>¿Por qué te interesa ser inversionista?</label>
                <textarea id="ia-reason" rows={4} maxLength={1000} value={form.reason} onChange={set('reason')} onBlur={blur('reason')} className={fieldCls('reason', 'resize-y')} placeholder="Cuéntanos tu experiencia invirtiendo y qué esperas de Cashi..." />
                <p className="text-text-muted text-xs mt-1 text-right">{form.reason.trim().length}/1000</p>
                {errorOf('reason')}
              </div>
            </div>
          </fieldset>

          <fieldset className={sectionCls}>
            <legend className="text-base font-bold text-text-primary float-left w-full">Cuenta para recibir rendimientos</legend>
            <p className="text-text-muted text-xs pt-1 mb-4 clear-both">Solo la verán tú y el SuperAdmin.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <p className={labelCls}>¿Dónde quieres recibir tus rendimientos?</p>
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
                <label htmlFor="ia-bank" className={labelCls}>Banco</label>
                <input id="ia-bank" value={form.payoutBankName} onChange={set('payoutBankName')} onBlur={blur('payoutBankName')} className={fieldCls('payoutBankName')} placeholder="Ej. BBVA" />
                {errorOf('payoutBankName')}
              </div>
              <div>
                <label htmlFor="ia-holder" className={labelCls}>Titular</label>
                <input id="ia-holder" value={form.payoutAccountHolder} onChange={set('payoutAccountHolder')} onBlur={blur('payoutAccountHolder')} className={fieldCls('payoutAccountHolder')} placeholder="Como aparece en el banco" />
                {errorOf('payoutAccountHolder')}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="ia-clabe" className={labelCls}>{payoutType === 'CARD' ? 'Número de tarjeta' : 'CLABE interbancaria'}</label>
                <input id="ia-clabe" inputMode="numeric" maxLength={payout.digits} value={form.payoutClabe} onChange={setDigits('payoutClabe', payout.digits)} onBlur={blur('payoutClabe')} className={fieldCls('payoutClabe', 'font-mono tracking-wider')} placeholder={payout.placeholder} autoComplete="off" />
                <p className="text-text-muted text-xs mt-1 text-right">{form.payoutClabe.length}/{payout.digits}</p>
                {errorOf('payoutClabe')}
              </div>
            </div>
          </fieldset>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Link to={BACK_PATH} className="text-center bg-surface-elevated text-text-primary px-6 py-2.5 rounded-xl transition-all font-medium">
              Cancelar
            </Link>
            <button
              type="submit" disabled={isSubmitting}
              className="bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl px-6 py-2.5 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
