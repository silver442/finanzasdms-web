import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface PortfolioItem {
  id: string;
  name: string;
  category: string;
  type: 'CASH' | 'FIXED_INCOME' | 'VARIABLE_INCOME';
  deposited: number;
  realValue: number;
  color: string;
}

interface AccountTransaction {
  id: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAW' | 'EXPENSE' | 'LOAN_PAYMENT';
  description: string;
  date: string;
}

interface AccountSnapshot {
  id: string;
  accountId: string;
  date: string;
  deposited: number;
  realValue: number;
}

const ENUM_TO_LABEL: Record<string, string> = {
  CASH: 'Cuenta corriente',
  FIXED_INCOME: 'Renta fija',
  VARIABLE_INCOME: 'Renta Variable',
};

const TX_TYPE_LABEL: Record<string, string> = {
  DEPOSIT: 'Depósito',
  WITHDRAW: 'Retiro',
  EXPENSE: 'Gasto',
  LOAN_PAYMENT: 'Pago préstamo',
};

const MOV_TYPE_MAP: Record<string, 'DEPOSIT' | 'WITHDRAW' | 'EXPENSE'> = {
  'Depósito': 'DEPOSIT',
  'Retiro': 'WITHDRAW',
  'Gasto': 'EXPENSE',
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
const fmtPct = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 2 }).format(v);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' });

function RendimientoRow({ open, close, label }: { open: number; close: number; label: string }) {
  const gain = close - open;
  const rend = open > 0 ? gain / open : 0;
  const isPos = gain >= 0;
  return (
    <tr className="hover:bg-slate-700/30">
      <td className="p-3 text-slate-300 font-medium">{label}</td>
      <td className="p-3 text-right text-slate-400">{fmt(open)}</td>
      <td className="p-3 text-right text-white font-medium">{fmt(close)}</td>
      <td className={`p-3 text-right font-medium ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPos ? '+' : ''}{fmt(gain)}
      </td>
      <td className={`p-3 text-right font-bold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPos ? '+' : ''}{fmtPct(rend)}
      </td>
    </tr>
  );
}

