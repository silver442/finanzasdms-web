import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { isAdminRole, isSuperAdminRole } from '../../utils/roles';
import { getUserFlags, type UserFlags } from '../../config/navigation';
import { fetchModuleConfig, MODULE_CONFIG_UPDATED, type ModuleConfig, type ModuleStatus } from '../../utils/moduleConfig';
import { toast } from 'sonner';
import {
  CheckCircle2, CircleCheck, Loader2, Lock, AlertTriangle, Landmark, Wallet, GraduationCap, Store, ShoppingBag,
  Zap, Layers, Star, LayoutGrid, Package, Search, CreditCard, CalendarCheck, TrendingUp, Bitcoin,
  ChartColumnIncreasing, Calculator, HandCoins, SlidersHorizontal, Plus, FlaskConical, Globe, ShieldCheck, Hammer,
} from 'lucide-react';

type ModuleRestriction = { canDeactivate: boolean; reason: string | null };
type ModuleRestrictions = Partial<Record<keyof UserFlags, ModuleRestriction>>;
type Filter = 'all' | 'installed' | 'available';

interface ModuleTheme {
  tile: string;   // cuadro del ícono
  wave: string;   // color de la onda decorativa
  border: string; // borde cuando está instalado
  glow: string;   // degradado de fondo cuando está instalado
}

const theme = (tile: string, wave: string, border: string, glow: string): ModuleTheme => ({ tile, wave, border, glow });

interface StoreModule {
  key: string;
  flagKey: keyof UserFlags;
  name: string;
  desc: string;
  icon: React.ElementType;
  theme: ModuleTheme;
}

// Solo textos y estilo: la disponibilidad (En desarrollo / Solo Admin / Público) la decide la API
const STORE_MODULES: StoreModule[] = [
  { key: 'credit_cards', flagKey: 'hasCreditCardsModule', name: 'Tarjetas de Crédito', desc: 'Registra y monitorea todas tus tarjetas de crédito.', icon: CreditCard,
    theme: theme('from-emerald-500/30 to-emerald-700/10 border-emerald-400/20 text-emerald-300', 'text-emerald-500', 'border-emerald-500/30', 'from-emerald-500/10') },
  { key: 'loans', flagKey: 'hasLoansModule', name: 'Préstamos', desc: 'Solicita y gestiona préstamos familiares con gamificación.', icon: Landmark,
    theme: theme('from-indigo-500/30 to-indigo-700/10 border-indigo-400/20 text-indigo-300', 'text-indigo-500', 'border-indigo-500/30', 'from-indigo-500/10') },
  { key: 'subscriptions', flagKey: 'hasSubscriptionsModule', name: 'Suscripciones', desc: 'Controla tus gastos recurrentes y suscripciones mensuales.', icon: CalendarCheck,
    theme: theme('from-violet-500/30 to-violet-700/10 border-violet-400/20 text-violet-300', 'text-violet-500', 'border-violet-500/30', 'from-violet-500/10') },
  { key: 'make_money', flagKey: 'hasMakeMoneyModule', name: 'Gana Dinero', desc: 'Descubre oportunidades de inversión y genera ingresos extra.', icon: TrendingUp,
    theme: theme('from-amber-500/30 to-amber-700/10 border-amber-400/20 text-amber-300', 'text-amber-500', 'border-amber-500/30', 'from-amber-500/10') },
  { key: 'crypto', flagKey: 'hasCryptoModule', name: 'Inversiones Cripto', desc: 'Registra y monitorea tu portafolio de criptomonedas.', icon: Bitcoin,
    theme: theme('from-teal-500/30 to-teal-700/10 border-teal-400/20 text-teal-300', 'text-teal-500', 'border-teal-500/30', 'from-teal-500/10') },
  { key: 'stocks', flagKey: 'hasStockMarketModule', name: 'Bolsa de Valores', desc: 'Seguimiento de acciones, ETFs y mercados bursátiles.', icon: ChartColumnIncreasing,
    theme: theme('from-sky-500/30 to-sky-700/10 border-sky-400/20 text-sky-300', 'text-sky-500', 'border-sky-500/30', 'from-sky-500/10') },
  { key: 'compound_interest', flagKey: 'hasCompoundInterestModule', name: 'Interés Compuesto', desc: 'Simulador de crecimiento patrimonial a largo plazo.', icon: Calculator,
    theme: theme('from-cyan-500/30 to-cyan-700/10 border-cyan-400/20 text-cyan-300', 'text-cyan-500', 'border-cyan-500/30', 'from-cyan-500/10') },
  { key: 'external_debt', flagKey: 'hasExternalDebtModule', name: 'Deuda Externa', desc: 'Registra y monitorea los préstamos que tienes fuera de la plataforma, como deudas con bancos, familiares o amigos.', icon: HandCoins,
    theme: theme('from-rose-500/30 to-rose-700/10 border-rose-400/20 text-rose-300', 'text-rose-500', 'border-rose-500/30', 'from-rose-500/10') },
  { key: 'budget', flagKey: 'hasBudgetModule', name: 'Presupuesto', desc: 'Crea y gestiona presupuestos mensuales por categoría para tomar control de tus ingresos y gastos.', icon: Wallet,
    theme: theme('from-lime-500/30 to-lime-700/10 border-lime-400/20 text-lime-300', 'text-lime-500', 'border-lime-500/30', 'from-lime-500/10') },
  { key: 'finance_academy', flagKey: 'hasFinanceAcademyModule', name: 'Academia de Finanzas', desc: 'Aprende sobre finanzas personales, inversiones y crédito con cursos y guías interactivas.', icon: GraduationCap,
    theme: theme('from-orange-500/30 to-orange-700/10 border-orange-400/20 text-orange-300', 'text-orange-500', 'border-orange-500/30', 'from-orange-500/10') },
];

