import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  X, Plus, Layers, CreditCard, DollarSign, Calendar, CalendarClock, ChartColumn,
  Palette, Save, RefreshCw, Check, Pencil, ChevronDown,
} from 'lucide-react';
import BankLogo from '../../../components/credit-cards/BankLogo';
import CreditCardVisual from '../../../components/credit-cards/CreditCardVisual';
import UtilizationRing from '../../../components/credit-cards/UtilizationRing';
import {
  CARD_COLORS, DEFAULT_CARD_COLOR, dueDateFor, fmt, fmtDayMonth, inferBankSlug, nextCutoffDate,
  type CreditCardItem,
} from '../../../utils/creditCards';

interface CardFormModalProps {
  /** Tarjeta a editar; sin ella el modal registra una nueva */
  card?: CreditCardItem | null;
  onClose: () => void;
  onSaved: () => void;
}

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const FEATURES = [
  { icon: CreditCard, text: 'Controla tus cortes' },
  { icon: Calendar, text: 'No olvides tus fechas de pago' },
  { icon: ChartColumn, text: 'Consulta tu saldo y crédito disponible' },
];

function initialForm(card?: CreditCardItem | null) {
  return {
    name: card?.name ?? '',
    creditLimit: card ? String(Number(card.creditLimit)) : '',
    cutoffDay: card ? String(card.cutoffDay) : '',
    paymentDueDay: card?.paymentDueDay ? String(card.paymentDueDay) : '',
    lastFour: card?.lastFour ?? '',
    debt: card ? String(Number(card.currentBalance)) : '',
    color: card?.color ?? DEFAULT_CARD_COLOR,
  };
}

