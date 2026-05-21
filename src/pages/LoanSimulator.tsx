import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, TrendingUp, HelpCircle } from 'lucide-react';

const DEFAULT_CREDIT_LIMIT = 1000;
const DEFAULT_RATE = 50;
const TERM_OPTIONS = [1, 2, 3, 6, 9, 12, 18, 24];

type Frequency = 'Semanal' | 'Quincenal' | 'Mensual';

const FREQ_CONFIG: Record<Frequency, { periodsPerMonth: number; dayStep: number; label: string }> = {
  Mensual:   { periodsPerMonth: 1, dayStep: 0,  label: 'mensual'   },
  Quincenal: { periodsPerMonth: 2, dayStep: 15, label: 'quincenal' },
  Semanal:   { periodsPerMonth: 4, dayStep: 7,  label: 'semanal'   },
};

function getAvailableFrequencies(level: string): Frequency[] {
  if (level === 'NOVATO_1') return ['Semanal'];
  if (level === 'NOVATO_2' || level === 'NOVATO_3') return ['Semanal', 'Quincenal'];
  return ['Semanal', 'Quincenal', 'Mensual'];
}

const TOOLTIP_LEVEL_TEXT = 'Tu límite y tasa están determinados por tu nivel actual. Sube de nivel realizando tus pagos puntualmente.';

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group ml-1 align-middle">
      <HelpCircle size={13} className="text-slate-500 group-hover:text-slate-300 cursor-help transition-colors" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 leading-snug shadow-xl z-50 pointer-events-none text-center">
        {text}
      </span>
    </span>
  );
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

function getUserLevel(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'NOVATO_1';
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed.level === 'string' ? parsed.level : 'NOVATO_1';
  } catch { return 'NOVATO_1'; }
}

function calcMonthly(amount: number, flatRate: number, months: number): number {
  if (amount <= 0 || months <= 0) return 0;
  const timeFactor = months >= 12 ? months / 12 : 1;
  return (amount + amount * (flatRate / 100) * timeFactor) / months;
}

const inputCls =
  'w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600';

export default function LoanSimulator() {
  const navigate = useNavigate();
  const { creditLimit, currentRate } = useMemo(() => getUserDefaults(), []);
  const userLevel = useMemo(() => getUserLevel(), []);
  const availableFreqs = useMemo(() => getAvailableFrequencies(userLevel), [userLevel]);

  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('12');
  const [freq, setFreq] = useState<Frequency>(() => {
    const freqs = getAvailableFrequencies(getUserLevel());
    return freqs[freqs.length - 1];
  });

  const amountN = parseFloat(amount) || 0;
  const monthsN = parseInt(months, 10) || 0;
  const monthly = calcMonthly(amountN, currentRate, monthsN);
  const total = monthly * monthsN;
  const timeFactor = monthsN >= 12 ? monthsN / 12 : 1;
  const interest = amountN > 0 && monthsN > 0 ? amountN * (currentRate / 100) * timeFactor : 0;
  const effectiveRate = currentRate * timeFactor;

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  const { periodsPerMonth, dayStep } = FREQ_CONFIG[freq];
  const periodPayment = monthly / periodsPerMonth;
  const totalPeriods = monthsN * periodsPerMonth;

  const rows = useMemo(() => {
    if (amountN <= 0 || monthsN <= 0 || monthly <= 0) return [];
    const today = new Date();
    return Array.from({ length: totalPeriods }, (_, i) => {
      let dueDate: Date;
      if (freq === 'Mensual') {
        dueDate = new Date(today.getFullYear(), today.getMonth() + i + 1, today.getDate());
      } else {
        dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + (i + 1) * dayStep);
      }
      const remainingBalance = Math.max(0, total - periodPayment * (i + 1));
      return { number: i + 1, dueDate, amountDue: periodPayment, remainingBalance };
    });
  }, [amountN, monthsN, monthly, total, freq, totalPeriods, periodPayment, dayStep]);

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
          <Calculator size={26} className="text-emerald-400" />
          Simulador de Préstamo
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Calcula tu pago mensual antes de solicitar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 items-start">

        {/* ── Izquierda: Controles ── */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
              <p className="text-xs text-slate-500 mb-1">
                Límite Autorizado<InfoTooltip text={TOOLTIP_LEVEL_TEXT} />
              </p>
              <p className="text-lg font-extrabold text-white">{fmt(creditLimit)}</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
              <p className="text-xs text-slate-500 mb-1">
                Tasa (anual)<InfoTooltip text={TOOLTIP_LEVEL_TEXT} />
              </p>
              <p className="text-lg font-extrabold text-emerald-400">{currentRate}%</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 font-medium mb-1.5">Monto (MXN)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={inputCls}
              placeholder="0.00"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 font-medium mb-1.5">Plazo</label>
            <select
              value={months}
              onChange={e => setMonths(e.target.value)}
              className={`${inputCls} cursor-pointer`}
            >
              {TERM_OPTIONS.map(m => (
                <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 font-medium mb-1.5">Frecuencia de Pago</label>
            <select
              value={freq}
              onChange={e => setFreq(e.target.value as Frequency)}
              className={`${inputCls} cursor-pointer`}
            >
              {availableFreqs.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {total > 0 && amountN > 0 && (
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Capital</span>
                <span className="text-white font-semibold">{fmt(amountN)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  Interés ({effectiveRate.toFixed(0)}%{monthsN < 12 ? ' mín.' : ''})
                </span>
                <span className="text-amber-400 font-semibold">{fmt(interest)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2.5">
                <span className="text-slate-300 font-semibold">Total</span>
                <span className="text-white font-bold">{fmt(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cuota {FREQ_CONFIG[freq].label}</span>
                <span className="text-emerald-400 font-bold text-base">{fmt(periodPayment)}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/loans/request')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <TrendingUp size={18} />
            Solicitar este Préstamo
          </button>
        </div>

        {/* ── Derecha: Tabla de amortización ── */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Tabla de Amortización
            </h3>
            {rows.length > 0 && (
              <span className="text-xs text-slate-500 bg-slate-900 px-2.5 py-0.5 rounded-full">
                {rows.length} cuotas {FREQ_CONFIG[freq].label}s
              </span>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <Calculator size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Ingresa un monto para ver el desglose</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[540px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800 z-10 shadow-sm">
                  <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="text-center px-4 py-3 w-10">#</th>
                    <th className="text-left px-4 py-3">Vencimiento</th>
                    <th className="text-right px-4 py-3">Cuota</th>
                    <th className="text-right px-4 py-3">Saldo Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr
                      key={row.number}
                      className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-xs text-slate-500 tabular-nums">{row.number}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 text-xs tabular-nums">
                        {fmtDate(row.dueDate)}
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
          )}
        </div>

      </div>
    </div>
  );
}
