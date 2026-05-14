/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MailWarning } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Asumiendo que tienes un estado isLoading como en Register

    try {
      const response = await axios.post('http://localhost:3000/auth/login', {
        email,
        password
      });

      // Guardamos el token en el navegador
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success('¡Bienvenido de vuelta!');
      navigate('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const msg: string = error.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('verifica') || msg.toLowerCase().includes('verificad')) {
        setUnverified(true);
      } else {
        setUnverified(false);
        toast.error('Correo o contraseña incorrectos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Iniciar Sesión
        </h2>

        {unverified && (
          <div className="flex gap-3 items-start bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
            <MailWarning className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-amber-300 text-sm leading-relaxed">
              Tu cuenta no está verificada. Por favor, revisa tu bandeja de entrada (y la carpeta de
              SPAM) para confirmar tu correo.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Conectando...' : 'Entrar al Sistema'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}