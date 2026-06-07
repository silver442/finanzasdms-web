import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Landmark, CreditCard, RefreshCw, Bitcoin,
  BarChart2, Percent, LayoutDashboard,
  AlertCircle, TrendingUp, TrendingDown,
  CalendarClock,
} from 'lucide-react';
import { EmptyState, PortfolioEmptyIllustration, LoansEmptyIllustration } from '../../components/EmptyState';

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

const PALETTE = ['#4ADE80','#FACC15','#F87171','#60A5FA','#C084FC','#FB923C','#34D399','#A78BFA','#F472B6','#22D3EE'];

// ─── useCountUp — animación de conteo al montar ──────────────────────────────

function useCountUp(target: number, duration = 900): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cúbico: arranca rápido, desacelera al final
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setCurrent(target);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return current;
}

// ─── BigMoney — jerarquía tipográfica premium ─────────────────────────────────

function BigMoney({
  value,
  size = 'xl',
  color = 'text-white',
}: {
  value: number;
  size?: 'xl' | 'lg' | 'md';
  color?: string;
}) {
  const animated = useCountUp(value);
  const formatted = fmt(animated);
  const dotIndex  = formatted.lastIndexOf('.');
  const intPart   = dotIndex >= 0 ? formatted.slice(0, dotIndex) : formatted;
  const decPart   = dotIndex >= 0 ? formatted.slice(dotIndex)    : '';

  // xl: 4xl/lg — hero cards. lg: 3xl/base — widgets. md: 2xl/sm — compacto.
  const numClass = size === 'xl' ? 'text-4xl' : size === 'lg' ? 'text-3xl' : 'text-2xl';
  const decClass = size === 'xl' ? 'text-lg'  : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase">MXN</span>
      <div className="flex items-baseline gap-0.5">
        <span className={`font-black tracking-tight tabular-nums leading-none ${numClass} ${color}`}>
          {intPart}
        </span>
        <span className={`font-medium text-text-muted leading-none ${decClass}`}>
          {decPart}
        </span>
      </div>
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipProps { active?: boolean; payload?: Array<{ name: string; value: number }>; }

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-card border border-surface-border p-3 rounded-lg shadow-xl">
        <p className="text-white font-bold text-sm">{payload[0].name}</p>
        <p className="text-brand-green-light font-medium">{`${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

// ─── StatCard — mini tarjeta interna ─────────────────────────────────────────
// rounded-lg: radio pequeño, elemento secundario dentro de una card mayor.

function StatCard({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface-base rounded-lg p-3">
      <p className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-1">{label}</p>
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

  const totalData    = toChartData(data.byCategory);
  const nonCashData  = toChartData(data.byCategoryNonCash);
  const gainPositive = data.totalGain >= 0;

  return (
    <div className="col-span-full bg-surface-card border border-surface-border rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-brand-violet/10 border border-brand-violet/20 rounded-2xl p-3">
          <BarChart2 size={22} className="text-brand-violet-light" />
        </div>
        <div>
          <p className="font-bold text-white">Portafolio de Inversiones</p>
          <p className="text-text-muted text-xs">{data.accountCount} cuenta{data.accountCount !== 1 ? 's' : ''} registrada{data.accountCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {gainPositive ? <TrendingUp size={16} className="text-brand-green-light" /> : <TrendingDown size={16} className="text-red-400" />}
          <span className={`text-sm font-bold ${gainPositive ? 'text-brand-green-light' : 'text-red-400'}`}>
            {gainPositive ? '+' : ''}{fmt(data.totalGain)}
          </span>
        </div>
      </div>

      {empty ? (
        <EmptyState
          illustration={<PortfolioEmptyIllustration />}
          title="Tu portafolio está en blanco"
          subtitle="Añade tu primera cuenta de inversión y empieza a ver crecer tu patrimonio con datos reales."
          ctaLabel="Ir al Portafolio"
          ctaTo="/portfolio"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <StatCard label="Total depositado"  value={fmt(data.totalDeposited)} />
            <StatCard label="Valor real actual" value={fmt(data.totalRealValue)} color={gainPositive ? 'text-brand-green-light' : 'text-red-400'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col items-center">
              <p className="text-text-secondary text-sm font-semibold mb-3">Valor Total</p>
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
                <p className="text-text-secondary text-sm font-semibold mb-3">Sin Efectivo</p>
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
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="bg-brand-green/10 border border-brand-green/20 rounded-2xl p-3">
            <Landmark size={22} className="text-brand-green-light" />
          </div>
          <div>
            <p className="font-bold text-white">Préstamos</p>
            <p className="text-text-muted text-xs">Créditos activos</p>
          </div>
        </div>

        {!data ? (
          <p className="text-text-muted text-sm">Cargando...</p>
        ) : data.activeCount === 0 ? (
          <EmptyState
            illustration={<LoansEmptyIllustration />}
            title="Sin préstamos activos"
            subtitle="Tu crédito está limpio. Mantén tu buen historial y accede a mejores condiciones cuando necesites financiamiento."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard label="Activos" value={String(data.activeCount)} />
            <StatCard label="Pagados" value={String(data.paidCount)} color="text-text-primary" />

            {/* Deuda total — valor con jerarquía */}
            <div className="bg-surface-base rounded-lg p-4 col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">Deuda total pendiente</p>
              <BigMoney value={data.totalOutstanding} size="lg" color="text-red-400" />
            </div>

            {data.nextInstallment && (
              <div className="bg-surface-elevated/60 border border-surface-border rounded-lg p-3 col-span-2 flex items-start gap-2">
                <AlertCircle size={16} className="text-brand-violet-light mt-0.5 shrink-0" />
                <div>
                  <p className="text-brand-violet-light text-xs font-semibold mb-0.5">Próximo pago</p>
                  <p className="text-white text-sm font-bold">{fmt(data.nextInstallment.amountDue)}</p>
                  <p className="text-text-secondary text-xs">{fmtDate(data.nextInstallment.dueDate)}</p>
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
  const utilColor = !data ? 'bg-surface-elevated'
    : data.utilizationPct < 30 ? 'bg-brand-green'
    : data.utilizationPct < 70 ? 'bg-brand-violet-light'
    : 'bg-red-500';

  const utilTextColor = !data ? 'text-text-secondary'
    : data.utilizationPct < 30 ? 'text-brand-green-light'
    : data.utilizationPct < 70 ? 'text-brand-violet-light'
    : 'text-red-400';

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
          <CreditCard size={22} className="text-blue-400" />
        </div>
        <div>
          <p className="font-bold text-white">Tarjetas de Crédito</p>
          <p className="text-text-muted text-xs">{data ? `${data.cardCount} tarjeta${data.cardCount !== 1 ? 's' : ''}` : '—'}</p>
        </div>
      </div>

      {!data ? (
        <p className="text-text-muted text-sm">Cargando...</p>
      ) : data.cardCount === 0 ? (
        <div className="flex items-center gap-2 text-brand-green-light text-sm">
          <CheckCircle size={16} /> Sin tarjetas registradas
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard label="Deuda total"  value={fmt(data.totalDebt)}  color="text-red-400" />
            <StatCard label="Límite total" value={fmt(data.totalLimit)} />
          </div>

          {/* Barra de utilización */}
          <div className="bg-surface-base rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Utilización</p>
              <p className={`text-sm font-bold ${utilTextColor}`}>{data.utilizationPct}%</p>
            </div>
            <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${utilColor}`}
                style={{ width: `${Math.min(data.utilizationPct, 100)}%` }}
              />
            </div>
          </div>

          {data.nextCutoff && (
            <div className="bg-surface-elevated/60 border border-surface-border rounded-lg p-3 flex items-start gap-2">
              <CalendarClock size={16} className="text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-blue-400 text-xs font-semibold mb-0.5">Próximo corte — {data.nextCutoff.cardName}</p>
                <p className="text-white text-sm font-bold">{fmtDate(data.nextCutoff.date)}</p>
                <p className="text-text-secondary text-xs">Saldo al corte: {fmt(data.nextCutoff.balance)}</p>
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
    <div className="bg-surface-card border border-surface-border rounded-3xl p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3">
          <RefreshCw size={22} className="text-violet-400" />
        </div>
        <div>
          <p className="font-bold text-white">Suscripciones</p>
          <p className="text-text-muted text-xs">{data ? `${data.count} activa${data.count !== 1 ? 's' : ''}` : '—'}</p>
        </div>
      </div>

      {!data ? (
        <p className="text-text-muted text-sm">Cargando...</p>
      ) : data.count === 0 ? (
        <div className="flex items-center gap-2 text-brand-green-light text-sm">
          <CheckCircle size={16} /> Sin suscripciones registradas
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Costo mensual — valor con jerarquía */}
          <div className="bg-surface-base rounded-lg p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">Costo mensual equivalente</p>
            <div className="flex items-baseline gap-1.5">
              <BigMoney value={data.monthlyEquivalent} size="lg" color="text-violet-400" />
              <span className="text-text-muted text-xs font-medium">/&nbsp;mes</span>
            </div>
          </div>

          {data.items.length > 0 && (
            <div className="flex flex-col gap-2">
              {data.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-surface-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                    <p className="text-text-primary text-sm">{item.name}</p>
                    <span className="text-text-muted text-xs">{FREQ_LABEL[item.frequency] ?? item.frequency}</span>
                  </div>
                  <p className="text-text-primary text-sm font-semibold">{fmt(item.amount)}</p>
                </div>
              ))}
              {data.count > data.items.length && (
                <p className="text-text-muted text-xs text-center">+{data.count - data.items.length} más</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Widget: Cripto ───────────────────────────────────────────────────────────

function CryptoDashboardWidget() {
  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3">
          <Bitcoin size={22} className="text-orange-400" />
        </div>
        <div>
          <p className="font-bold text-white">Inversiones Cripto</p>
          <p className="text-text-muted text-xs">Seguimiento de portafolio</p>
        </div>
      </div>
      <p className="text-text-secondary text-sm leading-relaxed">
        Tu portafolio de criptomonedas se gestiona directamente en la sección Cripto, donde puedes registrar operaciones y ver precios en tiempo real.
      </p>
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 flex items-center gap-2">
        <TrendingUp size={14} className="text-orange-400 shrink-0" />
        <p className="text-orange-300 text-xs">Los precios de mercado se obtienen en tiempo real al abrir la sección.</p>
      </div>
    </div>
  );
}

// ─── Widget: placeholder genérico ────────────────────────────────────────────

function PlaceholderWidget({ icon: Icon, title, desc, color }: {
  icon: React.ElementType; title: string; desc: string; color: string;
}) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`${color} rounded-2xl p-3`}>
          <Icon size={22} className="text-white" />
        </div>
        <p className="font-bold text-white">{title}</p>
      </div>
      <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
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
    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const base    = import.meta.env.VITE_API_URL;

    const fetchAll = async () => {
      try {
        const [summaryRes, moduleRes] = await Promise.all([
          axios.get(`${base}/dashboard/summary`,        { headers }),
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

  const MODULE_WIDGET_MAP: Partial<Record<keyof UserFlags, React.ReactNode>> = {
    hasMakeMoneyModule:        <PortfolioDashboardWidget data={moduleSummary?.portfolio ?? null} />,
    hasLoansModule:            <LoansDashboardWidget data={moduleSummary?.loans ?? null} />,
    hasCreditCardsModule:      <CreditCardsDashboardWidget data={moduleSummary?.creditCards ?? null} />,
    hasSubscriptionsModule:    <SubscriptionsDashboardWidget data={moduleSummary?.subscriptions ?? null} />,
    hasCryptoModule:           <CryptoDashboardWidget />,
    hasStockMarketModule:      <PlaceholderWidget icon={BarChart2} title="Bolsa de Valores" desc="Seguimiento de acciones, ETFs y mercados bursátiles." color="bg-cyan-500/10 border border-cyan-500/20" />,
    hasCompoundInterestModule: <PlaceholderWidget icon={Percent}   title="Interés Compuesto" desc="Proyección de crecimiento patrimonial a largo plazo."  color="bg-pink-500/10 border border-pink-500/20" />,
  };

  const activeWidgets = (Object.keys(MODULE_WIDGET_MAP) as (keyof UserFlags)[])
    .filter((key) => userFlags[key] === true);

  return (
    <div className="p-4 md:p-8 text-white font-sans max-w-7xl mx-auto">

      <h1 className="text-3xl font-extrabold text-brand-green-light mb-10">Resumen Financiero</h1>

      {/* ── HERO: 3 métricas principales ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">

        {/* Activos */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-7 flex flex-col gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Activos totales</p>
          <BigMoney value={summary.totalAssets} size="xl" color="text-white" />
          <p className="text-text-muted text-xs">Suma de cuentas de inversión</p>
        </div>

        {/* Pasivos */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-7 flex flex-col gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Pasivos totales</p>
          <BigMoney value={summary.totalLiabilities} size="xl" color="text-red-400" />
          <p className="text-text-muted text-xs">Deuda total pendiente</p>
        </div>

        {/* Patrimonio Neto — hero card con acento verde */}
        <div className="bg-brand-green/5 border border-brand-green/20 rounded-3xl p-7 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-green/8 via-transparent to-transparent pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-green relative z-10">Patrimonio neto</p>
          <div className="relative z-10">
            <BigMoney
              value={summary.netWorth}
              size="xl"
              color={summary.netWorth < 0 ? 'text-red-400' : 'text-brand-green-light'}
            />
          </div>
          <p className="text-text-muted text-xs relative z-10">Activos menos pasivos</p>
        </div>

      </div>

      {/* ── PANEL DINÁMICO ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-white whitespace-nowrap">Mi Panel</h2>
        <div className="h-px flex-1 bg-surface-border" />
      </div>

      {activeWidgets.length === 0 ? (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-12 flex flex-col items-center gap-5 text-center">
          <div className="bg-surface-elevated/50 border border-surface-border rounded-2xl p-5">
            <LayoutDashboard size={40} className="text-text-muted" />
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Tu panel está vacío</p>
            <p className="text-text-secondary text-sm">Visita la Tienda de Módulos para añadir herramientas financieras.</p>
          </div>
          <button
            onClick={() => navigate('/tienda')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-violet/10 border border-brand-violet/30 text-brand-violet-light hover:bg-brand-violet hover:border-brand-violet hover:text-white transition-all"
          >
            Ir a la Tienda de Módulos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