const FEATURES = [
  { icon: Zap, title: 'Personalizable', desc: 'Activa solo lo que usas', className: 'text-brand-green-light bg-brand-green/15 border-brand-green/20' },
  { icon: Layers, title: 'Flexible', desc: 'Puedes activarlos o desactivarlos', className: 'text-teal-300 bg-teal-500/15 border-teal-400/20' },
  { icon: Star, title: 'En crecimiento', desc: 'Nuevos módulos próximamente', className: 'text-amber-300 bg-amber-500/15 border-amber-400/20' },
];

const STATUS_OPTIONS: { value: ModuleStatus; label: string; icon: React.ElementType }[] = [
  { value: 'DEVELOPMENT', label: 'Desarrollo', icon: Hammer },
  { value: 'ADMIN_ONLY', label: 'Solo Admin', icon: ShieldCheck },
  { value: 'PUBLIC', label: 'Público', icon: Globe },
];

function getUserRole(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return '';
    const p = JSON.parse(raw) as Record<string, unknown>;
    return typeof p.role === 'string' ? p.role : '';
  } catch { return ''; }
}

// Onda decorativa de la esquina inferior derecha de cada tarjeta
function CardWave({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true" className={`pointer-events-none absolute bottom-0 right-0 w-40 h-24 ${className}`}>
      <path d="M0 100 C 60 95, 95 70, 115 45 S 150 5, 160 0 L 160 100 Z" fill="currentColor" fillOpacity="0.12" />
      <path d="M20 100 C 75 92, 105 68, 125 42 S 152 8, 160 4" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" />
    </svg>
  );
}

