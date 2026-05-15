import { Navigate, Outlet } from 'react-router-dom';
import { PhoneCall, AlertTriangle } from 'lucide-react';
import Sidebar from './Sidebar';

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
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Hola, mi cuenta está bloqueada por morosidad y necesito regularizar mi situación.',
  )}`;

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50 p-6">
      <div className="max-w-md w-full bg-slate-800 border border-red-500/40 rounded-2xl p-8 text-center shadow-2xl shadow-red-500/10">
        <div className="flex justify-center mb-5">
          <div className="bg-red-500/10 border border-red-500/30 rounded-full p-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Cuenta Bloqueada por Morosidad</h1>

        <p className="text-slate-300 leading-relaxed mb-6">
          Tu cuenta ha sido bloqueada debido a pagos vencidos. Por favor, comunícate{' '}
          <span className="text-red-400 font-semibold">urgentemente</span> con un Administrador a
          nuestro WhatsApp para regularizar tu situación.
        </p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 text-base"
        >
          <PhoneCall className="w-5 h-5" />
          Contactar por WhatsApp
        </a>

        <p className="text-slate-500 text-sm mt-5">
          Una vez regularizada tu situación, el administrador desbloqueará tu acceso.
        </p>
      </div>
    </div>
  );
}

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = getStoredUser();
  if (user?.isBlocked === true) {
    return <BlockedScreen />;
  }

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
