import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Landmark, PieChart, Bitcoin, LogOut, ShieldCheck, ClipboardList, Briefcase, DatabaseZap, ClipboardCheck, TrendingUp, BarChart2 } from 'lucide-react';

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

const menuItems = [
  { name: 'Resumen Financiero', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Tarjetas de Crédito', path: '/credit-cards', icon: CreditCard },
  { name: 'Préstamos', path: '/loans', icon: Landmark },
  { name: 'Portafolio', path: '/portfolio', icon: PieChart },
  { name: 'Inversiones Cripto', path: '/crypto', icon: Bitcoin },
  { name: 'Gana Dinero', path: '/investments', icon: TrendingUp },
];

const adminItems = [
  { name: 'Panel de Control', path: '/admin/home', icon: BarChart2 },
  { name: 'Solicitudes Pendientes', path: '/admin/requests', icon: ClipboardList },
  { name: 'Cartera Activa', path: '/admin/active-loans', icon: Briefcase },
  { name: 'Validar Pagos', path: '/admin/payments', icon: ClipboardCheck },
  { name: 'Bancos', path: '/admin/banks', icon: Landmark },
  { name: 'Migrar Datos', path: '/admin/migration', icon: DatabaseZap },
  { name: 'Tarjetas Referidos', path: '/admin/referrals', icon: TrendingUp },
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

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map(({ name, path, icon: Icon }) => (
          <NavLink key={path} to={path} className={navCls}>
            <Icon size={20} className="shrink-0" />
            {name}
          </NavLink>
        ))}

        {role === 'ADMIN' && (
          <div className="pt-4">
            <div className="flex items-center gap-2 px-2 mb-2">
              <ShieldCheck size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Administración</span>
            </div>
            {adminItems.map(({ name, path, icon: Icon }) => (
              <NavLink key={path} to={path} className={navCls}>
                <Icon size={20} className="shrink-0" />
                {name}
              </NavLink>
            ))}
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