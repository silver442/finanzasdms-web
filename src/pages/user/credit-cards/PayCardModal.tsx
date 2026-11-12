import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  X, CreditCard, CalendarDays, Layers, DollarSign, Calendar, NotebookPen, ReceiptText, CircleCheck, RefreshCw,
} from 'lucide-react';
import { fmt, fmtDayMonth, type CreditCardItem } from '../../../utils/creditCards';

interface PayCardModalProps {
  card: CreditCardItem;
  onClose: () => void;
  onPaid: () => void;
}

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function todayIso() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

export default function PayCardModal({ card, onClose, onPaid }: PayCardModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayIso);
  const [notes, setNotes] = useState('');
  const [paying, setPaying] = useState(false);

  const { usedBalance, statement } = card;
  const payment = parseFloat(amount) || 0;
  const exceeds = payment > usedBalance + 0.005;
  const balanceAfter = Math.max(0, round2(usedBalance - payment));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payment <= 0) { toast.error('Ingresa un monto válido'); return; }
    if (exceeds) { toast.error('El pago supera el saldo utilizado'); return; }
    setPaying(true);
    try {
      await axios.post(
        `${API}/credit-cards/${card.id}/pay`,
        { amount: payment, paymentDate, notes: notes.trim() || undefined },
        { headers: authHeaders() },
      );
      toast.success(`Pago de ${fmt(payment)} registrado`);
      onPaid();
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string | string[] }>(err) ? err.response?.data?.message : undefined;
      toast.error((Array.isArray(message) ? message[0] : message) ?? 'Error al registrar el pago');
    } finally {
      setPaying(false);
    }
  };

  const quickCards = [
    {
      key: 'statement',
      icon: CalendarDays,
      title: 'Deuda del corte',
      subtitle: `Vence el ${fmtDayMonth(statement.dueDate)}`,
      value: statement.debt,
      valueCls: statement.debt > 0 ? 'text-rose-400' : 'text-emerald-400',
    },
    {
      key: 'total',
      icon: Layers,
      title: 'Saldo total utilizado',
      subtitle: 'Incluye lo aún no facturado y MSI',
      value: usedBalance,
      valueCls: 'text-white',
    },
  ];

  const fieldCls = 'w-full bg-surface-base/70 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted';
  const iconCls = 'absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none';
  const labelCls = 'block text-text-secondary font-medium mb-2';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-6" onClick={onClose}>
      <form
        onSubmit={e => void handleSubmit(e)}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-modal-title"
        className="bg-surface-card/90 backdrop-blur-md border border-white/5 rounded-3xl shadow-card w-full max-w-2xl max-h-[94vh] overflow-y-auto p-5 md:p-8 space-y-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="pay-modal-title" className="flex items-center gap-3 text-2xl md:text-3xl font-extrabold text-white">
            <CreditCard size={30} className="text-brand-green-light" /> Registrar Pago
          </h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-white transition-colors" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        {/* Atajos: deuda del corte vs. saldo total */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickCards.map(({ key, icon: Icon, title, subtitle, value, valueCls }) => {
            const active = value > 0 && round2(payment) === round2(value);
            return (
              <button
                key={key}
                type="button"
                disabled={value <= 0}
                onClick={() => setAmount(value.toFixed(2))}
                className={`flex items-start gap-4 text-left rounded-2xl border p-4 md:p-5 transition-all disabled:cursor-not-allowed ${
                  active ? 'border-brand-green bg-brand-green/10' : 'border-white/10 bg-surface-base/40 hover:border-white/20'
                }`}
              >
                <span className="w-12 h-12 rounded-xl bg-brand-green/15 flex items-center justify-center shrink-0">
                  <Icon size={24} className="text-brand-green-light" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-white">{title}</span>
                  <span className="block text-sm text-text-secondary">{subtitle}</span>
                  <span className={`block text-2xl md:text-3xl font-extrabold mt-1 ${valueCls}`}>{fmt(value)}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <label htmlFor="pay-amount" className={labelCls}>Monto del pago <span className="text-rose-400">*</span></label>
          <div className="relative">
            <DollarSign size={22} className={iconCls} />
            <input
              id="pay-amount" type="number" required step="0.01" min="0.01" placeholder="0.00" autoFocus
              value={amount} onChange={e => setAmount(e.target.value)}
              className={`${fieldCls} py-4 text-lg ${exceeds ? 'border-rose-400/60 focus:border-rose-400' : 'border-brand-green/60'}`}
            />
          </div>
          {exceeds && <p className="text-xs text-rose-400 mt-1">El pago supera el saldo utilizado ({fmt(usedBalance)}).</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pay-date" className={labelCls}>Fecha del pago <span className="text-rose-400">*</span></label>
            <div className="relative">
              <Calendar size={20} className={iconCls} />
              <input
                id="pay-date" type="date" required max={todayIso()}
                value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                className={`${fieldCls} scheme-dark`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="pay-notes" className={labelCls}>Notas (opcional)</label>
            <div className="relative">
              <NotebookPen size={20} className={iconCls} />
              <input
                id="pay-notes" type="text" maxLength={250} placeholder="Ej. Pago del corte, abono, etc."
                value={notes} onChange={e => setNotes(e.target.value)} className={fieldCls}
              />
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <p className="flex items-center gap-3 bg-surface-elevated/50 px-5 py-3.5 font-bold text-white text-lg">
            <ReceiptText size={22} className="text-brand-green-light" /> Resumen del pago
          </p>
          <dl className="px-5 py-4 space-y-2">
            <div className="flex justify-between text-text-primary">
              <dt>Deuda actual</dt>
              <dd>{fmt(usedBalance)}</dd>
            </div>
            <div className="flex justify-between text-text-primary">
              <dt>Pago a registrar</dt>
              <dd className="text-emerald-400">-{fmt(payment)}</dd>
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-1">
              <dt className="font-bold text-white">Saldo después del pago</dt>
              <dd className="text-2xl font-extrabold text-emerald-400">{fmt(balanceAfter)}</dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={onClose}
            className="bg-surface-elevated hover:bg-surface-border-hover text-white py-4 rounded-xl font-bold text-lg transition-all">
            Cancelar
          </button>
          <button type="submit" disabled={paying || payment <= 0 || exceeds}
            className="bg-brand-green hover:bg-brand-green-light text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-brand-green/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {paying
              ? <><RefreshCw size={18} className="animate-spin" /> Registrando...</>
              : <><CircleCheck size={22} /> Registrar Pago</>}
          </button>
        </div>
      </form>
    </div>
  );
}
