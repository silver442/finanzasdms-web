import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token, renderizamos el Layout Maestro
  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Menú Lateral Fijo */}
      <Sidebar />
      
      {/* Área Principal de Contenido (Aquí se inyectan las pantallas) */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}