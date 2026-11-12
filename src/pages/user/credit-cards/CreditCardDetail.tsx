import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  X, ArrowLeft, CreditCard as CreditCardIcon, Banknote, Pencil, Trash2, RefreshCw, Info, Landmark,
  Calendar, CalendarClock, CalendarDays, Layers, Wallet, Plus, ChartColumn, Package, History, Receipt,
  Repeat, BadgeCheck, ListChecks,
} from 'lucide-react';
import BankLogo from '../../../components/credit-cards/BankLogo';
import CreditCardVisual from '../../../components/credit-cards/CreditCardVisual';
import UtilizationRing from '../../../components/credit-cards/UtilizationRing';
import CardFormModal from './CardFormModal';
import PayCardModal from './PayCardModal';
import {
  dueDateFor, fmt, fmtDayMonth, nextCutoffDate,
  type CardPayment, type CardTransaction, type CreditCardDetailItem,
} from '../../../utils/creditCards';

interface ScheduledSub {
  id: string;
  name: string;
  amount: number | string;
  chargeDay: number;
  creditCardId?: string;
}

type PeriodKey = 'CURRENT' | 'NEXT';
type DetailTab = 'MOVEMENTS' | 'MSI' | 'PAYMENTS';

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });

const fmtShort = (d: Date) => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

/** yyyy-mm-dd + n meses (para recorrer la fecha de compras MSI con mensualidades ya pagadas) */
function addMonthsIso(iso: string, months: number) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1 + months, Math.min(d, new Date(y, m + months, 0).getDate()));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const todayIso = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const EMPTY_EXPENSE_FORM = {
  description: '',
  amount: '',
  months: '3',
  paidMonths: '0',
  date: todayIso(),
};

