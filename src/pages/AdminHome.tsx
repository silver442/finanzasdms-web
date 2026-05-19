import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ShieldCheck, Wallet, TrendingUp, CheckCircle2, Users,
  Activity, Star, TrendingDown,
} from 'lucide-react';

interface LevelCount { level: string; count: number; }
interface CashFlowEntry { month: string; amount: number; }

interface AdminMetrics {
  capitalEnCalle: number;
  gananciaProyectada: number;
  recoveryPct: number;
  activeLoansCount: number;
  usersByLevel: LevelCount[];
  cashFlow: CashFlowEntry[];
}

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function fmt(v: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
}

function formatMonth(key: string) {
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
}

const LEVEL_GROUPS = [
  { label: 'Novatos',     keys: ['NOVATO_1', 'NOVATO_2', 'NOVATO_3'],         color: 'bg-sky-500',     text: 'text-sky-400',     bar: 'bg-sky-500'     },
  { label: 'Cumplidores', keys: ['CUMPLIDOR_1', 'CUMPLIDOR_2', 'CUMPLIDOR_3'], color: 'bg-emerald-500', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  { label: 'Socios',      keys: ['SOCIO_1', 'SOCIO_2'],                        color: 'bg-amber-400',   text: 'text-amber-400',   bar: 'bg-amber-400'   },
  { label: 'Élite',       keys: ['ELITE'],                                      color: 'bg-purple-500',  text: 'text-purple-400',  bar: 'bg-purple-500'  },
];

export default function AdminHome() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const { data } = await axios.get<AdminMetrics>(`${API}/dashboard/admin-metrics`, {
        headers: authHeaders(),
      });
      setMetrics(data);
    } catch {
      toast.error('No se pudieron cargar las métricas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchMetrics(); }, [fetchMetrics]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-400">
        Cargando métricas...
      </div>
    );
  }

  if (!metrics) return null;

  const totalUsers = metrics.usersByLevel.reduce((s, u) => s + u.count, 0);

  const groupCounts = LEVEL_GROUPS.map((g) => ({
    ...g,
    count: g.keys.reduce((s, k) => {
      const found = metrics.usersByLevel.find((u) => u.level === k);
      return s + (found?.count ?? 0);
    }, 0),
  }));

  const maxGroupCount = Math.max(...groupCounts.map((g) => g.count), 1);

  const chartData = metrics.cashFlow.map((entry) => ({
    ...entry,
    label: formatMonth(entry.month),
  }));

  return (
    <div className="p-8 text-white font-sans max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-amber-400 flex items-center gap-3">
          <ShieldCheck size={32} />
          Panel de Control
        </h1>
        <p className="text-slate-400 mt-2">Salud financiera del negocio en tiempo real</p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={16} className="text-emerald-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Capital Prestado</p>
          </div>
          <p className="text-2xl font-extrabold text-white">{fmt(metrics.capitalEnCalle)}</p>
          <p className="text-xs text-slate-500 mt-1">saldo pendiente en préstamos activos</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-emerald-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Ganancia Proyectada</p>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{fmt(metrics.gananciaProyectada)}</p>
          <p className="text-xs text-slate-500 mt-1">intereses pendientes por cobrar</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-sky-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Recuperación</p>
          </div>
          <p className={`text-2xl font-extrabold ${metrics.recoveryPct >= 80 ? 'text-emerald-400' : metrics.recoveryPct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
            {metrics.recoveryPct}%
          </p>
          <p className="text-xs text-slate-500 mt-1">cuotas pagadas vs. totales</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-amber-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Préstamos Activos</p>
          </div>
          <p className="text-2xl font-extrabold text-white">{metrics.activeLoansCount}</p>
          <p className="text-xs text-slate-500 mt-1">de 20 cupos disponibles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ── Flujo de caja ── */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Flujo de Caja Esperado — Próximos 3 Meses
            </h3>
          </div>

          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-500">
              <TrendingDown size={32} className="mr-2 opacity-40" />
              Sin cuotas próximas registradas
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }}
                  formatter={(v: number) => [fmt(v), 'Cobros esperados']}
                  labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                  cursor={{ fill: 'rgba(100,116,139,0.1)' }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Usuarios por nivel ── */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Usuarios por Nivel
            </h3>
          </div>

          {totalUsers === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              Sin usuarios registrados
            </div>
          ) : (
            <div className="space-y-4">
              {groupCounts.map((g) => (
                <div key={g.label}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <Star size={12} className={g.text} />
                      <span className="text-sm text-slate-300 font-medium">{g.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${g.text}`}>{g.count}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${g.bar} h-2 rounded-full transition-all duration-700`}
                      style={{ width: `${(g.count / maxGroupCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-700 flex justify-between text-xs text-slate-500">
                <span>Total usuarios</span>
                <span className="text-white font-bold">{totalUsers}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detalle por nivel ── */}
      {metrics.usersByLevel.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Desglose Completo por Nivel</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-px bg-slate-700">
            {metrics.usersByLevel.map((entry) => {
              const group = LEVEL_GROUPS.find((g) => g.keys.includes(entry.level));
              return (
                <div key={entry.level} className="bg-slate-800 p-4 text-center">
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${group?.text ?? 'text-slate-400'}`}>
                    {entry.level.replace('_', ' ')}
                  </p>
                  <p className="text-2xl font-extrabold text-white">{entry.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
