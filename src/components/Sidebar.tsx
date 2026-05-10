import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Landmark, PieChart, Bitcoin, LogOut, ShieldCheck, ClipboardList } from 'lucide-react';

function getUserRole(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed.role === 'string' ? parsed.role : '';
  } catch { return ''; }
}

const menuItems = [
  { name: 'Resumen Financiero', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Tarjetas de Crédito', path: '/credit-cards', icon: CreditCard },
  { name: 'Préstamos', path: '/loans', icon: Landmark },
  { name: 'Portafolio (Bolsa)', path: '/portfolio', icon: PieChart },
  { name: 'Inversiones Cripto', path: '/crypto', icon: Bitcoin },
];

const adminItems = [
  { name: 'Solicitudes Pendientes', path: '/admin/requests', icon: ClipboardList },
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-full shadow-2xl z-10">
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-2xl font-extrabold text-emerald-400 tracking-tight">
          FinanzasDMS
        </h2>
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