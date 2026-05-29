import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Landmark, CreditCard, RefreshCw, Bitcoin,
  BarChart2, Percent, LayoutDashboard,
  CheckCircle, AlertCircle, TrendingUp, TrendingDown,
  CalendarClock,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type UserFlags = {
  hasCreditCardsModule: boolean;
  hasLoansModule: boolean;
  hasSubscriptionsModule: boolean;
  hasMakeMoneyModule: boolean;
  hasCryptoModule: boolean;
  hasStockMarketModule: boolean;
  hasCompoundInterestModule: boolean;
};

interface CategorySlice { category: string; value: number; percentage: number; }

interface ModuleSummary {
  loans: {
    activeCount: number;
    paidCount: number;
    totalOutstanding: number;
    nextInstallment: { dueDate: string; amountDue: number } | null;
  };
  portfolio: {
    accountCount: number;
    totalDeposited: number;
    totalRealValue: number;
    totalGain: number;
    byCategory: CategorySlice[];
    byCategoryNonCash: CategorySlice[];
  };
  creditCards: {
    cardCount: number;
    totalDebt: number;
    totalLimit: number;
    utilizationPct: number;
    nextCutoff: { cardName: string; date: string; balance: number } | null;
  };
  subscriptions: {
    count: number;
    monthlyEquivalent: number;
    items: { name: string; amount: number; frequency: string }[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFlags(): UserFlags {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return { hasCreditCardsModule: true, hasLoansModule: true, hasSubscriptionsModule: true, hasMakeMoneyModule: true, hasCryptoModule: false, hasStockMarketModule: false, hasCompoundInterestModule: false };
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      hasCreditCardsModule:      p.hasCreditCardsModule     !== false,
      hasLoansModule:            p.hasLoansModule           !== false,
      hasSubscriptionsModule:    p.hasSubscriptionsModule   !== false,
      hasMakeMoneyModule:        p.hasMakeMoneyModule       !== false,
      hasCryptoModule:           p.hasCryptoModule          === true,
      hasStockMarketModule:      p.hasStockMarketModule     === true,
      hasCompoundInterestModule: p.hasCompoundInterestModule === true,
    };
  } catch {
    return { hasCreditCardsModule: true, hasLoansModule: true, hasSubscriptionsModule: true, hasMakeMoneyModule: true, hasCryptoModule: false, hasStockMarketModule: false, hasCompoundInterestModule: false };
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const FREQ_LABEL: Record<string, string> = {
  MONTHLY: 'Mensual', BIMONTHLY: 'Bimestral', YEARLY: 'Anual',
};

// Paleta de colores para las gráficas de portafolio
const PALETTE = ['#4ADE80','#FACC15','#F87171','#60A5FA','#C084FC','#FB923C','#34D399','#A78BFA','#F472B6','#22D3EE'];

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipProps { active?: boolean; payload?: Array<{ name: string; value: number }>; }

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-white font-bold text-sm">{payload[0].name}</p>
        <p className="text-emerald-400 font-medium">{`${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

// ─── Componente compartido: stat card pequeña ─────────────────────────────────

function StatCard({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-900 rounded-xl p-3">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className={`font-bold text-base ${color}`}>{value}</p>
    </div>
  );
}

// ─── Widget: Portafolio ───────────────────────────────────────────────────────

function PortfolioDashboardWidget({ data }: { data: ModuleSummary['portfolio'] | null }) {
  if (!data) return null;

  const empty = data.accountCount === 0;

  const toChartData = (slices: CategorySlice[]) =>
    slices.map((s, i) => ({ name: s.category, value: s.percentage, color: PALETTE[i % PALETTE.length] }));

  const totalData   = toChartData(data.byCategory);
  const nonCashData = toChartData(data.byCategoryNonCash);
  const gainPositive = data.totalGain >= 0;

  return (
    <div className="col-span-full bg-slate-800 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <BarChart2 size={22} className="text-amber-400" />
        </div>
        <div>
          <p className="font-bold text-white">Portafolio de Inversiones</p>
          <p className="text-slate-400 text-xs">{data.accountCount} cuenta{data.accountCount !== 1 ? 's' : ''} registrada{data.accountCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {gainPositive ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
          <span className={`text-sm font-bold ${gainPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {gainPositive ? '+' : ''}{fmt(data.totalGain)}
          </span>
        </div>
      </div>

      {empty ? (
        <p className="text-slate-500 text-sm text-center py-6">Aún no tienes cuentas registradas en tu portafolio.</p>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <StatCard label="Total depositado" value={fmt(data.totalDeposited)} />
            <StatCard label="Valor real actual" value={fmt(data.totalRealValue)} color={gainPositive ? 'text-emerald-400' : 'text-red-400'} />
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col items-center">
              <p className="text-slate-400 text-sm font-semibold mb-3">Valor Total</p>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={totalData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={2} dataKey="value" animationDuration={1200}>
                      {totalData.map((e, i) => <Cell key={`t-${i}`} fill={e.color} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {nonCashData.length > 0 && (
              <div className="flex flex-col items-center">
                <p className="text-slate-400 text-sm font-semibold mb-3">Sin Efectivo</p>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={nonCashData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={2} dataKey="value" animationDuration={1200}>
                        {nonCashData.map((e, i) => <Cell key={`nc-${i}`} fill={e.color} stroke="transparent" />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Widget: Préstamos ────────────────────────────────────────────────────────

function LoansDashboardWidget({ data }: { data: ModuleSummary['loans'] | null }) {
  return (
    <Link to="/loans" className="block hover:opacity-90 transition-opacity">
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <Landmark size={22} className="text-emerald-400" />
        </div>
        <div>
          <p className="font-bold text-white">Préstamos</p>
          <p className="text-slate-400 text-xs">Créditos</p>
        </div>
      </div>

      {!data ? (
        <p className="text-slate-500 text-sm">Cargando...</p>
      ) : data.activeCount === 0 ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle size={16} /> Sin préstamos activos
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard label="Activos" value={String(data.activeCount)} />
          <StatCard label="Pagados" value={String(data.paidCount)} color="text-slate-300" />
          <div className="bg-slate-900 rounded-xl p-3 col-span-2">
            <p className="text-slate-500 text-xs mb-1">Deuda total pendiente</p>
            <p className="text-red-400 font-bold text-lg">{fmt(data.totalOutstanding)}</p>
          </div>
          {data.nextInstallment && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 col-span-2 flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-amber-400 text-xs font-semibold mb-0.5">Próximo pago</p>
                <p className="text-white text-sm font-bold">{fmt(data.nextInstallment.amountDue)}</p>
                <p className="text-slate-400 text-xs">{fmtDate(data.nextInstallment.dueDate)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </Link>
  );
}

// ─── Widget: Tarjetas de crédito ──────────────────────────────────────────────

function CreditCardsDashboardWidget({ data }: { data: ModuleSummary['creditCards'] | null }) {
  const utilColor = !data ? 'bg-slate-600'
    : data.utilizationPct < 30 ? 'bg-emerald-500'
    : data.utilizationPct < 70 ? 'bg-amber-500'
    : 'bg-red-500';

  const utilTextColor = !data ? 'text-slate-400'
    : data.utilizationPct < 30 ? 'text-emerald-400'
    : data.utilizationPct < 70 ? 'text-amber-400'
    : 'text-red-400';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <CreditCard size={22} className="text-blue-400" />
        </div>
        <div>
          <p className="font-bold text-white">Tarjetas de Crédito</p>
          <p className="text-slate-400 text-xs">{data ? `${data.cardCount} tarjeta${data.cardCount !== 1 ? 's' : ''}` : '—'}</p>
        </div>
      </div>

      {!data ? (
        <p className="text-slate-500 text-sm">Cargando...</p>
      ) : data.cardCount === 0 ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle size={16} /> Sin tarjetas registradas
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard label="Deuda total" value={fmt(data.totalDebt)} color="text-red-400" />
            <StatCard label="Límite total" value={fmt(data.totalLimit)} />
          </div>

          {/* Barra de utilización */}
          <div className="bg-slate-900 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-slate-500 text-xs">Utilización</p>
              <p className={`text-sm font-bold ${utilTextColor}`}>{data.utilizationPct}%</p>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${utilColor}`}
                style={{ width: `${Math.min(data.utilizationPct, 100)}%` }}
              />
            </div>
          </div>

          {/* Próximo corte */}
          {data.nextCutoff && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
              <CalendarClock size={16} className="text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-blue-400 text-xs font-semibold mb-0.5">Próximo corte — {data.nextCutoff.cardName}</p>
                <p className="text-white text-sm font-bold">{fmtDate(data.nextCutoff.date)}</p>
                <p className="text-slate-400 text-xs">Saldo al corte: {fmt(data.nextCutoff.balance)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Widget: Suscripciones ────────────────────────────────────────────────────

function SubscriptionsDashboardWidget({ data }: { data: ModuleSummary['subscriptions'] | null }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
          <RefreshCw size={22} className="text-violet-400" />
        </div>
        <div>
          <p className="font-bold text-white">Suscripciones</p>
          <p className="text-slate-400 text-xs">{data ? `${data.count} activa${data.count !== 1 ? 's' : ''}` : '—'}</p>
        </div>
      </div>

      {!data ? (
        <p className="text-slate-500 text-sm">Cargando...</p>
      ) : data.count === 0 ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle size={16} /> Sin suscripciones registradas
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="bg-slate-900 rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Costo mensual equivalente</p>
            <p className="text-violet-400 font-bold text-xl">{fmt(data.monthlyEquivalent)}<span className="text-slate-500 text-xs font-normal"> / mes</span></p>
          </div>

          {data.items.length > 0 && (
            <div className="flex flex-col gap-2">
              {data.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                    <p className="text-slate-300 text-sm">{item.name}</p>
                    <span className="text-slate-600 text-xs">{FREQ_LABEL[item.frequency] ?? item.frequency}</span>
                  </div>
                  <p className="text-slate-300 text-sm font-semibold">{fmt(item.amount)}</p>
                </div>
              ))}
              {data.count > data.items.length && (
                <p className="text-slate-500 text-xs text-center">+{data.count - data.items.length} más</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Widget: Cripto (placeholder enriquecido) ─────────────────────────────────

function CryptoDashboardWidget() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
          <Bitcoin size={22} className="text-orange-400" />
        </div>
        <div>
          <p className="font-bold text-white">Inversiones Cripto</p>
          <p className="text-slate-400 text-xs">Seguimiento de portafolio</p>
        </div>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">
        Tu portafolio de criptomonedas se gestiona directamente en la sección Cripto, donde puedes registrar operaciones y ver precios en tiempo real.
      </p>
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 flex items-center gap-2">
        <TrendingUp size={14} className="text-orange-400 shrink-0" />
        <p className="text-orange-300 text-xs">Los precios de mercado se obtienen en tiempo real al abrir la sección.</p>
      </div>
    </div>
  );
}

// ─── Widget: placeholder genérico para módulos sin backend ───────────────────

function PlaceholderWidget({ icon: Icon, title, desc, color }: {
  icon: React.ElementType; title: string; desc: string; color: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`${color} rounded-xl p-3`}>
          <Icon size={22} className="text-white" />
        </div>
        <p className="font-bold text-white">{title}</p>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
  const [moduleSummary, setModuleSummary] = useState<ModuleSummary | null>(null);
  const [, setIsLoading] = useState(true);
  const [userFlags, setUserFlags] = useState<UserFlags>(getFlags);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const base = import.meta.env.VITE_API_URL;

    const fetchAll = async () => {
      try {
        const [summaryRes, moduleRes] = await Promise.all([
          axios.get(`${base}/dashboard/summary`, { headers }),
          axios.get(`${base}/dashboard/module-summary`, { headers }),
        ]);
        setSummary(summaryRes.data);
        setModuleSummary(moduleRes.data);
      } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [navigate]);

  useEffect(() => {
    const handler = () => setUserFlags(getFlags());
    window.addEventListener('user-flags-updated', handler);
    return () => window.removeEventListener('user-flags-updated', handler);
  }, []);

  // Component Map: definido dentro del componente para acceder a moduleSummary
  const MODULE_WIDGET_MAP: Partial<Record<keyof UserFlags, React.ReactNode>> = {
    hasMakeMoneyModule:        <PortfolioDashboardWidget data={moduleSummary?.portfolio ?? null} />,
    hasLoansModule:            <LoansDashboardWidget data={moduleSummary?.loans ?? null} />,
    hasCreditCardsModule:      <CreditCardsDashboardWidget data={moduleSummary?.creditCards ?? null} />,
    hasSubscriptionsModule:    <SubscriptionsDashboardWidget data={moduleSummary?.subscriptions ?? null} />,
    hasCryptoModule:           <CryptoDashboardWidget />,
    hasStockMarketModule:      <PlaceholderWidget icon={BarChart2} title="Bolsa de Valores" desc="Seguimiento de acciones, ETFs y mercados bursátiles." color="bg-cyan-500/10 border border-cyan-500/20" />,
    hasCompoundInterestModule: <PlaceholderWidget icon={Percent} title="Interés Compuesto" desc="Proyección de crecimiento patrimonial a largo plazo." color="bg-pink-500/10 border border-pink-500/20" />,
  };

  const activeWidgets = (Object.keys(MODULE_WIDGET_MAP) as (keyof UserFlags)[])
    .filter((key) => userFlags[key] === true);

  return (
    <div className="p-4 md:p-8 text-white font-sans max-w-7xl mx-auto">
      <h1 className="text-3xl font-extrabold text-emerald-400 mb-10">Resumen Financiero</h1>

      {/* CORE: siempre visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-2xl p-6 rounded-2xl">
          <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Activos (Cuentas)</h2>
          <p className="text-3xl font-bold text-white">{fmt(summary.totalAssets)}</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-2xl p-6 rounded-2xl">
          <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Pasivos (Deudas)</h2>
          <p className="text-3xl font-bold text-red-400">{fmt(summary.totalLiabilities)}</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-2xl p-6 rounded-2xl">
          <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Patrimonio Neto</h2>
          <p className={`text-4xl font-extrabold ${summary.netWorth < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {fmt(summary.netWorth)}
          </p>
        </div>
      </div>

      {/* DINÁMICO: widgets por módulo activo */}
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-2">Mi Panel</h2>

      {activeWidgets.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 flex flex-col items-center gap-5 text-center">
          <div className="bg-slate-700/50 border border-slate-600 rounded-2xl p-5">
            <LayoutDashboard size={40} className="text-slate-500" />
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Tu panel está vacío</p>
            <p className="text-slate-400 text-sm">Visita la Tienda de Módulos para añadir herramientas financieras.</p>
          </div>
          <button
            onClick={() => navigate('/tienda')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500 hover:border-violet-500 hover:text-white transition-all"
          >
            Ir a la Tienda de Módulos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {activeWidgets.map((key) => (
            <div key={key} className={key === 'hasMakeMoneyModule' ? 'col-span-full' : ''}>
              {MODULE_WIDGET_MAP[key]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
