import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Landmark, CreditCard, RefreshCw, Bitcoin,
  BarChart2, LayoutDashboard,
  AlertCircle, TrendingUp, TrendingDown,
  CalendarClock, CheckCircle,
} from 'lucide-react';
import { EmptyState, PortfolioEmptyIllustration, LoansEmptyIllustration } from '../../components/EmptyState';
import InstallAppButton from '../../components/InstallAppButton';
import { DashboardCard, type CardControls } from './dashboard/DashboardCard';
import { useDashboardLayout } from './dashboard/useDashboardLayout';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type UserFlags = {
  hasCreditCardsModule: boolean;
  hasLoansModule: boolean;
  hasSubscriptionsModule: boolean;
  hasMakeMoneyModule: boolean;
  hasCryptoModule: boolean;
  hasStockMarketModule: boolean;
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
    if (!raw) return { hasCreditCardsModule: true, hasLoansModule: true, hasSubscriptionsModule: true, hasMakeMoneyModule: true, hasCryptoModule: false, hasStockMarketModule: false };
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      hasCreditCardsModule:   p.hasCreditCardsModule   !== false,
      hasLoansModule:         p.hasLoansModule         !== false,
      hasSubscriptionsModule: p.hasSubscriptionsModule !== false,
      hasMakeMoneyModule:     p.hasMakeMoneyModule     !== false,
      hasCryptoModule:        p.hasCryptoModule        === true,
      hasStockMarketModule:   p.hasStockMarketModule   === true,
    };
  } catch {
    return { hasCreditCardsModule: true, hasLoansModule: true, hasSubscriptionsModule: true, hasMakeMoneyModule: true, hasCryptoModule: false, hasStockMarketModule: false };
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

function PortfolioDashboardWidget({ data, card }: { data: ModuleSummary['portfolio'] | null; card: CardControls }) {
  if (!data) return null;

  const empty = data.accountCount === 0;

  const toChartData = (slices: CategorySlice[]) =>
    slices.map((s, i) => ({ name: s.category, value: s.percentage, color: PALETTE[i % PALETTE.length] }));

  const totalData    = toChartData(data.byCategory);
  const nonCashData  = toChartData(data.byCategoryNonCash);
  const gainPositive = data.totalGain >= 0;

  return (
    <DashboardCard
      {...card}
      to="/portfolio"
      icon={
        <div className="bg-brand-violet/10 border border-brand-violet/20 rounded-2xl p-3">
          <BarChart2 size={22} className="text-brand-violet-light" />
        </div>
      }
      title="Portafolio de Inversiones"
      subtitle={`${data.accountCount} cuenta${data.accountCount !== 1 ? 's' : ''} registrada${data.accountCount !== 1 ? 's' : ''}`}
      headerExtra={
        <div className="flex items-center gap-1.5">
          {gainPositive ? <TrendingUp size={16} className="text-brand-green-light" /> : <TrendingDown size={16} className="text-red-400" />}
          <span className={`text-sm font-bold ${gainPositive ? 'text-brand-green-light' : 'text-red-400'}`}>
            {gainPositive ? '+' : ''}{fmt(data.totalGain)}
          </span>
        </div>
      }
    >
      {empty ? (
        <EmptyState
          illustration={<PortfolioEmptyIllustration />}
          title="Tu portafolio está en blanco"
          subtitle="Añade tu primera cuenta de inversión y empieza a ver crecer tu patrimonio con datos reales."
          ctaLabel="Ir al Portafolio"
          ctaTo="/portfolio"
        />
      ) : (
        <div>
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
        </div>
      )}
    </DashboardCard>
  );
}

// ─── Widget: Préstamos ────────────────────────────────────────────────────────

function LoansDashboardWidget({ data, card }: { data: ModuleSummary['loans'] | null; card: CardControls }) {
  return (
    <DashboardCard
      {...card}
      to="/loans"
      icon={
        <div className="bg-brand-green/10 border border-brand-green/20 rounded-2xl p-3">
          <Landmark size={22} className="text-brand-green-light" />
        </div>
      }
      title="Préstamos"
      subtitle="Créditos activos"
    >
      <Link to="/loans" className="block hover:opacity-90 transition-opacity">
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
            <div className="bg-surface-base rounded-lg p-4 sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">Deuda total pendiente</p>
              <BigMoney value={data.totalOutstanding} size="lg" color="text-red-400" />
            </div>

            {data.nextInstallment && (
              <div className="bg-surface-elevated/60 border border-surface-border rounded-lg p-3 sm:col-span-2 flex items-start gap-2">
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
      </Link>
    </DashboardCard>
  );
}

// ─── Widget: Tarjetas de crédito ──────────────────────────────────────────────

function CreditCardsDashboardWidget({ data, card }: { data: ModuleSummary['creditCards'] | null; card: CardControls }) {
  const utilColor = !data ? 'bg-surface-elevated'
    : data.utilizationPct < 30 ? 'bg-brand-green'
    : data.utilizationPct < 70 ? 'bg-brand-violet-light'
    : 'bg-red-500';

  const utilTextColor = !data ? 'text-text-secondary'
    : data.utilizationPct < 30 ? 'text-brand-green-light'
    : data.utilizationPct < 70 ? 'text-brand-violet-light'
    : 'text-red-400';

  return (
    <DashboardCard
      {...card}
      to="/credit-cards"
      icon={
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
          <CreditCard size={22} className="text-blue-400" />
        </div>
      }
      title="Tarjetas de Crédito"
      subtitle={data ? `${data.cardCount} tarjeta${data.cardCount !== 1 ? 's' : ''}` : '—'}
    >
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
    </DashboardCard>
  );
}

// ─── Widget: Suscripciones ────────────────────────────────────────────────────

function SubscriptionsDashboardWidget({ data, card }: { data: ModuleSummary['subscriptions'] | null; card: CardControls }) {
  return (
    <DashboardCard
      {...card}
      to="/subscriptions"
      icon={
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3">
          <RefreshCw size={22} className="text-violet-400" />
        </div>
      }
      title="Suscripciones"
      subtitle={data ? `${data.count} activa${data.count !== 1 ? 's' : ''}` : '—'}
    >
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
    </DashboardCard>
  );
}

// ─── Widget: Cripto ───────────────────────────────────────────────────────────

function CryptoDashboardWidget({ card }: { card: CardControls }) {
  return (
    <DashboardCard
      {...card}
      to="/crypto"
      icon={
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3">
          <Bitcoin size={22} className="text-orange-400" />
        </div>
      }
      title="Inversiones Cripto"
      subtitle="Seguimiento de portafolio"
    >
      <div className="flex flex-col gap-4">
        <p className="text-text-secondary text-sm leading-relaxed">
          Tu portafolio de criptomonedas se gestiona directamente en la sección Cripto, donde puedes registrar operaciones y ver precios en tiempo real.
        </p>
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-orange-400 shrink-0" />
          <p className="text-orange-300 text-xs">Los precios de mercado se obtienen en tiempo real al abrir la sección.</p>
        </div>
      </div>
    </DashboardCard>
  );
}

// ─── Widget: placeholder genérico ────────────────────────────────────────────

function PlaceholderWidget({ icon: Icon, title, desc, color, card }: {
  icon: React.ElementType; title: string; desc: string; color: string; card: CardControls;
}) {
  return (
    <DashboardCard
      {...card}
      icon={
        <div className={`${color} rounded-2xl p-3`}>
          <Icon size={22} className="text-white" />
        </div>
      }
      title={title}
    >
      <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
    </DashboardCard>
  );
}

// ─── Configuración de cards ──────────────────────────────────────────────────
// Solo módulos de resumen/saldos; Presupuesto e Interés compuesto no tienen card en Mi Panel.

type WidgetId = 'portfolio' | 'loans' | 'creditCards' | 'subscriptions' | 'crypto' | 'stocks';

const WIDGETS: { id: WidgetId; flag: keyof UserFlags; fullWidth?: boolean }[] = [
  { id: 'portfolio',     flag: 'hasMakeMoneyModule', fullWidth: true },
  { id: 'loans',         flag: 'hasLoansModule' },
  { id: 'creditCards',   flag: 'hasCreditCardsModule' },
  { id: 'subscriptions', flag: 'hasSubscriptionsModule' },
  { id: 'crypto',        flag: 'hasCryptoModule' },
  { id: 'stocks',        flag: 'hasStockMarketModule' },
];

// ─── Dashboard principal ──────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [moduleSummary, setModuleSummary] = useState<ModuleSummary | null>(null);
  const [userFlags, setUserFlags] = useState<UserFlags>(getFlags);

  // Drag & drop nativo: solo se puede arrastrar desde el ícono de agarre
  const [armedId, setArmedId]     = useState<WidgetId | null>(null);
  const [draggingId, setDragging] = useState<WidgetId | null>(null);
  const [overId, setOverId]       = useState<WidgetId | null>(null);

  useEffect(() => {
    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const base    = import.meta.env.VITE_API_URL;

    const fetchAll = async () => {
      try {
        const moduleRes = await axios.get(`${base}/dashboard/module-summary`, { headers });
        setModuleSummary(moduleRes.data);
      } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchAll();
  }, [navigate]);

  useEffect(() => {
    const handler = () => setUserFlags(getFlags());
    window.addEventListener('user-flags-updated', handler);
    return () => window.removeEventListener('user-flags-updated', handler);
  }, []);

  useEffect(() => {
    if (!armedId) return;
    const disarm = () => setArmedId(null);
    window.addEventListener('pointerup', disarm);
    return () => window.removeEventListener('pointerup', disarm);
  }, [armedId]);

  const activeIds = useMemo(
    () => WIDGETS.filter((w) => userFlags[w.flag] === true).map((w) => w.id),
    [userFlags],
  );
  const { orderedIds, isCollapsed, toggleCollapsed, moveCard } = useDashboardLayout(activeIds);

  const controlsFor = (id: WidgetId): CardControls => ({
    collapsed: isCollapsed(id),
    onToggle: () => toggleCollapsed(id),
    onGripPointerDown: () => setArmedId(id),
  });

  const renderWidget = (id: WidgetId) => {
    const card = controlsFor(id);
    switch (id) {
      case 'portfolio':     return <PortfolioDashboardWidget     data={moduleSummary?.portfolio ?? null}     card={card} />;
      case 'loans':         return <LoansDashboardWidget         data={moduleSummary?.loans ?? null}         card={card} />;
      case 'creditCards':   return <CreditCardsDashboardWidget   data={moduleSummary?.creditCards ?? null}   card={card} />;
      case 'subscriptions': return <SubscriptionsDashboardWidget data={moduleSummary?.subscriptions ?? null} card={card} />;
      case 'crypto':        return <CryptoDashboardWidget card={card} />;
      case 'stocks':        return <PlaceholderWidget icon={BarChart2} title="Bolsa de Valores" desc="Seguimiento de acciones, ETFs y mercados bursátiles." color="bg-cyan-500/10 border border-cyan-500/20" card={card} />;
    }
  };

  const endDrag = () => { setArmedId(null); setDragging(null); setOverId(null); };

  return (
    <div className="p-4 md:p-8 text-white font-sans max-w-7xl mx-auto">

      <h1 className="text-3xl font-extrabold text-brand-green-light mb-6">Resumen Financiero</h1>

      {/* ── PANEL DINÁMICO ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-white whitespace-nowrap">Mi Panel</h2>
        <div className="h-px flex-1 bg-surface-border" />
        <InstallAppButton />
      </div>

      {orderedIds.length === 0 ? (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {orderedIds.map((id) => {
            const fullWidth = WIDGETS.find((w) => w.id === id)?.fullWidth;
            const isDragging = draggingId === id;
            const isOver = overId === id && draggingId !== null && draggingId !== id;
            return (
              <div
                key={id}
                draggable={armedId === id}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', id);
                  setDragging(id);
                }}
                onDragOver={(e) => {
                  if (!draggingId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (overId !== id) setOverId(id);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null) && overId === id) setOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingId) moveCard(draggingId, id);
                  endDrag();
                }}
                onDragEnd={endDrag}
                className={`rounded-3xl transition-all duration-200 ${fullWidth ? 'col-span-full' : ''} ${isDragging ? 'opacity-40 scale-[0.98]' : ''} ${isOver ? 'ring-2 ring-brand-green/40 ring-offset-2 ring-offset-surface-base' : ''}`}
              >
                {renderWidget(id)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
