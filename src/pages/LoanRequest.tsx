/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, AlertTriangle, Check,
  ChevronRight, ChevronLeft, Send, CalendarCheck, X,
  MessageCircle, ShieldAlert, CheckCircle2,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const DEFAULT_CREDIT_LIMIT = 1000;
const DEFAULT_RATE = 50;
const TERM_OPTIONS = [1, 2, 3, 6, 9, 12, 18, 24];
const HOUSING_OPTIONS = ['Propia', 'Rentada', 'Familiar'];
const WHATSAPP_URL = `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=Verificaci%C3%B3n+de+identidad+FinanzasDMS`;

const MEXICO_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila de Zaragoza',
  'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero',
  'Hidalgo', 'Jalisco', 'Michoacán de Ocampo', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
  'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
  'Tlaxcala', 'Veracruz de Ignacio de la Llave', 'Yucatán', 'Zacatecas',
];

const COLOMBIA_DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar',
  'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
  'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
  'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
  'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
  'Valle del Cauca', 'Vaupés', 'Vichada',
];

const COUNTRIES = ['México', 'Colombia', 'Otro'];
const STEP_LABELS = ['Datos del Préstamo', 'Información Personal', 'Resumen Final'];

const TERMS_CONTENT = (
  <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
    <h3 className="text-base font-bold text-white">TÉRMINOS Y CONDICIONES DE SERVICIO – FINANZASDMS</h3>
    <p>
      El presente documento establece las condiciones bajo las cuales se otorgan créditos a través de
      la plataforma FinanzasDMS. Al aceptar estos términos, el usuario manifiesta su conformidad con
      lo siguiente:
    </p>

    <div>
      <p><strong className="text-white">Naturaleza del Servicio:</strong> FinanzasDMS es una
      plataforma de gestión de microcréditos personales. El otorgamiento de cualquier préstamo está
      sujeto a la evaluación de riesgo y disponibilidad de cupos.</p>
    </div>

    <div>
      <p><strong className="text-white">Tasas de Interés:</strong> La tasa de interés es anual y se
      calcula de forma proporcional al tiempo del préstamo. En plazos menores a 12 meses, se aplicará
      el cobro equivalente a una anualidad completa como comisión mínima de apertura y gestión.</p>
    </div>

    <div>
      <p><strong className="text-white">Sistema de Niveles y Límites:</strong> El usuario acepta que
      su límite de crédito y tasa de interés dependen de su nivel de confianza (Novato, Cumplidor,
      Socio o Elite), el cual se calcula con base en su historial de pagos y puntos acumulados en la
      plataforma.</p>
    </div>

    <div>
      <p className="font-semibold text-white mb-2">Política de Pagos y Morosidad:</p>
      <ul className="list-disc list-inside space-y-2 pl-2">
        <li>
          <strong className="text-white">Degradación:</strong> El usuario acepta que, por cada 5 días
          de retraso en una cuota, su nivel de confianza bajará un escalón automáticamente.
        </li>
        <li>
          <strong className="text-white">Interés Moratorio:</strong> A partir del día 11 de retraso,
          se generará un recargo administrativo de $10.00 MXN diarios que se sumará al saldo pendiente
          de la cuota vencida.
        </li>
        <li>
          <strong className="text-white">Bloqueo:</strong> Si el retraso supera los 60 días naturales,
          la cuenta será bloqueada permanentemente.
        </li>
        <li>
          <strong className="text-white">Reestructuración:</strong> En caso de realizar pagos parciales
          o excedentes, el sistema recalculará automáticamente las cuotas restantes para ajustar el
          saldo deudor, manteniendo las fechas de vencimiento originales.
        </li>
      </ul>
    </div>
  </div>
);

