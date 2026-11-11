import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getUserFlags, userModules, type UserFlags } from '../config/navigation';

const FIXED_PATHS = ['/dashboard', '/portfolio', '/monitor-cuentas'];
const MAX_DYNAMIC = 2;

const itemCls = ({ isActive }: { isActive: boolean }) =>
  `flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 h-full transition-all active:scale-95 ${
    isActive ? 'text-brand-green-light' : 'text-text-muted hover:text-text-secondary'
  }`;

// Barra de navegación inferior — solo móvil (< md)
export default function BottomNav() {
  const [flags, setFlags] = useState<UserFlags>(getUserFlags);

  useEffect(() => {
    const refresh = () => setFlags(getUserFlags());
    window.addEventListener('user-flags-updated', refresh);
    return () => window.removeEventListener('user-flags-updated', refresh);
  }, []);

  const fixed   = userModules.filter((m) => FIXED_PATHS.includes(m.path));
  const dynamic = userModules.filter((m) => m.requiredFlag && flags[m.requiredFlag]).slice(0, MAX_DYNAMIC);
  const items   = [...fixed, ...dynamic];

  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-surface-card/90 backdrop-blur-md border-t border-white/5 shadow-sm shadow-black/30 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex justify-around items-center h-16 px-1">
        {items.map(({ name, shortName, path, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/dashboard'} className={itemCls} aria-label={name}>
            <Icon size={22} className="shrink-0" />
            <span className="text-[10px] font-medium leading-tight truncate max-w-full px-0.5">{shortName}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