export default function CardFormModal({ card, onClose, onSaved }: CardFormModalProps) {
  const isEdit = !!card;
  const [form, setForm] = useState(() => initialForm(card));
  const [hasDebt, setHasDebt] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const limit = parseFloat(form.creditLimit) || 0;
  const debt = hasDebt ? parseFloat(form.debt) || 0 : 0;
  const available = Math.max(0, limit - debt);
  const utilization = limit > 0 ? (debt / limit) * 100 : 0;
  const debtExceedsLimit = limit > 0 && debt > limit;

  const cutoffDay = parseInt(form.cutoffDay);
  const paymentDueDay = parseInt(form.paymentDueDay);
  const previewCutoff = cutoffDay ? nextCutoffDate(cutoffDay) : null;
  const previewDue = previewCutoff ? dueDateFor(previewCutoff, paymentDueDay || null) : null;

  // Los colores que no están en la paleta (tarjetas antiguas con color libre) se conservan como opción
  const colors = CARD_COLORS.includes(form.color) ? CARD_COLORS : [...CARD_COLORS, form.color];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (debtExceedsLimit) { toast.error('El saldo no puede superar la línea de crédito'); return; }
    setIsSaving(true);
    try {
      const base = {
        name: form.name.trim(),
        color: form.color,
        creditLimit: limit,
        cutoffDay,
        paymentDueDay,
        lastFour: form.lastFour || null,
      };
      if (isEdit) {
        await axios.patch(`${API}/credit-cards/${card.id}`, { ...base, currentBalance: debt }, { headers: authHeaders() });
        toast.success('Tarjeta actualizada');
      } else {
        await axios.post(
          `${API}/credit-cards`,
          { ...base, isExistingCard: hasDebt, ...(hasDebt && { initialDebt: debt }) },
          { headers: authHeaders() },
        );
        toast.success(`${base.name} agregada al panel de créditos`);
      }
      onSaved();
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string | string[] }>(err) ? err.response?.data?.message : undefined;
      toast.error((Array.isArray(message) ? message[0] : message) ?? 'Error al guardar la tarjeta');
    } finally {
      setIsSaving(false);
    }
  };

  const inputWrap = 'relative';
  const iconCls = 'absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none';
  const inputCls = 'w-full bg-surface-base/70 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted';
  const labelCls = 'block text-text-primary text-sm font-medium mb-1.5';
  const sectionTitle = 'flex items-center gap-2.5 text-lg font-bold text-white';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-6" onClick={onClose}>
      <div
        className="relative bg-surface-card/90 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full max-w-4xl max-h-[94vh] flex overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-form-title"
      >
        {/* Panel de marca (solo desktop) */}
        <aside className="hidden md:flex w-72 shrink-0 flex-col relative overflow-hidden bg-gradient-to-b from-brand-green-dark/40 via-surface-card to-surface-card border-r border-white/5 p-7">
          <CreditCardVisual stacked color={form.color} lastFour={form.lastFour} className="max-w-56" />
          <h2 id="card-form-title" className="text-2xl font-extrabold text-white mt-6 leading-tight">
            {isEdit ? 'Editar' : 'Registrar'}<br />Tarjeta de Crédito
          </h2>
          <p className="text-text-secondary mt-2 text-sm leading-relaxed">
            {isEdit
              ? 'Actualiza los datos, fechas y saldo de tu tarjeta.'
              : 'Agrega una nueva tarjeta o registra una tarjeta que ya tenga una deuda actual.'}
          </p>
          <div className="h-px bg-brand-green/30 my-6" />
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-text-primary">
                <Icon size={20} className="text-brand-green-light shrink-0" /> {text}
              </li>
            ))}
          </ul>
          <svg className="absolute bottom-0 left-0 w-full h-48 pointer-events-none" viewBox="0 0 288 192" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="card-form-wave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path d="M0 150 C 70 110, 120 170, 190 110 S 270 20, 288 10 L 288 192 L 0 192 Z" fill="url(#card-form-wave)" />
          </svg>
        </aside>

        {/* Formulario */}
        <form onSubmit={e => void handleSubmit(e)} className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="md:hidden text-xl font-bold text-white flex items-center gap-2">
              {isEdit ? <Pencil size={18} className="text-brand-green-light" /> : <CreditCard size={20} className="text-brand-green-light" />}
              {isEdit ? 'Editar tarjeta' : 'Registrar tarjeta'}
            </h2>
            <button type="button" onClick={onClose} className="ml-auto text-text-secondary hover:text-white transition-colors" aria-label="Cerrar">
              <X size={22} />
            </button>
          </div>

          {!isEdit && (
            <div className="grid grid-cols-2 bg-surface-base/60 rounded-xl p-1 border border-white/10">
              {[
                { value: false, label: 'Tarjeta Nueva', icon: Plus },
                { value: true, label: 'Con Deuda Actual', icon: Layers },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setHasDebt(value)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm md:text-base font-semibold transition-all ${
                    hasDebt === value ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-text-secondary hover:text-white'
                  }`}
                >
                  <Icon size={18} /> {label}
                </button>
              ))}
            </div>
          )}

          {/* Información de la tarjeta */}
          <section className="space-y-4">
            <h3 className={sectionTitle}><CreditCard size={22} className="text-brand-green-light" /> Información de la tarjeta</h3>
            <div>
              <label className={labelCls} htmlFor="card-name">Nombre de la tarjeta *</label>
              <div className={inputWrap}>
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
                  <BankLogo key={inferBankSlug(form.name) ?? 'none'} name={form.name} color={form.color} size="sm" />
                </span>
                <input
                  id="card-name" type="text" required maxLength={60}
                  placeholder="Ej. Nu, Hey Banco, Santander Amex"
                  value={form.name} onChange={set('name')}
                  className={`${inputCls} pl-12`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="card-limit">Línea de crédito *</label>
                <div className={inputWrap}>
                  <DollarSign size={18} className={iconCls} />
                  <input
                    id="card-limit" type="number" required min="1" step="0.01" placeholder="0.00"
                    value={form.creditLimit} onChange={set('creditLimit')} className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="card-last-four">Últimos 4 dígitos (opcional)</label>
                <div className={inputWrap}>
                  <CreditCard size={18} className={iconCls} />
                  <span className={`absolute left-11 top-1/2 -translate-y-1/2 text-text-muted tracking-widest pointer-events-none ${form.lastFour ? '' : 'hidden'}`}>••••</span>
                  <input
                    id="card-last-four" type="text" inputMode="numeric" pattern="\d{4}" maxLength={4}
                    placeholder="•••• 1234"
                    title="4 números"
                    value={form.lastFour}
                    onChange={e => setForm(prev => ({ ...prev, lastFour: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    className={`${inputCls} ${form.lastFour ? 'pl-20' : ''}`}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="card-cutoff">Día de corte *</label>
                <div className={inputWrap}>
                  <Calendar size={18} className={iconCls} />
                  <select id="card-cutoff" required value={form.cutoffDay} onChange={set('cutoffDay')} className={`${inputCls} appearance-none`}>
                    <option value="" disabled>Selecciona día (1–31)</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="card-due">Día límite de pago *</label>
                <div className={inputWrap}>
                  <CalendarClock size={18} className={iconCls} />
                  <select id="card-due" required value={form.paymentDueDay} onChange={set('paymentDueDay')} className={`${inputCls} appearance-none`}>
                    <option value="" disabled>Selecciona día (1–31)</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>
            {previewCutoff && previewDue && (
              <p className="text-xs text-text-secondary">
                Próximo corte: <span className="text-white font-medium">{fmtDayMonth(previewCutoff.toISOString())}</span>
                {' · '}Pagar a más tardar: <span className="text-emerald-400 font-medium">{fmtDayMonth(previewDue.toISOString())}</span>
              </p>
            )}
          </section>

          <div className="h-px bg-white/5" />

          {/* Saldo inicial / deuda actual */}
          <section className="space-y-4">
            <div>
              <h3 className={sectionTitle}>
                <Layers size={22} className="text-brand-green-light" />
                {isEdit ? 'Saldo utilizado' : hasDebt ? 'Deuda actual' : 'Saldo inicial'}
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {isEdit
                  ? 'Ajusta el saldo si necesitas corregir lo registrado.'
                  : 'Indica si actualmente tienes un saldo pendiente en esta tarjeta.'}
              </p>
            </div>

            {!isEdit && (
              <label className="flex items-center justify-between bg-surface-base/60 border border-white/10 rounded-xl px-4 py-3 cursor-pointer">
                <span className="text-text-primary font-medium">¿Tiene saldo pendiente?</span>
                <button
                  type="button" role="switch" aria-checked={hasDebt}
                  onClick={() => setHasDebt(v => !v)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${hasDebt ? 'bg-brand-green' : 'bg-surface-elevated'}`}
                >
                  <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${hasDebt ? 'translate-x-5' : ''}`} />
                </button>
              </label>
            )}

            {hasDebt && (
              <div>
                <label className={labelCls} htmlFor="card-debt">Saldo que debes *</label>
                <div className={inputWrap}>
                  <DollarSign size={18} className={iconCls} />
                  <input
                    id="card-debt" type="number" required min="0" step="0.01" placeholder="0.00"
                    value={form.debt} onChange={set('debt')}
                    className={`${inputCls} ${debtExceedsLimit ? 'border-rose-400/60 focus:border-rose-400' : ''}`}
                  />
                </div>
                {debtExceedsLimit && <p className="text-xs text-rose-400 mt-1">El saldo supera la línea de crédito.</p>}
              </div>
            )}

            {/* Resumen en tiempo real */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-brand-green/5 border border-brand-green/30 rounded-2xl p-4 md:p-5">
              <UtilizationRing pct={utilization} />
              <div className="hidden sm:block w-px self-stretch bg-brand-green/20" />
              <dl className="flex-1 w-full divide-y divide-white/5 text-sm">
                <div className="flex justify-between py-2">
                  <dt className="flex items-center gap-2 text-text-secondary"><CreditCard size={16} /> Límite de crédito:</dt>
                  <dd className="font-bold text-white">{fmt(limit)}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="flex items-center gap-2 text-text-secondary"><Calendar size={16} /> Saldo utilizado:</dt>
                  <dd className={`font-bold ${debtExceedsLimit ? 'text-rose-400' : 'text-white'}`}>{fmt(debt)}</dd>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <dt className="flex items-center gap-2 font-bold text-white"><CreditCard size={16} className="text-emerald-400" /> Crédito disponible:</dt>
                  <dd className="text-xl md:text-2xl font-extrabold text-emerald-400">{fmt(available)}</dd>
                </div>
              </dl>
            </div>
          </section>

          <div className="h-px bg-white/5" />

          {/* Color */}
          <section className="space-y-3">
            <h3 className={sectionTitle}><Palette size={22} className="text-brand-green-light" /> Color de la tarjeta</h3>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Color de la tarjeta">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={form.color === c}
                  aria-label={c}
                  onClick={() => setForm(prev => ({ ...prev, color: c }))}
                  className={`w-12 h-9 rounded-lg flex items-center justify-center transition-all ${
                    form.color === c ? 'ring-2 ring-offset-2 ring-offset-surface-card ring-white/80 scale-105' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c, boxShadow: form.color === c ? `0 0 16px ${c}80` : undefined }}
                >
                  {form.color === c && (
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <Check size={13} strokeWidth={3} style={{ color: c }} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="bg-surface-elevated hover:bg-surface-border-hover text-white py-3.5 rounded-xl font-bold transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving || debtExceedsLimit}
              className="bg-brand-green hover:bg-brand-green-light text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20 disabled:opacity-50 flex items-center justify-center gap-2">
              {isSaving
                ? <><RefreshCw size={16} className="animate-spin" /> Guardando...</>
                : <><Save size={18} /> {isEdit ? 'Guardar Cambios' : 'Guardar Tarjeta'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