export default function CreditCardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [card, setCard] = useState<CreditCardDetailItem | null>(null);
  const [linkedSubs, setLinkedSubs] = useState<ScheduledSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<PeriodKey>('CURRENT');
  const [tab, setTab] = useState<DetailTab>('MOVEMENTS');

  // Modal agregar gasto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<'ORDINARY' | 'MSI'>('ORDINARY');
  const [form, setForm] = useState(EMPTY_EXPENSE_FORM);
  const [saving, setSaving] = useState(false);

  // Modal pago
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payments, setPayments] = useState<CardPayment[]>([]);

  const [isEditCardOpen, setIsEditCardOpen] = useState(false);

  // Modal editar/eliminar transacción
  const [txEditTarget, setTxEditTarget] = useState<CardTransaction | null>(null);
  const [txEditForm, setTxEditForm] = useState({
    amount: '', description: '', type: 'ORDINARY' as 'ORDINARY' | 'MSI', months: '1', date: '',
  });
  const [savingTx, setSavingTx] = useState(false);
  const [deletingTx, setDeletingTx] = useState(false);

  const fetchCard = useCallback(async () => {
    try {
      const res = await axios.get<CreditCardDetailItem>(`${API}/credit-cards/${id}`, { headers: authHeaders() });
      setCard(res.data);
    } catch {
      setError('No se pudo cargar la tarjeta.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchSubs = useCallback(async (cardId: string) => {
    try {
      const { data } = await axios.get<ScheduledSub[]>(`${API}/scheduled-expenses`, { headers: authHeaders() });
      setLinkedSubs(data.filter(s => s.creditCardId === cardId));
    } catch { /* silencioso */ }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await axios.get<CardPayment[]>(`${API}/credit-cards/${id}/payments`, { headers: authHeaders() });
      setPayments(data);
    } catch {
      toast.error('No se pudo cargar el historial de pagos');
    }
  }, [id]);

  useEffect(() => { void fetchCard(); }, [fetchCard]);
  useEffect(() => { void fetchPayments(); }, [fetchPayments]);
  useEffect(() => { if (card) void fetchSubs(card.id); }, [card, fetchSubs]);

  // Periodo actual = el del estado de cuenta (el que se paga); siguiente = el que le sigue
  const periods = useMemo(() => {
    if (!card) return null;
    const currentStart = new Date(card.statement.periodStart);
    const currentCutoff = new Date(card.statement.cutoffDate);
    const nextStart = addDays(currentCutoff, 1);
    const nextCutoff = nextCutoffDate(card.cutoffDay, nextStart);
    return {
      CURRENT: { start: currentStart, cutoff: currentCutoff, dueDate: new Date(card.statement.dueDate) },
      NEXT: { start: nextStart, cutoff: nextCutoff, dueDate: dueDateFor(nextCutoff, card.paymentDueDay) },
    };
  }, [card]);

  const openEditTx = (tx: CardTransaction) => {
    setTxEditTarget(tx);
    setTxEditForm({
      amount: String(Number(tx.amount)),
      description: tx.description,
      type: tx.type,
      months: String(tx.months),
      date: tx.date.split('T')[0],
    });
  };

  const handleUpdateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txEditTarget) return;
    setSavingTx(true);
    try {
      await axios.patch(
        `${API}/credit-cards/transactions/${txEditTarget.id}`,
        {
          amount: parseFloat(txEditForm.amount),
          description: txEditForm.description,
          type: txEditForm.type,
          months: txEditForm.type === 'MSI' ? parseInt(txEditForm.months) : undefined,
          date: txEditForm.date,
        },
        { headers: authHeaders() },
      );
      toast.success('Movimiento actualizado');
      setTxEditTarget(null);
      await fetchCard();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        toast.error((err.response.data as { message: string }).message ?? 'Error al actualizar');
      } else {
        toast.error('Error al actualizar el movimiento');
      }
    } finally {
      setSavingTx(false);
    }
  };

  const handleDeleteTx = async () => {
    if (!txEditTarget) return;
    if (!confirm('¿Eliminar este movimiento? El saldo se ajustará automáticamente.')) return;
    setDeletingTx(true);
    try {
      await axios.delete(`${API}/credit-cards/transactions/${txEditTarget.id}`, { headers: authHeaders() });
      toast.success('Movimiento eliminado');
      setTxEditTarget(null);
      await fetchCard();
    } catch {
      toast.error('Error al eliminar el movimiento');
    } finally {
      setDeletingTx(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    setSaving(true);
    try {
      let postAmount: number;
      let postMonths: number | undefined;
      let postDate = form.date;

      if (txType === 'MSI') {
        const originalAmount = parseFloat(form.amount);
        const totalMonths = parseInt(form.months);
        const paidMonths = parseInt(form.paidMonths) || 0;
        const remainingMonths = totalMonths - paidMonths;

        if (remainingMonths <= 0) {
          toast.error('Los meses ya pagados no pueden ser iguales o mayores al plazo total');
          setSaving(false);
          return;
        }
        postAmount = (originalAmount / totalMonths) * remainingMonths;
        postMonths = remainingMonths;
        // Se registra solo el plan restante: arranca tantos meses después como mensualidades ya pagadas,
        // para que el estado de cuenta no vuelva a facturar las mensualidades cubiertas.
        postDate = addMonthsIso(form.date, paidMonths);
      } else {
        postAmount = parseFloat(form.amount);
        postMonths = undefined;
      }

      await axios.post(
        `${API}/credit-cards/${card.id}/transactions`,
        {
          amount: postAmount,
          description: form.description,
          type: txType,
          date: postDate,
          ...(txType === 'MSI' && { months: postMonths }),
        },
        { headers: authHeaders() },
      );
      toast.success('Gasto registrado');
      setIsModalOpen(false);
      setForm({ ...EMPTY_EXPENSE_FORM, date: todayIso() });
      setTxType('ORDINARY');
      await fetchCard();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        toast.error((err.response.data as { message: string }).message ?? 'Límite de crédito excedido');
      } else {
        toast.error('Error al registrar el gasto.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-text-secondary gap-2">
        <RefreshCw size={18} className="animate-spin" /> Cargando tarjeta...
      </div>
    );
  }
  if (error || !card || !periods) return <div className="p-8 text-rose-400 text-center">{error || 'Tarjeta no encontrada.'}</div>;

  const creditLimit = Number(card.creditLimit);
  const { usedBalance, availableCredit, utilizationPct } = card;

  const selected = periods[period];
  const periodEnd = addDays(selected.cutoff, 1);
  const ordinaryTxs = card.transactions.filter(t => !t.isMSI);
  const periodTxs = ordinaryTxs
    .filter(t => { const d = new Date(t.date); return d >= selected.start && d < periodEnd; })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const prevTxs = ordinaryTxs
    .filter(t => new Date(t.date) < selected.start)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const msi = card.transactions
    .filter(t => t.isMSI)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const msiTotal = msi.reduce((sum, t) => sum + Number(t.amount), 0);
  const msiMonthlyTotal = msi
    .filter(t => t.billedMonths < t.totalMonths)
    .reduce((sum, t) => sum + t.monthlyPayment, 0);

  const paymentsTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const periodSpend = periodTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  // Gasto acumulado del periodo para la mini gráfica
  const sparkline = periodTxs.reduce(
    (points, t) => [...points, { v: points[points.length - 1].v + Number(t.amount) }],
    [{ v: 0 }],
  );
  const now = new Date();
  const showSubs = now >= selected.start && now < periodEnd;

  // Preview del formulario de gasto
  const originalAmount = parseFloat(form.amount) || 0;
  const totalMonths = parseInt(form.months) || 1;
  const paidMonths = parseInt(form.paidMonths) || 0;
  const remainingMonths = Math.max(totalMonths - paidMonths, 0);
  const monthlyPayment = totalMonths > 0 ? originalAmount / totalMonths : 0;
  const computedDebt = monthlyPayment * remainingMonths;
  const exceedsLimit = txType === 'ORDINARY' ? originalAmount > availableCredit : computedDebt > availableCredit;

  const panelCls = 'bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card';
  const thCls = 'px-3 py-2.5 font-semibold text-text-secondary text-xs uppercase tracking-wider';
  const inputCls = 'w-full bg-surface-base/70 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted';
  const labelCls = 'block text-text-secondary text-sm font-medium mb-1';
  const modalCls = 'bg-surface-card/90 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full';

  const logo = <BankLogo key={card.bank ?? card.name} name={card.name} bank={card.bank} color={card.color} size="sm" />;

  const infoRows = [
    { icon: Landmark, label: 'Línea de crédito', value: fmt(creditLimit) },
    { icon: Calendar, label: 'Fecha de inicio', value: fmtDayMonth(selected.start.toISOString()) },
    { icon: CalendarDays, label: 'Fecha de corte', value: fmtDayMonth(selected.cutoff.toISOString()) },
    { icon: CalendarClock, label: 'Fecha límite de pago', value: fmtDayMonth(selected.dueDate.toISOString()) },
    {
      icon: Layers, label: 'Deuda total (próximo pago)', value: fmt(card.statement.debt),
      cls: card.statement.debt > 0 ? 'text-rose-400' : 'text-emerald-400',
    },
    { icon: Wallet, label: 'Saldo disponible', value: fmt(availableCredit), cls: 'text-emerald-400' },
  ];

  const txTable = (txs: CardTransaction[], emptyText: string, withSubs = false) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className={thCls}>Fecha</th>
            <th className={thCls}>Descripción</th>
            <th className={`${thCls} text-right`}>Monto</th>
          </tr>
        </thead>
        <tbody>
          {txs.length === 0 && !(withSubs && linkedSubs.length > 0) ? (
            <tr><td colSpan={3} className="p-6 text-center text-text-muted">{emptyText}</td></tr>
          ) : (
            <>
              {txs.map(t => (
                <tr
                  key={t.id}
                  className="odd:bg-surface-base/40 hover:bg-surface-elevated/40 cursor-pointer transition-colors"
                  onClick={() => openEditTx(t)}
                  title="Click para editar o eliminar"
                >
                  <td className="px-3 py-2.5 text-text-primary whitespace-nowrap">{fmtDate(t.date)}</td>
                  <td className="px-3 py-2.5 text-white">
                    <span className="flex items-center gap-2.5 capitalize">
                      <Receipt size={16} className="text-brand-green-light shrink-0" /> {t.description}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-white whitespace-nowrap">{fmt(t.amount)}</td>
                </tr>
              ))}
              {withSubs && linkedSubs.map(sub => (
                <tr key={`sub-${sub.id}`} className="text-text-secondary italic">
                  <td className="px-3 py-2.5 whitespace-nowrap">Día {sub.chargeDay}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <Repeat size={16} className="shrink-0" /> {sub.name}
                      <span className="text-xs bg-surface-elevated text-text-primary px-1.5 py-0.5 rounded-full not-italic font-medium">
                        Programado
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">{fmt(sub.amount)}</td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 md:p-8 text-white font-sans max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-5 mb-6">
        <button
          onClick={() => navigate('/credit-cards')}
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors bg-surface-card/60 border border-white/5 px-3 py-2 rounded-xl"
        >
          <ArrowLeft size={18} /> <span className="hidden sm:inline">Regresar</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <CreditCardIcon size={28} className="text-brand-green-light" />
          Detalle de Tarjeta
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[23rem_minmax(0,1fr)] gap-6">
        {/* ── Columna izquierda ── */}
        <div className="space-y-6">
          <div className={`${panelCls} p-4 flex items-center gap-4`}>
            <CreditCardVisual color={card.color} lastFour={card.lastFour} logo={logo} className="max-w-44 sm:max-w-52" />
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold truncate">{card.name}</h2>
                <button
                  onClick={() => setIsEditCardOpen(true)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-elevated transition-all shrink-0"
                  title="Editar tarjeta"
                >
                  <Pencil size={15} />
                </button>
              </div>
              {card.lastFour && (
                <span className="inline-block text-xs font-medium bg-surface-elevated text-text-primary px-2.5 py-1 rounded-lg">
                  Terminación: {card.lastFour}
                </span>
              )}
            </div>
          </div>

          <div className={`${panelCls} p-5`}>
            <h2 className="flex items-center gap-2 text-lg font-bold mb-3">
              <Info size={20} className="text-brand-green-light" /> Información General
            </h2>
            <dl className="divide-y divide-white/5 text-sm">
              {infoRows.map(({ icon: Icon, label, value, cls }) => (
                <div key={label} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="flex items-center gap-2.5 text-text-primary"><Icon size={16} className="text-text-muted shrink-0" /> {label}</dt>
                  <dd className={`font-bold whitespace-nowrap ${cls ?? 'text-white'}`}>{value}</dd>
                </div>
              ))}
              {msiMonthlyTotal > 0 && (
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="flex items-center gap-2.5 text-text-primary"><Package size={16} className="text-text-muted shrink-0" /> Mensualidades MSI</dt>
                  <dd className="font-bold text-white whitespace-nowrap">{fmt(msiMonthlyTotal)}</dd>
                </div>
              )}
            </dl>
            <button
              onClick={() => setIsPayModalOpen(true)}
              disabled={usedBalance <= 0}
              className="w-full mt-4 bg-brand-green hover:bg-brand-green-light text-white py-3 rounded-xl font-bold text-lg transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Banknote size={20} /> Registrar Pago
            </button>
          </div>

          <div className={`${panelCls} p-5`}>
            <h2 className="flex items-center gap-2 text-lg font-bold mb-3">
              <CalendarDays size={20} className="text-brand-green-light" /> Períodos
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {([['CURRENT', 'Período actual'], ['NEXT', 'Período siguiente']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  aria-pressed={period === key}
                  className={`rounded-xl px-3 py-3 text-center transition-all border ${
                    period === key
                      ? 'border-brand-green bg-brand-green/10 text-white shadow-inner'
                      : 'border-white/5 bg-surface-base/40 text-text-secondary hover:text-white'
                  }`}
                >
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-sm mt-0.5">{fmtShort(periods[key].start)} – {fmtShort(periods[key].cutoff)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Columna derecha ── */}
        <div className="space-y-6 min-w-0">
          {/* Métricas */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <div className={`${panelCls} p-4 flex items-center gap-3`}>
              <div className="hidden sm:flex w-11 h-11 rounded-full bg-brand-green/10 items-center justify-center shrink-0">
                <Landmark size={20} className="text-brand-green-light" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-secondary">Límite de crédito</p>
                <p className="text-lg md:text-xl font-extrabold truncate">{fmt(creditLimit)}</p>
              </div>
            </div>
            <div className={`${panelCls} p-4 flex items-center gap-3`}>
              <div className="hidden sm:flex w-11 h-11 rounded-full bg-brand-green/10 items-center justify-center shrink-0">
                <CreditCardIcon size={20} className="text-brand-green-light" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-secondary">Saldo utilizado</p>
                <p className="text-lg md:text-xl font-extrabold truncate">{fmt(usedBalance)}</p>
              </div>
            </div>
            <div className={`${panelCls} p-4 flex items-center gap-3`}>
              <UtilizationRing pct={utilizationPct} size="sm" />
              <div className="min-w-0">
                <p className="text-xs text-text-secondary">Utilización</p>
                <p className="text-lg md:text-xl font-extrabold">{utilizationPct.toFixed(1)}%</p>
              </div>
            </div>
            <div className={`${panelCls} p-4 flex items-center gap-3`}>
              <div className="hidden sm:flex w-11 h-11 rounded-full bg-brand-green/10 items-center justify-center shrink-0">
                <Wallet size={20} className="text-brand-green-light" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-secondary">Crédito disponible</p>
                <p className="text-lg md:text-xl font-extrabold text-emerald-400 truncate">{fmt(availableCredit)}</p>
              </div>
            </div>
          </div>

          {/* Pestañas */}
          <div className="grid grid-cols-3 gap-2 bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-1.5" role="tablist">
            {([
              ['MOVEMENTS', 'Movimientos', ListChecks, periodTxs.length],
              ['MSI', 'Productos a Crédito', Layers, msi.length],
              ['PAYMENTS', 'Pagos', CreditCardIcon, payments.length],
            ] as const).map(([key, label, Icon, count]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex items-center justify-center gap-2 px-2 py-3 rounded-xl text-sm md:text-base font-semibold transition-all ${
                  tab === key ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-text-secondary hover:text-white hover:bg-surface-elevated/40'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{label}</span>
                {count > 0 && (
                  <span className={`hidden sm:inline text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/20' : 'bg-surface-elevated'}`}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {tab === 'MOVEMENTS' && (
            <>
              {/* Movimientos del periodo */}
              <div className={`${panelCls} p-4 md:p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays size={22} className="text-brand-green-light mt-0.5" />
                    <div>
                      <h2 className="text-lg font-bold">
                        Movimientos del {period === 'CURRENT' ? 'Período Actual' : 'Período Siguiente'}
                      </h2>
                      <p className="text-sm text-text-secondary">
                        {fmtDayMonth(selected.start.toISOString())} – {fmtDayMonth(selected.cutoff.toISOString())}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={availableCredit <= 0}
                    className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-light disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-white text-sm rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20"
                    title={availableCredit <= 0 ? 'Sin crédito disponible' : undefined}
                  >
                    <Plus size={16} /> Agregar Gasto
                  </button>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_15rem] gap-4">
                  <div className="bg-surface-base/30 rounded-xl overflow-hidden">
                    {txTable(periodTxs, 'Sin movimientos en este período.', showSubs)}
                  </div>
                  <div className="bg-surface-base/40 border border-white/5 rounded-xl p-4 flex flex-col">
                    <p className="flex items-center gap-2 font-semibold text-text-primary">
                      <ChartColumn size={18} className="text-brand-green-light" /> Gastos del período
                    </p>
                    <p className="text-2xl font-extrabold mt-2">{fmt(periodSpend)}</p>
                    <p className="text-sm text-text-secondary">
                      {periodTxs.length} {periodTxs.length === 1 ? 'movimiento' : 'movimientos'}
                    </p>
                    <div className="h-20 mt-auto pt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkline} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                          <defs>
                            <linearGradient id="period-spend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
                              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} fill="url(#period-spend)" isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Periodo anterior */}
              <div className={`${panelCls} p-4 md:p-5`}>
                <div className="flex items-start gap-3 mb-4">
                  <History size={22} className="text-brand-green-light mt-0.5" />
                  <div>
                    <h2 className="text-lg font-bold">Movimientos del Período Anterior</h2>
                    <p className="text-sm text-text-secondary">Antes del {fmtDayMonth(selected.start.toISOString())}</p>
                  </div>
                </div>
                <div className="bg-surface-base/30 rounded-xl overflow-hidden">
                  {txTable(prevTxs, 'Sin movimientos anteriores.')}
                </div>
              </div>
            </>
          )}

          {tab === 'MSI' && (
            <div className={`${panelCls} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Package size={22} className="text-brand-green-light" /> Productos a Crédito
                </h2>
                {msi.length > 0 && (
                  <span className="bg-brand-green/15 text-emerald-400 text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Total: {fmt(msiTotal)}
                  </span>
                )}
              </div>
              <div className="bg-surface-base/30 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className={thCls}>Fecha</th>
                      <th className={thCls}>Producto</th>
                      <th className={`${thCls} text-right`}>Total</th>
                      <th className={`${thCls} text-center`}>Meses</th>
                      <th className={`${thCls} text-right`}>Pago mensual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {msi.length === 0 ? (
                      <tr><td colSpan={5} className="p-6 text-center text-text-muted">Sin compras a meses sin intereses.</td></tr>
                    ) : msi.map(t => (
                      <tr
                        key={t.id}
                        className="odd:bg-surface-base/40 hover:bg-surface-elevated/40 cursor-pointer transition-colors"
                        onClick={() => openEditTx(t)}
                        title="Click para editar o eliminar"
                      >
                        <td className="px-3 py-2.5 text-text-primary whitespace-nowrap">{fmtDate(t.date)}</td>
                        <td className="px-3 py-2.5 text-white capitalize">{t.description}</td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">{fmt(t.amount)}</td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {t.billedMonths >= t.totalMonths ? (
                            <span className="text-emerald-400 text-xs font-bold">Liquidado</span>
                          ) : (
                            <><span className="text-text-primary">{t.currentMonth}</span><span className="text-text-muted">/{t.totalMonths}</span></>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-white whitespace-nowrap">{fmt(t.monthlyPayment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'PAYMENTS' && (
            <div className={`${panelCls} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <BadgeCheck size={22} className="text-brand-green-light" /> Pagos
                </h2>
                {payments.length > 0 && (
                  <span className="bg-brand-green/15 text-emerald-400 text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Total pagado: {fmt(paymentsTotal)}
                  </span>
                )}
              </div>
              <div className="bg-surface-base/30 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className={thCls}>Fecha</th>
                      <th className={thCls}>Notas</th>
                      <th className={`${thCls} text-right`}>Monto pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr><td colSpan={3} className="p-6 text-center text-text-muted">Aún no hay pagos registrados.</td></tr>
                    ) : payments.map(p => (
                      <tr key={p.id} className="odd:bg-surface-base/40">
                        <td className="px-3 py-2.5 text-text-primary whitespace-nowrap">
                          {fmtDate(p.paymentDate)}
                        </td>
                        <td className="px-3 py-2.5">
                          {p.reference || p.notes ? (
                            <>
                              {p.reference && <span className="block text-white font-medium">{p.reference}</span>}
                              {p.notes && <span className="block text-text-secondary text-xs">{p.notes}</span>}
                            </>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-400 whitespace-nowrap">+{fmt(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal editar tarjeta ── */}
      {isEditCardOpen && (
        <CardFormModal
          card={card}
          onClose={() => setIsEditCardOpen(false)}
          onSaved={() => { setIsEditCardOpen(false); void fetchCard(); }}
        />
      )}

      {/* ── Modal agregar gasto ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
          <div className={`${modalCls} max-w-md p-6 max-h-[92vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="text-brand-green-light" size={20} /> Registrar Gasto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 bg-surface-base/60 rounded-xl p-1 mb-5 border border-white/10">
              {(['ORDINARY', 'MSI'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxType(t)}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${txType === t ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-text-secondary hover:text-white'}`}
                >
                  {t === 'ORDINARY' ? 'Ordinario' : 'Meses sin intereses'}
                </button>
              ))}
            </div>

            <form onSubmit={e => void handleAddExpense(e)} className="space-y-4">
              <div>
                <label className={labelCls}>{txType === 'MSI' ? 'Fecha de compra original' : 'Fecha del gasto'}</label>
                <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{txType === 'MSI' ? 'Producto' : 'Descripción'}</label>
                <input type="text" placeholder={txType === 'MSI' ? 'Ej. Laptop, Celular...' : 'Ej. Despensa, Gasolina...'} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{txType === 'MSI' ? 'Monto original de compra (MXN)' : 'Monto (MXN)'}</label>
                <input type="number" step="0.01" min="0.01" placeholder="0.00" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} />
                {txType === 'ORDINARY' && exceedsLimit && form.amount && (
                  <p className="text-rose-400 text-xs mt-1 font-medium">Supera el crédito disponible ({fmt(availableCredit)})</p>
                )}
              </div>

              {txType === 'MSI' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Meses del plan</label>
                      <input type="number" min="2" max="48" required value={form.months} onChange={e => setForm({ ...form, months: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Meses ya pagados</label>
                      <input type="number" min="0" value={form.paidMonths} onChange={e => setForm({ ...form, paidMonths: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                  <p className="text-text-muted text-xs -mt-2">Deja "ya pagados" en 0 si es una compra nueva.</p>

                  {originalAmount > 0 && remainingMonths > 0 && (
                    <div className={`rounded-xl p-3 text-sm space-y-1 border ${exceedsLimit ? 'bg-rose-500/10 border-rose-500/30' : 'bg-brand-green/5 border-brand-green/20'}`}>
                      <div className="flex justify-between text-text-secondary">
                        <span>Mensualidad</span>
                        <span className="text-white font-bold">{fmt(monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>Meses restantes</span>
                        <span className="text-white font-bold">{remainingMonths}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary border-t border-white/5 pt-1">
                        <span>Deuda a registrar</span>
                        <span className={`font-bold ${exceedsLimit ? 'text-rose-400' : 'text-emerald-400'}`}>{fmt(computedDebt)}</span>
                      </div>
                      {exceedsLimit && (
                        <p className="text-rose-400 text-xs font-medium pt-1">Supera el crédito disponible ({fmt(availableCredit)})</p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-surface-elevated hover:bg-surface-border-hover text-white py-2.5 rounded-xl transition-all font-medium">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || exceedsLimit}
                  className="bg-brand-green hover:bg-brand-green-light disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-brand-green/20"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal pago ── */}
      {isPayModalOpen && (
        <PayCardModal
          card={card}
          onClose={() => setIsPayModalOpen(false)}
          onPaid={() => { setIsPayModalOpen(false); void Promise.all([fetchCard(), fetchPayments()]); }}
        />
      )}

      {/* ── Modal editar/eliminar transacción ── */}
      {txEditTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setTxEditTarget(null)}>
          <div className={`${modalCls} max-w-md`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-white/5">
              <h2 className="text-xl font-bold flex items-center gap-2"><Pencil className="text-brand-green-light" size={18} /> Editar Movimiento</h2>
              <button onClick={() => setTxEditTarget(null)} className="text-text-secondary hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={e => void handleUpdateTx(e)} className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Fecha</label>
                <input type="date" required value={txEditForm.date} onChange={e => setTxEditForm(p => ({ ...p, date: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Descripción</label>
                <input type="text" required value={txEditForm.description} onChange={e => setTxEditForm(p => ({ ...p, description: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Monto (MXN)</label>
                <input type="number" step="0.01" min="0.01" required value={txEditForm.amount} onChange={e => setTxEditForm(p => ({ ...p, amount: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tipo</label>
                <div className="grid grid-cols-2 bg-surface-base/60 rounded-xl p-1 border border-white/10">
                  {(['ORDINARY', 'MSI'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setTxEditForm(p => ({ ...p, type: t }))}
                      className={`py-2 rounded-lg text-sm font-bold transition-all ${txEditForm.type === t ? 'bg-brand-green text-white' : 'text-text-secondary hover:text-white'}`}>
                      {t === 'ORDINARY' ? 'Ordinario' : 'MSI'}
                    </button>
                  ))}
                </div>
              </div>
              {txEditForm.type === 'MSI' && (
                <div>
                  <label className={labelCls}>Meses</label>
                  <input type="number" min="1" max="48" required value={txEditForm.months} onChange={e => setTxEditForm(p => ({ ...p, months: e.target.value }))} className={inputCls} />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void handleDeleteTx()}
                  disabled={deletingTx}
                  className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  {deletingTx ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button type="button" onClick={() => setTxEditTarget(null)}
                  className="flex-1 bg-surface-elevated hover:bg-surface-border-hover text-white py-2.5 rounded-xl font-medium transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={savingTx}
                  className="flex-1 bg-brand-green hover:bg-brand-green-light text-white py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingTx ? <><RefreshCw size={15} className="animate-spin" />Guardando...</> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