export default function PortfolioDetail() {
  const { id } = useParams<{ id: string }>();

  const [account, setAccount] = useState<PortfolioItem | null>(null);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [snapshots, setSnapshots] = useState<AccountSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'Depósito', amount: '' });

  const fetchAll = useCallback(async () => {
    if (!id) return;
    try {
      const [accRes, txRes, snapRes] = await Promise.all([
        axios.get(`${API}/financial-accounts/${id}`, authHeaders()),
        axios.get(`${API}/financial-accounts/${id}/transactions`, authHeaders()),
        axios.get(`${API}/financial-accounts/${id}/snapshots`, authHeaders()),
      ]);
      setAccount(accRes.data);
      setTransactions(txRes.data);
      setSnapshots(snapRes.data);
    } catch {
      toast.error('Error al cargar los datos de la cuenta');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    const amount = Math.abs(parseFloat(form.amount) || 0);
    if (amount === 0) { toast.error('El importe debe ser mayor a cero'); return; }

    setSaving(true);
    try {
      await axios.post(
        `${API}/financial-accounts/${account.id}/transactions`,
        { amount, type: MOV_TYPE_MAP[form.type], date: form.date },
        authHeaders(),
      );
      toast.success('Movimiento registrado');
      setForm((p) => ({ ...p, amount: '' }));
      await fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al registrar el movimiento');
    } finally {
      setSaving(false);
    }
  };

  // ── Cómputo de rendimiento anual ──
  const buildAnnualRows = () => {
    if (!account) return [];
    const now = new Date();
    const currentYear = now.getFullYear();

    // Mapa: año → snapshot de enero de ese año (día 1)
    const janSnap: Record<number, AccountSnapshot> = {};
    snapshots.forEach((s) => {
      const d = new Date(s.date);
      if (d.getMonth() === 0) janSnap[d.getFullYear()] = s;
    });

    const years = Object.keys(janSnap).map(Number).sort();
    if (years.length === 0) return [];

    const rows: { label: string; open: number; close: number }[] = [];
    for (const year of years) {
      const openVal = Number(janSnap[year].realValue);
      let closeVal: number | null = null;

      if (year === currentYear) {
        closeVal = Number(account.realValue);
      } else if (janSnap[year + 1]) {
        closeVal = Number(janSnap[year + 1].realValue);
      }

      if (closeVal !== null) {
        rows.push({ label: String(year), open: openVal, close: closeVal });
      }
    }
    return rows;
  };

  // ── Cómputo de rendimiento mensual del año en curso ──
  const buildMonthlyRows = () => {
    if (!account) return [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Mapa: mes (0-11) → snapshot del año en curso
    const monthSnap: Record<number, AccountSnapshot> = {};
    snapshots.forEach((s) => {
      const d = new Date(s.date);
      if (d.getFullYear() === currentYear) monthSnap[d.getMonth()] = s;
    });

    const rows: { label: string; open: number; close: number }[] = [];
    for (let m = 0; m <= currentMonth; m++) {
      if (!monthSnap[m]) continue;
      const openVal = Number(monthSnap[m].realValue);
      const closeVal = m === currentMonth
        ? Number(account.realValue)
        : monthSnap[m + 1] ? Number(monthSnap[m + 1].realValue) : null;

      if (closeVal !== null) {
        rows.push({ label: MONTHS[m], open: openVal, close: closeVal });
      }
    }
    return rows;
  };

  if (loading) {
    return (
      <div className="p-8 text-white font-sans max-w-7xl mx-auto">
        <div className="text-center text-slate-400 py-20">Cargando cuenta...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-8 text-white font-sans max-w-7xl mx-auto">
        <div className="text-center text-slate-400 py-20">Cuenta no encontrada.</div>
        <div className="text-center mt-4">
          <Link to="/portfolio" className="text-emerald-400 hover:underline">← Volver al Portafolio</Link>
        </div>
      </div>
    );
  }

  const deposited = Number(account.deposited);
  const realValue = Number(account.realValue);
  const isCash = account.type === 'CASH';
  const gain = isCash ? 0 : realValue - deposited;
  const color = account.color ?? '#10B981';
  const label = ENUM_TO_LABEL[account.type] ?? account.type;

  const annualRows = buildAnnualRows();
  const monthlyRows = buildMonthlyRows();

  const rendTableHead = (
    <thead className="text-slate-400 bg-slate-900/50 text-xs uppercase">
      <tr>
        <th className="p-3 font-semibold">Período</th>
        <th className="p-3 font-semibold text-right">Valor Inicio</th>
        <th className="p-3 font-semibold text-right">Valor Fin</th>
        <th className="p-3 font-semibold text-right">Ganancia</th>
        <th className="p-3 font-semibold text-right">Rendimiento</th>
      </tr>
    </thead>
  );

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <Link to="/portfolio"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-medium">
          <ArrowLeft size={16} />
          Portafolio
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-white">{account.name}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold border"
                style={{ backgroundColor: color + '33', color, borderColor: color + '66' }}>
                {label}
              </span>
            </div>
            <p className="text-slate-400 text-sm">{account.category}</p>
          </div>

          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Depositado</p>
              <p className="text-xl font-bold text-slate-200">{fmt(deposited)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Valor Real</p>
              <p className="text-xl font-bold text-white">{fmt(realValue)}</p>
            </div>
            {!isCash && (
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Ganancia</p>
                <p className={`text-xl font-extrabold ${gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {gain >= 0 ? '+' : ''}{fmt(gain)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DOS COLUMNAS — Movimiento + Historial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* COLUMNA IZQ — Formulario inline */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 h-fit">
          <h2 className="text-lg font-bold text-white mb-5">Registrar Movimiento</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
              {['Depósito', 'Retiro', 'Gasto'].map((type) => (
                <button key={type} type="button"
                  onClick={() => setForm((p) => ({ ...p, type }))}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    form.type === type
                      ? type === 'Depósito' ? 'bg-emerald-500 text-white shadow' : 'bg-red-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}>
                  {type}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">Fecha</label>
              <input type="date" required value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer" />
            </div>

            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">Importe (MXN)</label>
              <input type="number" step="0.01" placeholder="Ej. 1500" required
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500" />
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-bold transition-colors mt-2">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </div>

        {/* COLUMNA DER — Historial de movimientos */}
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-700">
            <h2 className="text-lg font-bold text-white">Historial de Movimientos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 bg-slate-900/50">
                <tr>
                  <th className="p-4 font-semibold">Fecha</th>
                  <th className="p-4 font-semibold">Tipo</th>
                  <th className="p-4 font-semibold">Descripción</th>
                  <th className="p-4 font-semibold text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">Sin movimientos registrados</td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isIncome = tx.type === 'DEPOSIT';
                    const amount = isIncome ? Number(tx.amount) : -Number(tx.amount);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-700/30">
                        <td className="p-4 text-slate-300">{fmtDate(tx.date)}</td>
                        <td className={`p-4 font-medium ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                          {TX_TYPE_LABEL[tx.type] ?? tx.type}
                        </td>
                        <td className="p-4 text-slate-400 text-xs">{tx.description}</td>
                        <td className={`p-4 text-right font-bold ${amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {amount >= 0 ? '+' : ''}{fmt(amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TABLAS DE RENDIMIENTO */}
      {snapshots.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center">
          <p className="text-slate-400 text-sm">Los cortes mensuales se registran automáticamente el día 1 de cada mes.</p>
          <p className="text-slate-500 text-xs mt-1">Las tablas de rendimiento aparecerán aquí una vez se genere el primer snapshot.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rendimiento Anual */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Rendimiento Anual</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                {rendTableHead}
                <tbody className="divide-y divide-slate-700/50">
                  {annualRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                        Sin datos anuales aún
                      </td>
                    </tr>
                  ) : (
                    annualRows.map((row) => (
                      <RendimientoRow key={row.label} label={row.label} open={row.open} close={row.close} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rendimiento Mensual — Año en curso */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">
                Rendimiento Mensual <span className="text-slate-400 font-normal text-sm">({new Date().getFullYear()})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                {rendTableHead}
                <tbody className="divide-y divide-slate-700/50">
                  {monthlyRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                        Sin datos mensuales para el año en curso
                      </td>
                    </tr>
                  ) : (
                    monthlyRows.map((row) => (
                      <RendimientoRow key={row.label} label={row.label} open={row.open} close={row.close} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
