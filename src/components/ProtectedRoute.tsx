import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { PhoneCall, AlertTriangle, Menu, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const API = import.meta.env.VITE_API_URL;
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

function getStoredUser(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function BlockedScreen() {
  // Si un SUPER_ADMIN ya desbloqueó la cuenta, /users/me responde 200: se limpia el flag y se recarga.
  useEffect(() => {
    axios
      .get(`${API}/users/me`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(() => {
        const user = getStoredUser();
        localStorage.setItem('user', JSON.stringify({ ...user, isBlocked: false }));
        window.location.reload();
      })
      .catch(() => { /* sigue bloqueada o sin sesión válida */ });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Hola, mi cuenta está bloqueada por morosidad y necesito regularizar mi situación.',
  )}`;

  return (
    <div className="fixed inset-0 bg-surface-base flex items-center justify-center z-50 p-6">
      <div className="max-w-md w-full bg-surface-card border border-red-500/40 rounded-2xl p-8 text-center shadow-2xl shadow-red-500/10">
        <div className="flex justify-center mb-5">
          <div className="bg-red-500/10 border border-red-500/30 rounded-full p-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-3">Cuenta Bloqueada por Morosidad</h1>

        <p className="text-text-secondary leading-relaxed mb-6">
          Tu cuenta ha sido bloqueada debido a pagos vencidos. Por favor, comunícate{' '}
          <span className="text-red-400 font-semibold">urgentemente</span> con un Administrador a
          nuestro WhatsApp para regularizar tu situación.
        </p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-brand-green hover:bg-brand-green-light text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/30 text-base"
        >
          <PhoneCall className="w-5 h-5" />
          Contactar por WhatsApp
        </a>

        <p className="text-text-muted text-sm mt-5">
          Una vez regularizada tu situación, el administrador desbloqueará tu acceso.
        </p>

        <button
          onClick={handleLogout}
          className="mt-4 inline-flex items-center gap-2 text-text-muted hover:text-text-secondary text-sm font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';

function getStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function ProtectedRoute() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Mini sidebar (solo escritorio) — la preferencia se recuerda en localStorage
  const [isCollapsed, setIsCollapsed] = useState(getStoredCollapsed);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch { /* sin storage */ }
      return next;
    });
  };
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = getStoredUser();
  if (user?.isBlocked === true) {
    return <BlockedScreen />;
  }

  return (
    <div className="flex h-dvh bg-surface-base overflow-hidden">

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapsed}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar — solo móvil */}
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-2 px-4 pt-[env(safe-area-inset-top)] h-14 box-content bg-surface-card/60 backdrop-blur-md border-b border-surface-border shadow-sm shadow-black/30 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <span className="text-lg font-extrabold text-brand-green tracking-tight">FinanzasDMS</span>
        </header>

        {/* pb extra en móvil para que el BottomNav (h-16) no tape el final del contenido */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-[env(safe-area-inset-bottom)]">
          <Outlet />
        </main>
      </div>

      <BottomNav />

    </div>
  );
}
