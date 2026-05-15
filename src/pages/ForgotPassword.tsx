import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
    } catch {
      toast.error('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">

        {sent ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full p-4">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Correo enviado</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Si <span className="text-white font-medium">{email}</span> está registrado, recibirás
              un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-5">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-full p-4">
                <Mail className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-2">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
              Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>

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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