const PRIVACY_CONTENT = (
  <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
    <h3 className="text-base font-bold text-white">AVISO DE PRIVACIDAD SIMPLIFICADO</h3>
    <p>
      FinanzasDMS, plataforma operada desde Monterrey, Nuevo León, México, es responsable del
      tratamiento de sus datos personales, los cuales serán utilizados exclusivamente para las
      finalidades aquí descritas.
    </p>

    <div>
      <p><strong className="text-white">Datos Recabados:</strong> Para la evaluación de su solicitud
      de crédito, recolectamos: nombre completo, teléfono, correo electrónico, datos financieros
      básicos, ubicación geográfica y clave interbancaria (CLABE) para desembolso.</p>
    </div>

    <div>
      <p className="font-semibold text-white mb-2">Finalidad del Tratamiento:</p>
      <p className="mb-2">Sus datos serán utilizados para:</p>
      <ul className="list-disc list-inside space-y-1.5 pl-2">
        <li>Evaluar su solvencia crediticia y capacidad de pago.</li>
        <li>Identificar la categoría de su perfil.</li>
        <li>
          Gestionar la cobranza, transferencias de fondos y aplicar las penalizaciones
          correspondientes en caso de mora.
        </li>
      </ul>
    </div>

    <div>
      <p><strong className="text-white">Protección de Evidencia:</strong> Las capturas de pantalla o
      archivos de comprobantes de pago subidos a la plataforma serán utilizados únicamente para la
      conciliación administrativa de su cuenta.</p>
    </div>

    <div>
      <p><strong className="text-white">Transferencia de Datos:</strong> Sus datos no serán
      compartidos, vendidos ni transferidos a terceros con fines de lucro o marketing.</p>
    </div>

    <div>
      <p><strong className="text-white">Derechos ARCO:</strong> Usted tiene derecho al Acceso,
      Rectificación, Cancelación u Oposición del manejo de sus datos. Para ejercer estos derechos o
      solicitar la eliminación de su cuenta, deberá contactar directamente a la administración a
      través de nuestros canales oficiales.</p>
    </div>
  </div>
);

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function getUserDefaults() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return { creditLimit: DEFAULT_CREDIT_LIMIT, currentRate: DEFAULT_RATE };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      creditLimit: Number(parsed.creditLimit ?? DEFAULT_CREDIT_LIMIT) || DEFAULT_CREDIT_LIMIT,
      currentRate: Number(parsed.currentRate ?? DEFAULT_RATE) || DEFAULT_RATE,
    };
  } catch {
    return { creditLimit: DEFAULT_CREDIT_LIMIT, currentRate: DEFAULT_RATE };
  }
}

function getFamilyCode(): string | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const code = parsed.familyCode;
    return typeof code === 'string' && code.length > 0 ? code : null;
  } catch {
    return null;
  }
}

const inputCls =
  'w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600';

