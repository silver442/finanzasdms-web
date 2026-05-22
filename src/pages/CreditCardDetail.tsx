import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { X, CreditCard as CreditCardIcon, Banknote } from 'lucide-react';

interface CardTx {
  id: string;
  amount: number | string;
  description: string;
  type: 'ORDINARY' | 'MSI';
  months: number;
  date: string;
}

interface CardDetail {
  id: string;
  name: string;
  color?: string;
  creditLimit: number | string;
  cutoffDay: number;
  currentBalance: number | string;
  nextCutoffDate: string;
  paymentDeadline: string;
  transactions: CardTx[];
}

interface ScheduledSub {
  id: string;
  name: string;
  amount: number | string;
  chargeDay: number;
  creditCardId?: string;
}

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const fmt = (v: number | string) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });

const EMPTY_FORM = {
  description: '',
  amount: '',
  months: '3',
  paidMonths: '0',
  date: new Date().toISOString().split('T')[0],
};

export default function CreditCardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [card, setCard] = useState<CardDetail | null>(null);
  const [linkedSubs, setLinkedSubs] = useState<ScheduledSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal agregar gasto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<'ORDINARY' | 'MSI'>('ORDINARY');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Modal pago
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchCard = useCallback(async () => {
    try {
      const res = await axios.get<CardDetail>(`${API}/credit-cards/${id}`, { headers: authHeaders() });
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

  useEffect(() => { void fetchCard(); }, [fetchCard]);
  useEffect(() => { if (card) void fetchSubs(card.id); }, [card, fetchSubs]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    setSaving(true);
    try {
      let postAmount: number;
      let postMonths: number | undefined;

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
          date: form.date,
          ...(txType === 'MSI' && { months: postMonths }),
        },
        { headers: authHeaders() },
      );
      setIsModalOpen(false);
      setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0] });
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

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error('Ingresa un monto válido'); return; }
    setPaying(true);
    try {
      await axios.post(`${API}/credit-cards/${card.id}/pay`, { amount }, { headers: authHeaders() });
      toast.success(`Pago de ${fmt(amount)} registrado`);
      setIsPayModalOpen(false);
      setPayAmount('');
      await fetchCard();
    } catch {
      toast.error('Error al registrar el pago.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-400 text-center">Cargando tarjeta...</div>;
  if (error || !card) return <div className="p-8 text-red-400 text-center">{error || 'Tarjeta no encontrada.'}</div>;

  const creditLimit = Number(card.creditLimit);
  const currentBalance = Number(card.currentBalance);
  const available = creditLimit - currentBalance;

  const msi = card.transactions.filter(t => t.type === 'MSI');
  const msiMonthlyTotal = msi.reduce((sum, t) => sum + Number(t.amount) / t.months, 0);

  const nextCutoff = new Date(card.nextCutoffDate);
  const prevCutoff = new Date(nextCutoff);
  prevCutoff.setMonth(prevCutoff.getMonth() - 1);
  const ordinaryTxs = card.transactions.filter(t => t.type === 'ORDINARY');
  const currentPeriod = ordinaryTxs.filter(t => new Date(t.date) >= prevCutoff);
  const prevPeriod = ordinaryTxs.filter(t => new Date(t.date) < prevCutoff);

  // Cálculos MSI en tiempo real (para preview y validación)
  const originalAmount = parseFloat(form.amount) || 0;
  const totalMonths = parseInt(form.months) || 1;
  const paidMonths = parseInt(form.paidMonths) || 0;
  const remainingMonths = Math.max(totalMonths - paidMonths, 0);
  const monthlyPayment = totalMonths > 0 ? originalAmount / totalMonths : 0;
  const computedDebt = monthlyPayment * remainingMonths;

  // Validación de límite en tiempo real
  const enteredOrdinary = parseFloat(form.amount) || 0;
  const exceedsLimit =
    txType === 'ORDINARY'
      ? enteredOrdinary > available
      : computedDebt > available;

  const thCls = 'p-3 font-semibold text-slate-400';
  const inputCls = 'w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500';

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto relative">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/credit-cards')}
          className="text-slate-400 hover:text-emerald-400 transition-colors bg-slate-800 p-2 rounded-lg"
        >
          ← Regresar
        </button>
        <h1 className="text-3xl font-extrabold text-emerald-400 flex items-center gap-3">
          <CreditCardIcon size={28} style={{ color: card.color ?? '#10B981' }} />
          {card.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Columna izquierda ── */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">
              Información General
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Línea de Crédito</span>
                <span className="font-bold">{fmt(creditLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Día de Corte</span>
                <span className="font-medium text-slate-300">Día {card.cutoffDay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Próx. Corte</span>
                <span className="font-medium text-slate-300">{fmtDate(card.nextCutoffDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Límite de Pago</span>
                <span className="font-medium text-emerald-400">{fmtDate(card.paymentDeadline)}</span>
              </div>
              <div className="pt-3 border-t border-slate-700 flex justify-between">
                <span className="text-slate-400">Deuda Total</span>
                <span className="font-bold text-red-400">{fmt(currentBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Saldo Disponible</span>
                <span className={`font-bold ${available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt(available)}
                </span>
              </div>
              {msi.length > 0 && (
                <div className="pt-3 border-t border-slate-700 flex justify-between">
                  <span className="text-slate-400">Pago MSI mensual</span>
                  <span className="font-bold text-amber-400">{fmt(msiMonthlyTotal)}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => { setPayAmount(''); setIsPayModalOpen(true); }}
              className="w-full mt-5 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Banknote size={18} />
              Registrar Pago
            </button>
          </div>

          {msi.length > 0 && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
              <div className="bg-slate-900/50 p-4 border-b border-slate-700">
                <h2 className="text-base font-bold text-white">Productos a Crédito (MSI)</h2>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 bg-slate-800/50">
                  <tr>
                    <th className="p-3 font-semibold">Descripción</th>
                    <th className="p-3 font-semibold text-center">Meses</th>
                    <th className="p-3 font-semibold text-right">Mensual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {msi.map(t => (
                    <tr key={t.id} className="hover:bg-slate-700/30">
                      <td className="p-3 text-white capitalize">
                        <div>{t.description}</div>
                        <div className="text-slate-500">{fmtDate(t.date)}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                          {t.months}m
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-amber-400">
                        {fmt(Number(t.amount) / t.months)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Columna derecha ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Periodo Actual */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Movimientos del Periodo Actual</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Desde {fmtDate(prevCutoff.toISOString())} · corte {fmtDate(card.nextCutoffDate)}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={available <= 0}
                className="text-xs bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed px-3 py-1.5 text-white rounded-lg font-bold transition-colors"
                title={available <= 0 ? 'Sin saldo disponible' : undefined}
              >
                + Agregar Gasto
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 bg-slate-800/50">
                <tr>
                  <th className={thCls}>Fecha</th>
                  <th className={thCls}>Descripción</th>
                  <th className={`${thCls} text-right`}>Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {currentPeriod.length === 0 && linkedSubs.length === 0 ? (
                  <tr><td colSpan={3} className="p-6 text-center text-slate-500">Sin movimientos en este periodo.</td></tr>
                ) : (
                  <>
                    {currentPeriod.map(t => (
                      <tr key={t.id} className="hover:bg-slate-700/30">
                        <td className="p-3 text-slate-300">{fmtDate(t.date)}</td>
                        <td className="p-3 text-white capitalize">{t.description}</td>
                        <td className="p-3 text-right font-medium text-red-400">{fmt(t.amount)}</td>
                      </tr>
                    ))}
                    {linkedSubs.map(sub => (
                      <tr key={`sub-${sub.id}`} className="opacity-60 italic bg-slate-900/20">
                        <td className="p-3 text-slate-400">Día {sub.chargeDay}</td>
                        <td className="p-3 text-slate-300">
                          {sub.name}
                          <span className="ml-2 text-xs bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full not-italic font-medium">
                            Programado
                          </span>
                        </td>
                        <td className="p-3 text-right text-slate-400">{fmt(sub.amount)}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Periodo Anterior */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="bg-slate-900/50 p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Movimientos del Periodo Anterior</h2>
              <p className="text-xs text-slate-500 mt-0.5">Antes del {fmtDate(prevCutoff.toISOString())}</p>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 bg-slate-800/50">
                <tr>
                  <th className={thCls}>Fecha</th>
                  <th className={thCls}>Descripción</th>
                  <th className={`${thCls} text-right`}>Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {prevPeriod.length === 0 ? (
                  <tr><td colSpan={3} className="p-6 text-center text-slate-500">Sin movimientos anteriores.</td></tr>
                ) : (
                  prevPeriod.map(t => (
                    <tr key={t.id} className="hover:bg-slate-700/30">
                      <td className="p-3 text-slate-300">{fmtDate(t.date)}</td>
                      <td className="p-3 text-white capitalize">{t.description}</td>
                      <td className="p-3 text-right font-medium text-slate-400">{fmt(t.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Modal agregar gasto ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Registrar Gasto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Toggle tipo */}
            <div className="flex bg-slate-900 rounded-xl p-1 mb-5">
              {(['ORDINARY', 'MSI'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${txType === t ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {t === 'ORDINARY' ? 'Ordinario' : 'MSI'}
                </button>
              ))}
            </div>

            <form onSubmit={e => void handleAddExpense(e)} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">
                  {txType === 'MSI' ? 'Fecha de compra original' : 'Fecha del Gasto'}
                </label>
                <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Descripción</label>
                <input type="text" placeholder="Ej. Despensa, Gasolina..." required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">
                  {txType === 'MSI' ? 'Monto original de compra (MXN)' : 'Monto (MXN)'}
                </label>
                <input type="number" step="0.01" min="0.01" placeholder="0.00" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} />
                {txType === 'ORDINARY' && exceedsLimit && form.amount && (
                  <p className="text-red-400 text-xs mt-1 font-medium">
                    ⚠ Supera el saldo disponible ({fmt(available)})
                  </p>
                )}
              </div>

              {txType === 'MSI' && (
                <>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-1">Meses totales del plan</label>
                    <input type="number" min="2" max="48" required value={form.months} onChange={e => setForm({ ...form, months: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-1">Meses ya pagados</label>
                    <input type="number" min="0" value={form.paidMonths} onChange={e => setForm({ ...form, paidMonths: e.target.value })} className={inputCls} />
                    <p className="text-slate-500 text-xs mt-1">Déjalo en 0 si es una compra nueva.</p>
                  </div>

                  {/* Preview calculado */}
                  {originalAmount > 0 && remainingMonths > 0 && (
                    <div className={`rounded-xl p-3 text-sm space-y-1 ${exceedsLimit ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-900/60'}`}>
                      <div className="flex justify-between text-slate-400">
                        <span>Mensualidad</span>
                        <span className="text-amber-400 font-bold">{fmt(monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Meses restantes</span>
                        <span className="text-white font-bold">{remainingMonths}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 border-t border-slate-700 pt-1">
                        <span>Deuda a registrar</span>
                        <span className={`font-bold ${exceedsLimit ? 'text-red-400' : 'text-emerald-400'}`}>{fmt(computedDebt)}</span>
                      </div>
                      {exceedsLimit && (
                        <p className="text-red-400 text-xs font-medium pt-1">
                          ⚠ Supera el saldo disponible ({fmt(available)})
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-4 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors font-medium">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || exceedsLimit}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors font-bold"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Banknote className="text-emerald-400" size={20} />
                Registrar Pago
              </h2>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <p className="text-slate-400 text-sm mb-4">
              Deuda actual: <span className="text-red-400 font-bold">{fmt(currentBalance)}</span>
            </p>

            <button
              type="button"
              onClick={() => setPayAmount(String(currentBalance))}
              className="w-full mb-4 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all text-sm"
            >
              Pago total — {fmt(currentBalance)}
            </button>

            <form onSubmit={e => void handlePay(e)} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Otro monto (MXN)</label>
                <input type="number" step="0.01" min="0.01" placeholder="0.00" value={payAmount} onChange={e => setPayAmount(e.target.value)} className={inputCls} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={paying || !payAmount} className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-all">
                  {paying ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
