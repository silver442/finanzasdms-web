import { NavLink, Outlet } from 'react-router-dom';
import { investorModules } from '../../config/navigation';

// Contenedor de la sección Inversionista: pestañas horizontales (también en el Sidebar) + la vista activa
export default function InvestorLayout() {
  return (
    <div className="p-4 md:p-8 text-white font-sans max-w-6xl mx-auto flex flex-col gap-6">
      <nav aria-label="Secciones de inversionista" className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
        <div className="flex gap-1 min-w-max border-b border-surface-border">
          {investorModules.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-brand-green text-brand-green-light'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              {name}
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
