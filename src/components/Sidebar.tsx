import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Lista de tus módulos basados en tus hojas de cálculo
  const menuItems = [
    { name: 'Resumen Financiero', path: '/dashboard' },
    { name: 'Tarjetas de Crédito', path: '/credit-cards' },
    { name: 'Préstamos', path: '/loans' },
    { name: 'Portafolio (Bolsa)', path: '/portfolio' },
    { name: 'Inversiones Cripto', path: '/crypto' },
  ];

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
      {/* Logo o Título */}
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-2xl font-extrabold text-emerald-400 tracking-tight">
          FinanzasDMS
        </h2>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Botón de Cerrar Sesión al fondo */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg font-bold transition-all"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}