const sectionHeader = 'text-xs font-bold text-slate-400 uppercase tracking-wider mb-4';

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEP_LABELS.map((label, idx) => {
        const num = idx + 1;
        const done = current > num;
        const active = current === num;
        return (
          <Fragment key={num}>
            <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 88 }}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                done
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : active
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                    : 'bg-slate-800 border-slate-600 text-slate-500'
              }`}>
                {done ? <Check size={15} strokeWidth={2.5} /> : num}
              </div>
              <span className={`text-xs font-medium text-center leading-tight ${current >= num ? 'text-white' : 'text-slate-500'}`}>
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div className={`h-0.5 w-16 sm:w-20 mx-1 mb-5 rounded-full transition-all duration-500 flex-shrink-0 ${
                current > idx + 1 ? 'bg-emerald-500' : 'bg-slate-700'
              }`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Legal Modal (Terms / Privacy) ─────────────────────────────────────────────
function LegalModal({
  title,
  body,
  onClose,
}: {
  title: string;
  body: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-700 shrink-0">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">
          {body}
        </div>
        <div className="p-5 border-t border-slate-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── WhatsApp Verification Modal ────────────────────────────────────────────────
function WhatsAppModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    window.open(WHATSAPP_URL, '_blank');
    setSent(true);
  };

  const handleClose = () => {
    onClose();
    navigate('/loans');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-800 border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
          {sent ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-extrabold text-white mb-2">
                ¡WhatsApp enviado!
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-2">
                Tu solicitud de préstamo ya fue registrada y está en revisión.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Te contactaremos por WhatsApp para verificar tu identidad y activar el crédito.
              </p>
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                Ir a Mis Préstamos
              </button>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-extrabold text-white mb-2">
                ¡Solicitud enviada!
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-2">
                Tu préstamo fue registrado correctamente y está en revisión.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Para agilizar el proceso, envíanos una foto de tu <strong className="text-white">INE</strong> por WhatsApp para verificar tu identidad.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSend}
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle size={18} />
                  Enviar WhatsApp
                </button>
                <button
                  onClick={handleClose}
                  className="py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors font-medium text-sm"
                >
                  Ir a Mis Préstamos
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LoanRequest() {
  const navigate = useNavigate();
  const { creditLimit, currentRate } = useMemo(() => getUserDefaults(), []);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    concept: '',
    amount: '',
    termMonths: '12',
    phone: '',
    income: '',
    expenses: '',
    housingStatus: 'Rentada',
    country: '',
    state: '',
    referralCode: '',
    disbursementAccount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // ── Derived financial values ──────────────────────────────────────────────
  const amountN = parseFloat(form.amount) || 0;
  const termN = parseInt(form.termMonths, 10) || 0;
  const isOverLimit = creditLimit > 0 && amountN > creditLimit;
  const timeFactor = termN >= 12 ? termN / 12 : 1;
  const interest = amountN > 0 && termN > 0 ? amountN * (currentRate / 100) * timeFactor : 0;
  const total = amountN + interest;
  const monthly = termN > 0 ? total / termN : 0;
  const effectiveRate = currentRate * timeFactor;

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  const rows = useMemo(() => {
    if (amountN <= 0 || termN <= 0 || monthly <= 0) return [];
    const today = new Date();
    return Array.from({ length: termN }, (_, i) => {
      const dueDate = new Date(today.getFullYear(), today.getMonth() + i + 1, today.getDate());
      const remainingBalance = Math.max(0, total - monthly * (i + 1));
      return { number: i + 1, dueDate, amountDue: monthly, remainingBalance };
    });
  }, [amountN, termN, monthly, total]);

  const endDate = rows.length > 0 ? rows[rows.length - 1].dueDate : null;

  // ── Step validation ───────────────────────────────────────────────────────
  const step1Valid = form.concept.trim().length > 0 && amountN > 0 && !isOverLimit && termN > 0;
  const step2Valid =
    form.phone.trim().length > 0 &&
    parseFloat(form.income) > 0 &&
    parseFloat(form.expenses) > 0;
  const isSubmitEnabled = acceptTerms && acceptPrivacy && !isSubmitting;

  // ── Location helpers ──────────────────────────────────────────────────────
  const stateOptions =
    form.country === 'México' ? MEXICO_STATES :
    form.country === 'Colombia' ? COLOMBIA_DEPARTMENTS :
    null;

  const stateLabel =
    form.country === 'Colombia' ? 'Departamento' :
    form.country === 'Otro' ? 'Estado / Región' :
    'Estado';

  const statePlaceholder =
    form.country === 'Colombia' ? 'Selecciona tu departamento' :
    form.country === 'México' ? 'Selecciona tu estado' :
    form.country === 'Otro' ? 'Ingresa tu estado o región' :
    'Selecciona primero tu país';

  const handleCountryChange = (country: string) => {
    setForm(f => ({ ...f, country, state: '' }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const amount = parseFloat(form.amount);
    const termMonths = parseInt(form.termMonths, 10);
    const income = parseFloat(form.income);
    const expenses = parseFloat(form.expenses);

    if (!form.concept.trim() || isNaN(amount) || amount <= 0 || isNaN(termMonths) || termMonths < 1) {
      toast.error('Completa correctamente el concepto, monto y plazo');
      return;
    }
    if (!form.phone.trim() || isNaN(income) || income <= 0 || isNaN(expenses) || expenses <= 0) {
      toast.error('Completa el teléfono, ingresos y gastos');
      return;
    }
    if (isOverLimit) {
      toast.error('El monto supera tu límite de crédito');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${API}/loans/request`,
        {
          concept: form.concept,
          amount,
          termMonths,
          phone: form.phone,
          income,
          expenses,
          housingStatus: form.housingStatus,
          state: form.state,
          country: form.country,
          referralCode: form.referralCode || undefined,
          disbursementAccount: form.disbursementAccount || undefined,
        },
        { headers: authHeaders() },
      );
      if (!getFamilyCode()) {
        // Solicitud guardada — mostrar modal para que el usuario se verifique por WhatsApp
        setShowWhatsAppModal(true);
      } else {
        toast.success('¡Solicitud enviada! El equipo revisará tu caso en breve.');
        navigate('/loans');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(Array.isArray(msg) ? (msg as string[])[0] : (msg as string | undefined) ?? 'Error al solicitar préstamo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 text-white font-sans">
      <button
        onClick={() => navigate('/loans')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 font-medium"
      >
        <ArrowLeft size={18} />
        Volver a Mis Préstamos
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
          <Plus size={24} className="text-emerald-400" />
          Solicitar Préstamo
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Completa la información para enviar tu solicitud</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Stepper current={step} />

        {/* ════════════ PASO 1: Datos del Préstamo ════════════ */}
        {step === 1 && (
          <div className="max-w-xl mx-auto">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                <span className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300">
                  Límite: <span className="text-white">{fmt(creditLimit)}</span>
                </span>
                <span className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300">
                  Tasa: <span className="text-emerald-400">{currentRate}% anual</span>
                </span>
              </div>

              <div>
                <label className="block text-sm text-slate-300 font-medium mb-1.5">
                  Concepto <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.concept}
                  onChange={e => setForm(f => ({ ...f, concept: e.target.value }))}
                  className={inputCls}
                  placeholder="¿Para qué necesitas el préstamo?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-1.5">
                    Monto (MXN) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className={`${inputCls} ${isOverLimit ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="0.00"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-1.5">
                    Plazo <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.termMonths}
                    onChange={e => setForm(f => ({ ...f, termMonths: e.target.value }))}
                    className={`${inputCls} cursor-pointer`}
                  >
                    {TERM_OPTIONS.map(m => (
                      <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isOverLimit && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                  <AlertTriangle size={15} className="text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">
                    El monto supera tu límite de <strong>{fmt(creditLimit)}</strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-300 font-medium mb-1.5">
                  Código de Referido <span className="text-slate-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.referralCode}
                  onChange={e => setForm(f => ({ ...f, referralCode: e.target.value }))}
                  className={inputCls}
                  placeholder="REFXXX"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => navigate('/loans')}
                  className="px-5 py-3 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { if (step1Valid) setStep(2); }}
                  disabled={!step1Valid}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  Siguiente
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ PASO 2: Información Personal ════════════ */}
        {step === 2 && (
          <div className="max-w-xl mx-auto">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">

              <div>
                <p className={sectionHeader}>Datos de Contacto e Ingresos</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-300 font-medium mb-1.5">
                        Teléfono <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className={inputCls}
                        placeholder="81 1234 5678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 font-medium mb-1.5">
                        Ingresos Mensuales (MXN) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        value={form.income}
                        onChange={e => setForm(f => ({ ...f, income: e.target.value }))}
                        className={inputCls}
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-300 font-medium mb-1.5">
                        Gastos Mensuales (MXN) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        value={form.expenses}
                        onChange={e => setForm(f => ({ ...f, expenses: e.target.value }))}
                        className={inputCls}
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 font-medium mb-1.5">Estado de Vivienda</label>
                      <select
                        value={form.housingStatus}
                        onChange={e => setForm(f => ({ ...f, housingStatus: e.target.value }))}
                        className={`${inputCls} cursor-pointer`}
                      >
                        {HOUSING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* CLABE de depósito */}
              <div>
                <p className={sectionHeader}>Cuenta de Desembolso</p>
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-1.5">
                    CLABE Interbancaria de Depósito
                    <span className="text-slate-500 font-normal ml-1">(18 dígitos, a donde recibirás el préstamo)</span>
                  </label>
                  <input
                    type="text"
                    value={form.disbursementAccount}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                      setForm(f => ({ ...f, disbursementAccount: val }));
                    }}
                    className={inputCls}
                    placeholder="000000000000000000"
                    maxLength={18}
                    inputMode="numeric"
                  />
                  {form.disbursementAccount.length > 0 && form.disbursementAccount.length < 18 && (
                    <p className="text-xs text-amber-400 mt-1">
                      Faltan {18 - form.disbursementAccount.length} dígitos
                    </p>
                  )}
                  {form.disbursementAccount.length === 18 && (
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <Check size={11} /> CLABE completa
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className={sectionHeader}>Ubicación</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 font-medium mb-1.5">País</label>
                    <select
                      value={form.country}
                      onChange={e => handleCountryChange(e.target.value)}
                      className={`${inputCls} cursor-pointer`}
                    >
                      <option value="">Selecciona tu país</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 font-medium mb-1.5">{stateLabel}</label>
                    {!form.country ? (
                      <input
                        type="text"
                        disabled
                        className={`${inputCls} opacity-40 cursor-not-allowed`}
                        placeholder="Selecciona primero tu país"
                      />
                    ) : stateOptions ? (
                      <select
                        value={form.state}
                        onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                        className={`${inputCls} cursor-pointer`}
                      >
                        <option value="">{statePlaceholder}</option>
                        {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.state}
                        onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                        className={inputCls}
                        placeholder={statePlaceholder}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors font-medium"
                >
                  <ChevronLeft size={18} />
                  Anterior
                </button>
                <button
                  onClick={() => { if (step2Valid) setStep(3); }}
                  disabled={!step2Valid}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  Ver Resumen
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ PASO 3: Resumen Final ════════════ */}
        {step === 3 && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">

            {/* Tabla de amortización */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Tabla de Amortización
                </h3>
                <span className="text-xs text-slate-500 bg-slate-900 px-2.5 py-0.5 rounded-full">
                  {rows.length} cuotas
                </span>
              </div>
              <div className="overflow-auto max-h-[480px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-800 z-10 shadow-sm">
                    <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="text-center px-4 py-3 w-10">#</th>
                      <th className="text-left px-4 py-3">Vencimiento</th>
                      <th className="text-right px-4 py-3">Cuota</th>
                      <th className="text-right px-4 py-3">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr
                        key={row.number}
                        className={`border-b border-slate-700/50 transition-colors ${
                          row.number === rows.length
                            ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                            : 'hover:bg-slate-700/20'
                        }`}
                      >
                        <td className="px-4 py-2.5 text-center">
                          <span className="text-xs text-slate-500 tabular-nums">{row.number}</span>
                        </td>
                        <td className={`px-4 py-2.5 text-xs tabular-nums ${
                          row.number === rows.length ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                        }`}>
                          {fmtDate(row.dueDate)}
                          {row.number === rows.length && (
                            <span className="ml-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                              FIN
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-white font-semibold tabular-nums">
                          {fmt(row.amountDue)}
                        </td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${
                          row.remainingBalance === 0 ? 'text-emerald-400' : 'text-slate-300'
                        }`}>
                          {fmt(row.remainingBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-600">
                    <tr className="bg-slate-900/60">
                      <td colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Total del Préstamo
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-extrabold tabular-nums">
                        {fmt(total)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-extrabold tabular-nums">
                        {fmt(0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Panel derecho: Resumen + Legal + Acciones */}
            <div className="sticky top-6 space-y-4">

              {/* Desglose financiero */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Desglose del Préstamo
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Concepto</span>
                    <span className="text-white font-medium text-right max-w-[140px] truncate" title={form.concept}>
                      {form.concept}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plazo</span>
                    <span className="text-white font-medium">
                      {termN} {termN === 1 ? 'mes' : 'meses'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capital</span>
                    <span className="text-white font-semibold tabular-nums">{fmt(amountN)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      Interés ({effectiveRate.toFixed(0)}%{termN < 12 ? ' mín.' : ''})
                    </span>
                    <span className="text-amber-400 font-semibold tabular-nums">{fmt(interest)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700 pt-2">
                    <span className="text-slate-300 font-semibold">Total a pagar</span>
                    <span className="text-white font-bold tabular-nums">{fmt(total)}</span>
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-emerald-300 font-semibold text-sm">Cuota mensual</span>
                  <span className="text-emerald-400 font-extrabold text-lg tabular-nums">{fmt(monthly)}</span>
                </div>
                {endDate && (
                  <div className="bg-slate-900/60 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                    <CalendarCheck size={20} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wide">
                        Fecha de Finalización
                      </p>
                      <p className="text-sm font-extrabold text-white mt-0.5">{fmtDate(endDate)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkboxes legales */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Autorización Legal
                </p>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-600 text-emerald-500 bg-slate-900 shrink-0 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 leading-snug group-hover:text-white transition-colors">
                    Acepto los{' '}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setShowTermsModal(true); }}
                      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                    >
                      Términos y Condiciones
                    </button>
                    {' '}del préstamo.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={e => setAcceptPrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-600 text-emerald-500 bg-slate-900 shrink-0 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 leading-snug group-hover:text-white transition-colors">
                    Autorizo el tratamiento de mis datos personales según el{' '}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setShowPrivacyModal(true); }}
                      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                    >
                      Aviso de Privacidad
                    </button>
                    .
                  </span>
                </label>

                {(!acceptTerms || !acceptPrivacy) && (
                  <p className="text-xs text-slate-500 italic">
                    Debes aceptar ambas condiciones para continuar.
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="space-y-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors font-medium"
                >
                  <ChevronLeft size={18} />
                  Anterior
                </button>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={!isSubmitEnabled}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {isSubmitting ? 'Enviando...' : 'Confirmar y Enviar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modales Legales ── */}
      {showTermsModal && (
        <LegalModal
          title="Términos y Condiciones"
          body={TERMS_CONTENT}
          onClose={() => setShowTermsModal(false)}
        />
      )}
      {showPrivacyModal && (
        <LegalModal
          title="Aviso de Privacidad"
          body={PRIVACY_CONTENT}
          onClose={() => setShowPrivacyModal(false)}
        />
      )}
      {showWhatsAppModal && (
        <WhatsAppModal onClose={() => setShowWhatsAppModal(false)} />
      )}
    </div>
  );
}
