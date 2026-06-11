import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity, LayoutDashboard, CreditCard, CalendarClock, Landmark, PieChart, Bitcoin,
  LogOut, ShieldCheck, ClipboardList, Briefcase, DatabaseZap, ClipboardCheck,
  TrendingUp, BarChart2, Users, ChevronDown, ShoppingBag,
  Zap, Shield, Star, Crown,
} from 'lucide-react';

// ─── Config de niveles (espejo exacto de levels.config.ts del backend) ────────

const LEVEL_CONFIG = [
  { level: 'NOVATO_1',    label: 'Novato I',      minPoints: 0    },
  { level: 'NOVATO_2',    label: 'Novato II',     minPoints: 100  },
  { level: 'NOVATO_3',    label: 'Novato III',    minPoints: 200  },
  { level: 'CUMPLIDOR_1', label: 'Cumplidor I',   minPoints: 300  },
  { level: 'CUMPLIDOR_2', label: 'Cumplidor II',  minPoints: 500  },
  { level: 'CUMPLIDOR_3', label: 'Cumplidor III', minPoints: 750  },
  { level: 'SOCIO_1',     label: 'Socio I',       minPoints: 1000 },
  { level: 'SOCIO_2',     label: 'Socio II',      minPoints: 1500 },
  { level: 'ELITE',       label: 'Élite',         minPoints: 9999 },
] as const;

type LevelKey = typeof LEVEL_CONFIG[number]['level'];

function getLevelVisual(level: string): {
  Icon: React.ElementType;
  color: string;
  bar: string;
  glow: string;
} {
  if (level.startsWith('NOVATO'))     return { Icon: Zap,    color: 'text-slate-400',          bar: 'bg-slate-400',       glow: ''                          };
  if (level.startsWith('CUMPLIDOR')) return { Icon: Shield,  color: 'text-brand-green-light',   bar: 'bg-brand-green',     glow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]'  };
  if (level.startsWith('SOCIO'))     return { Icon: Star,    color: 'text-cyan-400',             bar: 'bg-cyan-500',        glow: 'shadow-[0_0_8px_rgba(34,211,238,0.4)]'  };
  if (level === 'ELITE')             return { Icon: Crown,   color: 'text-amber-400',            bar: 'bg-amber-400',       glow: 'shadow-[0_0_8px_rgba(251,191,36,0.5)]'  };
  return { Icon: Zap, color: 'text-slate-400', bar: 'bg-slate-400', glow: '' };
}

// ─── Helpers de localStorage ──────────────────────────────────────────────────

function getUserRole(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return '';
    const p = JSON.parse(raw) as Record<string, unknown>;
    return typeof p.role === 'string' ? p.role : '';
  } catch { return ''; }
}

function getUserName(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return '';
    const p = JSON.parse(raw) as Record<string, unknown>;
    return typeof p.name === 'string' ? p.name : '';
  } catch { return ''; }
}

function getUserPoints(): number {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 0;
    const p = JSON.parse(raw) as Record<string, unknown>;
    return typeof p.points === 'number' ? p.points : 0;
  } catch { return 0; }
}

function getUserLevel(): LevelKey {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'NOVATO_1';
    const p = JSON.parse(raw) as Record<string, unknown>;
    return (typeof p.level === 'string' ? p.level : 'NOVATO_1') as LevelKey;
  } catch { return 'NOVATO_1'; }
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
      hasCreditCardsModule:      parsed.hasCreditCardsModule     === true,
      hasLoansModule:            parsed.hasLoansModule           !== false,
      hasCryptoModule:           parsed.hasCryptoModule          === true,
      hasStockMarketModule:      parsed.hasStockMarketModule     === true,
      hasCompoundInterestModule: parsed.hasCompoundInterestModule === true,
      hasSubscriptionsModule:    parsed.hasSubscriptionsModule    === true,
      hasMakeMoneyModule:        parsed.hasMakeMoneyModule        !== false,
    };
  } catch { return defaultFlags(); }
}

// ─── Módulos ──────────────────────────────────────────────────────────────────

const userModules: { name: string; path: string; icon: React.ElementType; requiredFlag?: keyof UserFlags }[] = [
  { name: 'Resumen Financiero',  path: '/dashboard',       icon: LayoutDashboard },
  { name: 'Tarjetas de Crédito', path: '/credit-cards',    icon: CreditCard,    requiredFlag: 'hasCreditCardsModule'     },
  { name: 'Suscripciones',       path: '/subscriptions',   icon: CalendarClock,  requiredFlag: 'hasSubscriptionsModule'   },
  { name: 'Préstamos',           path: '/loans',           icon: Landmark,       requiredFlag: 'hasLoansModule'           },
  { name: 'Portafolio',          path: '/portfolio',       icon: PieChart                                                },
  { name: 'Monitor de Cuentas',  path: '/monitor-cuentas', icon: Activity                                               },
  { name: 'Inversiones Cripto',  path: '/crypto',          icon: Bitcoin,        requiredFlag: 'hasCryptoModule'          },
  { name: 'Gana Dinero',         path: '/investments',     icon: TrendingUp,     requiredFlag: 'hasMakeMoneyModule'       },
];