export default function ModuleStore() {
  const [flags, setFlags] = useState<UserFlags>(getUserFlags);
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<keyof UserFlags | null>(null);
  const [restrictions, setRestrictions] = useState<ModuleRestrictions>({});
  const [statuses, setStatuses] = useState<Record<string, ModuleStatus> | null>(null);
  const [savingStatusKey, setSavingStatusKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const role = getUserRole();
  const isAdmin = isAdminRole(role);
  const isSuperAdmin = isSuperAdminRole(role);

  useEffect(() => {
    axios
      .get<ModuleRestrictions>(`${import.meta.env.VITE_API_URL}/users/me/module-restrictions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => setRestrictions(res.data))
      .catch(() => { /* sin restricciones si falla */ });

    fetchModuleConfig()
      .then((config) => setStatuses(Object.fromEntries(config.map((m) => [m.key, m.status]))))
      .catch(() => {
        setStatuses({});
        toast.error('No se pudo cargar la disponibilidad de los módulos.');
      });
  }, []);

  const handleSetStatus = async (key: string, status: ModuleStatus) => {
    setSavingStatusKey(key);
    try {
      const { data } = await axios.patch<ModuleConfig>(
        `${import.meta.env.VITE_API_URL}/modules/${key}/visibility`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );
      setStatuses((prev) => ({ ...prev, [data.key]: data.status }));
      window.dispatchEvent(new Event(MODULE_CONFIG_UPDATED));
      const label = STATUS_OPTIONS.find((o) => o.value === data.status)?.label ?? data.status;
      toast.success(`Visibilidad actualizada: ${label}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'No se pudo cambiar la visibilidad del módulo');
    } finally {
      setSavingStatusKey(null);
    }
  };

  const setModuleFlag = async (flagKey: keyof UserFlags, value: boolean) => {
    setLoading(flagKey);
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/me/modules`,
        { [flagKey]: value },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );

      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw) as Record<string, unknown>;
        localStorage.setItem('user', JSON.stringify({ ...user, [flagKey]: value }));
      }

      setFlags((prev) => ({ ...prev, [flagKey]: value }));
      window.dispatchEvent(new Event('user-flags-updated'));
      toast.success(value ? '¡Módulo activado correctamente!' : 'Módulo desactivado. Tus datos se mantienen intactos.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (value ? 'No se pudo activar el módulo. Intenta de nuevo.' : 'No se pudo desactivar el módulo. Intenta de nuevo.'));
    } finally {
      setLoading(null);
    }
  };

  const isConfigLoading = statuses === null;
  const statusOf = (m: StoreModule): ModuleStatus | undefined => statuses?.[m.key];
  const canActivate = (m: StoreModule) => {
    const status = statusOf(m);
    return status === 'PUBLIC' || (status === 'ADMIN_ONLY' && isAdmin);
  };

  const installedCount = STORE_MODULES.filter((m) => flags[m.flagKey]).length;
  const availableCount = STORE_MODULES.filter((m) => !flags[m.flagKey] && canActivate(m)).length;

  const query = search.trim().toLowerCase();
  const visible = STORE_MODULES.filter((m) => {
    if (query && !`${m.name} ${m.desc}`.toLowerCase().includes(query)) return false;
    if (filter === 'installed') return flags[m.flagKey];
    if (filter === 'available') return !flags[m.flagKey] && canActivate(m);
    return true;
  });
  // En "Todos", lo que sigue en desarrollo (y no está instalado) va en su propia sección al final
  const isInDevelopment = (m: StoreModule) => statusOf(m) === 'DEVELOPMENT' && !flags[m.flagKey];
  const mainModules = visible.filter((m) => !isInDevelopment(m));
  const devModules = visible.filter(isInDevelopment);

  const TABS: { id: Filter; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'Todos los módulos', icon: LayoutGrid },
    { id: 'installed', label: `Instalados (${installedCount})`, icon: CircleCheck },
    { id: 'available', label: `Disponibles (${availableCount})`, icon: Package },
  ];

  const renderAction = (m: StoreModule) => {
    const isInstalled = flags[m.flagKey];
    const isLoading = loading === m.flagKey;
    const status = statusOf(m);

    if (isInstalled) {
      const restriction = restrictions[m.flagKey];
      const canDeactivate = !restriction || restriction.canDeactivate !== false;
      return (
        <button
          onClick={() => canDeactivate && setConfirmKey(m.flagKey)}
          disabled={isLoading || !canDeactivate}
          title={!canDeactivate ? (restriction?.reason ?? 'Debes liquidar tus préstamos activos antes de desactivar este módulo') : undefined}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-elevated/60 border border-white/10 text-text-primary hover:border-red-500/30 hover:text-red-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <SlidersHorizontal size={16} />}
          Desactivar
        </button>
      );
    }

    if (isConfigLoading) {
      return (
        <div className="flex items-center gap-2 py-2.5 text-text-muted text-sm">
          <Loader2 size={14} className="animate-spin" /> Cargando...
        </div>
      );
    }

    if (!canActivate(m)) {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/5 text-text-muted">
          <Lock size={16} /> Próximamente
        </div>
      );
    }

    const isAdminTest = status === 'ADMIN_ONLY';
    return (
      <button
        onClick={() => void setModuleFlag(m.flagKey, true)}
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-brand-violet/80 hover:bg-brand-violet border border-brand-violet-light/40 text-white shadow-lg shadow-brand-violet/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : isAdminTest ? <FlaskConical size={16} /> : <Plus size={16} />}
        {isLoading ? 'Activando...' : isAdminTest ? 'Probar (Admin)' : 'Activar Módulo'}
      </button>
    );
  };

  const renderStatusControl = (m: StoreModule) => {
    const current = statusOf(m);
    const isSaving = savingStatusKey === m.key;
    return (
      <div className="relative z-10 flex items-center justify-between gap-2 pt-3 border-t border-white/5">
        <span className="text-xs text-text-muted flex items-center gap-1">
          {isSaving && <Loader2 size={12} className="animate-spin" />} Visibilidad
        </span>
        <div role="group" aria-label={`Visibilidad de ${m.name}`} className="inline-flex bg-surface-base/60 rounded-lg p-0.5 border border-white/10">
          {STATUS_OPTIONS.map((o) => {
            const isActive = current === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={isActive}
                disabled={isSaving || isActive}
                onClick={() => void handleSetStatus(m.key, o.value)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors disabled:cursor-default ${
                  isActive
                    ? o.value === 'PUBLIC'
                      ? 'bg-brand-green/20 text-brand-green-light'
                      : 'bg-white/10 text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <o.icon size={12} />
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCard = (m: StoreModule) => {
    const isInstalled = flags[m.flagKey];
    const isDev = isInDevelopment(m);
    return (
      <div
        key={m.key}
        className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-4 shadow-card backdrop-blur-md transition-colors ${
          isInstalled
            ? `bg-gradient-to-br ${m.theme.glow} to-surface-card/60 ${m.theme.border}`
            : 'bg-surface-card/60 border-white/5 hover:border-white/10'
        }`}
      >
        <CardWave className={`${m.theme.wave} ${isDev ? 'opacity-40' : ''}`} />

        {isInstalled && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-green/15 border border-brand-green/30 text-brand-green-light">
            <CheckCircle2 size={12} /> Instalado
          </span>
        )}

        <div className={`relative flex items-center gap-4 ${isInstalled ? 'pr-24' : ''} ${isDev ? 'opacity-60' : ''}`}>
          <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br border flex items-center justify-center ${m.theme.tile}`}>
            <m.icon size={26} />
          </div>
          <h3 className="text-lg font-bold text-white leading-tight">{m.name}</h3>
        </div>

        <p className={`relative text-sm text-text-secondary flex-1 ${isDev ? 'opacity-60' : ''}`}>{m.desc}</p>

        <div className="relative">{renderAction(m)}</div>

        {isSuperAdmin && !isConfigLoading && renderStatusControl(m)}
      </div>
    );
  };

  return (
    <>
    <div className="p-4 sm:p-6 md:p-8 text-white max-w-7xl mx-auto">
      {/* ── Encabezado ── */}
      <header className="relative overflow-hidden rounded-2xl bg-surface-card/40 border border-white/5 p-5 md:p-7 mb-6">
        <div className="pointer-events-none absolute -top-16 right-10 w-72 h-72 rounded-full bg-brand-green/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl bg-brand-green/15 border border-brand-green/25 flex items-center justify-center text-brand-green-light">
                <Store size={28} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-4xl font-extrabold text-white">Tienda de Módulos</h1>
                <p className="text-sm md:text-base text-text-secondary mt-1">Activa los módulos que necesitas y personaliza tu experiencia financiera.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 md:mt-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-center gap-3 bg-surface-base/40 border border-white/5 rounded-xl px-3 py-2.5">
                  <div className={`w-9 h-9 shrink-0 rounded-full border flex items-center justify-center ${f.className}`}>
                    <f.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{f.title}</p>
                    <p className="text-xs text-text-secondary truncate">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex shrink-0 w-36 h-36 rounded-3xl bg-gradient-to-br from-brand-green/40 via-teal-500/20 to-surface-card border border-brand-green/30 shadow-green items-center justify-center rotate-6">
            <ShoppingBag size={72} className="text-brand-green-light -rotate-6" strokeWidth={1.5} />
          </div>
        </div>
      </header>

      {/* ── Filtros y búsqueda ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div role="tablist" aria-label="Filtrar módulos" className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {TABS.map((t) => {
            const isActive = filter === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap border transition-colors ${
                  isActive
                    ? 'bg-brand-green/20 border-brand-green/50 text-white shadow-inner'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <t.icon size={16} className={isActive ? 'text-brand-green-light' : ''} />
                {t.label}
              </button>
            );
          })}
        </div>
        <label className="relative md:w-72">
          <span className="sr-only">Buscar módulo</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar módulo..."
            className="w-full bg-surface-card/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-base sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-green"
          />
        </label>
      </div>

      {/* ── Módulos ── */}
      {mainModules.length === 0 && devModules.length === 0 ? (
        <div className="bg-surface-card/60 backdrop-blur-md rounded-2xl border border-white/5 p-8 text-center text-sm text-text-muted">
          No hay módulos que coincidan.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {mainModules.map(renderCard)}
        </div>
      )}

      {devModules.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">En desarrollo</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {devModules.map(renderCard)}
          </div>
        </div>
      )}
    </div>

    {/* Modal de confirmación de desactivación */}
    {confirmKey && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 max-w-sm w-full shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <h3 className="text-white font-bold text-lg">¿Desactivar módulo?</h3>
          </div>
          <p className="text-text-secondary text-sm mb-6">
            ¿Seguro que deseas ocultar este módulo? Tus datos guardados se mantendrán intactos y podrás reactivarlo en cualquier momento.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setConfirmKey(null)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-text-primary hover:text-white hover:bg-surface-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                void setModuleFlag(confirmKey, false);
                setConfirmKey(null);
              }}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all"
            >
              Sí, desactivar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
