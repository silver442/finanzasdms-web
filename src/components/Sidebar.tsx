import { NavLink, useNavigate } from 'react-router-dom';
// Importamos los iconos que usaremos
import { LayoutDashboard, CreditCard, Landmark, PieChart, Bitcoin, LogOut } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Le agregamos un icono a cada opción de tu menú
  const menuItems = [
    { name: 'Resumen Financiero', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tarjetas de Crédito', path: '/credit-cards', icon: CreditCard },
    { name: 'Préstamos', path: '/loans', icon: Landmark },
    { name: 'Portafolio (Bolsa)', path: '/portfolio', icon: PieChart },
    { name: 'Inversiones Cripto', path: '/crypto', icon: Bitcoin },
  ];

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-full shadow-2xl z-10">
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-2xl font-extrabold text-emerald-400 tracking-tight flex items-center gap-2">
          FinanzasDMS
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon; // Instanciamos el icono
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`
              }
            >
              <Icon size={20} className="shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
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