const adminModules = [
  { name: 'Panel de Control',       path: '/admin/home',         icon: BarChart2      },
  { name: 'Solicitudes Pendientes', path: '/admin/requests',     icon: ClipboardList  },
  { name: 'Cartera Activa',         path: '/admin/active-loans', icon: Briefcase      },
  { name: 'Validar Pagos',          path: '/admin/payments',     icon: ClipboardCheck },
  { name: 'Bancos',                 path: '/admin/banks',        icon: Landmark       },
  { name: 'Migrar Datos',           path: '/admin/migration',    icon: DatabaseZap    },
  { name: 'Tarjetas Referidos',     path: '/admin/referrals',    icon: TrendingUp     },
  { name: 'Gestión de Usuarios',    path: '/admin/users',        icon: Users          },
];

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
    isActive
      ? 'bg-brand-green/10 text-brand-green-light border border-brand-green/20 shadow-inner'
      : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
  }`;

// ─── LevelProgress — widget de gamificación ───────────────────────────────────

function LevelProgress({ points, level }: { points: number; level: LevelKey }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Pequeño delay para que la transición CSS se anime al montar
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const currentIdx = LEVEL_CONFIG.findIndex(l => l.level === level);
  const isElite    = level === 'ELITE';
  const current    = LEVEL_CONFIG[Math.max(currentIdx, 0)];
  const next       = !isElite && currentIdx < LEVEL_CONFIG.length - 1
    ? LEVEL_CONFIG[currentIdx + 1]
    : null;

  const pct = isElite
    ? 100
    : next
      ? Math.min(100, Math.max(0, Math.round(
          ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100
        )))
      : 0;

  const { Icon, color, bar, glow } = getLevelVisual(level);
  const remaining = next ? next.minPoints - points : 0;

  return (
    <div className="mx-3 mb-3 bg-surface-elevated/50 border border-surface-border rounded-2xl p-4">

      {/* Nivel + porcentaje */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className={color} />
          <span className={`text-xs font-bold ${color}`}>{current.label}</span>
        </div>
        {isElite ? (
          <span className={`text-[10px] font-bold ${color} bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full`}>
            MAX
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-text-muted tabular-nums">{pct}%</span>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden mb-2.5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${bar} ${mounted && pct > 5 ? glow : ''}`}
          style={{ width: mounted ? `${pct}%` : '0%' }}
        />
      </div>

      {/* Puntos actuales / siguiente nivel */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium tabular-nums mono text-text-muted">
          {points.toLocaleString('es-MX')} pts
        </span>
        {!isElite && next && remaining > 0 && (
          <span className="text-[10px] text-text-muted">
            {remaining.toLocaleString('es-MX')} para {next.label}
          </span>
        )}
        {!isElite && next && remaining <= 0 && (
          <span className={`text-[10px] font-bold ${color}`}>¡Listo para subir!</span>
        )}
      </div>

    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type SidebarProps = { isOpen: boolean; onClose: () => void; };

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const role = getUserRole();
  const name = getUserName();

  const [pendingCount, setPendingCount] = useState(0);
  const [openSections, setOpenSections] = useState({ user: true, admin: false });
  const [flags, setFlags]   = useState<UserFlags>(getUserFlags);
  const [points, setPoints] = useState(getUserPoints);
  const [level,  setLevel]  = useState<LevelKey>(getUserLevel);

  const toggleSection = (section: 'user' | 'admin') =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  useEffect(() => {
    const refresh = () => {
      setFlags(getUserFlags());
      setPoints(getUserPoints());
      setLevel(getUserLevel());
    };
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
    <aside className={`fixed md:relative inset-y-0 left-0 z-40 md:z-10 w-64 bg-surface-card border-r border-surface-border flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

      {/* ── Cabecera ── */}
      <div className="p-6 border-b border-surface-border">
        <Link to="/dashboard" className="text-2xl font-extrabold text-brand-green tracking-tight hover:text-brand-green-light transition-colors">
          FinanzasDMS
        </Link>
        {name && (
          <p className="text-text-secondary text-sm mt-1 truncate">
            <span className="text-text-muted">Hola,</span> {name}
          </p>
        )}
      </div>

      {/* ── Navegación ── */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

        {/* Mis Módulos */}
        <button
          onClick={() => toggleSection('user')}
          className="w-full flex items-center justify-between px-2 py-2 text-xs font-bold text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors"
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
              .map(({ name: mName, path, icon: Icon }) => (
                <NavLink key={path} to={path} className={navCls} onClick={onClose}>
                  <Icon size={20} className="shrink-0" />
                  {mName}
                </NavLink>
              ))}
          </div>
        )}

        {/* Tienda de Módulos */}
        <NavLink to="/tienda" className={navCls} onClick={onClose}>
          <ShoppingBag size={20} className="shrink-0 text-brand-violet-light" />
          Tienda de Módulos
        </NavLink>

        {/* Administración — solo ADMIN */}
        {role === 'ADMIN' && (
          <div className="pt-2">
            <button
              onClick={() => toggleSection('admin')}
              className="w-full flex items-center justify-between px-2 py-2 text-xs font-bold text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors"
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
                {adminModules.map(({ name: mName, path, icon: Icon }) => (
                  <NavLink key={path} to={path} className={navCls} onClick={onClose}>
                    <Icon size={20} className="shrink-0" />
                    {mName}
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

      {/* ── Progreso de nivel ── */}
      {role !== 'ADMIN' && (
        <LevelProgress points={points} level={level} />
      )}

      {/* ── Cerrar sesión ── */}
      <div className="p-4 border-t border-surface-border">
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
