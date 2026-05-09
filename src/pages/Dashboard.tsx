import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Borramos el token de seguridad
    localStorage.removeItem('token');
    // 2. Lo regresamos a la pantalla de login
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400">Resumen Financiero</h1>
          <button 
            onClick={handleLogout} 
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl text-center">
          <p className="text-xl text-slate-300">
            ¡Bienvenido! En el siguiente paso conectaremos los números de tus cuentas aquí.
          </p>
        </div>
      </div>
    </div>
  );
}