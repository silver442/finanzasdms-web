import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity, LayoutDashboard, CreditCard, CalendarClock, Landmark, PieChart, Bitcoin,
  LogOut, ShieldCheck, ClipboardList, Briefcase, DatabaseZap, ClipboardCheck,
  TrendingUp, BarChart2, Users, ChevronDown, ShoppingBag,
} from 'lucide-react';

function getUserRole(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed.role === 'string' ? parsed.role : '';
  } catch { return ''; }
}

function getUserName(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed.name === 'string' ? parsed.name : '';
  } catch { return ''; }
}

type UserFlags = {
  hasCreditCardsModule: boolean;
  hasLoansModule: boolean;
  hasCryptoModule: boolean;
  hasStockMarketModule: boolean;
  hasCompoundInterestModule: boolean;
  hasSubscriptionsModule: boolean;
  hasMakeMoneyModule: boolean;
};

function defaultFlags(): UserFlags {
  return { hasCreditCardsModule: false, hasLoansModule: true, hasCryptoModule: false, hasStockMarketModule: false, hasCompoundInterestModule: false, hasSubscriptionsModule: false, hasMakeMoneyModule: true };
}

function getUserFlags(): UserFlags {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return defaultFlags();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      hasCreditCardsModule:     parsed.hasCreditCardsModule     === true,
      hasLoansModule:           parsed.hasLoansModule           !== false,
      hasCryptoModule:          parsed.hasCryptoModule          === true,
      hasStockMarketModule:     parsed.hasStockMarketModule     === true,
      hasCompoundInterestModule: parsed.hasCompoundInterestModule === true,
      hasSubscriptionsModule:    parsed.hasSubscriptionsModule    === true,
      hasMakeMoneyModule:        parsed.hasMakeMoneyModule        !== false,
    };
  } catch { return defaultFlags(); }
}

const userModules: { name: string; path: string; icon: React.ElementType; requiredFlag?: keyof UserFlags }[] = [
  { name: 'Resumen Financiero',  path: '/dashboard',       icon: LayoutDashboard },
  { name: 'Tarjetas de Crédito', path: '/credit-cards',    icon: CreditCard,   requiredFlag: 'hasCreditCardsModule' },
  { name: 'Suscripciones',       path: '/subscriptions',   icon: CalendarClock, requiredFlag: 'hasSubscriptionsModule' as keyof UserFlags },
  { name: 'Préstamos',           path: '/loans',           icon: Landmark,     requiredFlag: 'hasLoansModule' },
  { name: 'Portafolio',          path: '/portfolio',       icon: PieChart },
  { name: 'Monitor de Cuentas',  path: '/monitor-cuentas', icon: Activity },
  { name: 'Inversiones Cripto',  path: '/crypto',          icon: Bitcoin,      requiredFlag: 'hasCryptoModule' },
  { name: 'Gana Dinero',         path: '/investments',     icon: TrendingUp,   requiredFlag: 'hasMakeMoneyModule' as keyof UserFlags },
];

const adminModules = [
  { name: 'Panel de Control',       path: '/admin/home',         icon: BarChart2 },
  { name: 'Solicitudes Pendientes', path: '/admin/requests',     icon: ClipboardList },
  { name: 'Cartera Activa',         path: '/admin/active-loans', icon: Briefcase },
  { name: 'Validar Pagos',          path: '/admin/payments',     icon: ClipboardCheck },
  { name: 'Bancos',                 path: '/admin/banks',        icon: Landmark },
  { name: 'Migrar Datos',           path: '/admin/migration',    icon: DatabaseZap },
  { name: 'Tarjetas Referidos',     path: '/admin/referrals',    icon: TrendingUp },
  { name: 'Gestión de Usuarios',    path: '/admin/users',        icon: Users },
];

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
    isActive
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner'
      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
  }`;

export default function Sidebar() {
  const navigate = useNavigate();
  const role = getUserRole();
  const name = getUserName();
  const [pendingCount, setPendingCount] = useState(0);
  const [openSections, setOpenSections] = useState({ user: true, admin: false });

  const toggleSection = (section: 'user' | 'admin') =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const [flags, setFlags] = useState<UserFlags>(getUserFlags);

  useEffect(() => {
    const refresh = () => setFlags(getUserFlags());
    window.addEventListener('user-flags-updated', refresh);
    return () => window.removeEventListener('user-flags-updated', refresh);
  }, []);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    const fetchCount = async () => {
      try {
        const { data } = await axios.get<{ count: number }>(
          `${import.meta.env.VITE_API_URL}/payment-requests/pending-count`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
        );
        setPendingCount(data.count);
      } catch { /* silencioso */ }
    };
    void fetchCount();
    const interval = setInterval(() => void fetchCount(), 60_000);
    return () => clearInterval(interval);
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-full shadow-2xl z-10">
      <div className="p-6 border-b border-slate-700">
        <Link to="/" className="text-2xl font-extrabold text-emerald-400 tracking-tight hover:text-emerald-300 transition-colors">
          FinanzasDMS
        </Link>
        {name && (
          <p className="text-slate-400 text-sm mt-1 truncate">
            <span className="text-slate-500">Hola,</span> {name}
          </p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

        {/* ── MIS MÓDULOS ── */}
        <button
          onClick={() => toggleSection('user')}
          className="w-full flex items-center justify-between px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
        >
          Mis Módulos
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${openSections.user ? 'rotate-180' : ''}`}
          />
        </button>

        {openSections.user && (
          <div className="space-y-1">
            {userModules
              .filter((m) => !m.requiredFlag || flags[m.requiredFlag])
              .map(({ name, path, icon: Icon }) => (
                <NavLink key={path} to={path} className={navCls}>
                  <Icon size={20} className="shrink-0" />
                  {name}
                </NavLink>
              ))}
          </div>
        )}

        {/* ── TIENDA DE MÓDULOS ── */}
        <NavLink to="/tienda" className={navCls}>
          <ShoppingBag size={20} className="shrink-0 text-violet-400" />
          <span className="text-violet-300">Tienda de Módulos</span>
        </NavLink>

        {/* ── ADMINISTRACIÓN (solo ADMIN) ── */}
        {role === 'ADMIN' && (
          <div className="pt-2">
            <button
              onClick={() => toggleSection('admin')}
              className="w-full flex items-center justify-between px-2 py-2 text-xs font-bold text-amber-400 uppercase tracking-wider hover:text-amber-300 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck size={14} />
                Administración
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openSections.admin ? 'rotate-180' : ''}`}
              />
            </button>

            {openSections.admin && (
              <div className="space-y-1">
                {adminModules.map(({ name, path, icon: Icon }) => (
                  <NavLink key={path} to={path} className={navCls}>
                    <Icon size={20} className="shrink-0" />
                    {name}
                    {path === '/admin/payments' && pendingCount > 0 && (
                      <span className="ml-auto relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}

      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:border-red-500 hover:text-white px-4 py-2.5 rounded-lg font-bold transition-all"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
