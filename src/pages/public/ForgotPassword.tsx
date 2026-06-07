import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle, Landmark } from 'lucide-react';

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
    <div className="min-h-screen bg-surface-base flex flex-col">
      <nav className="container mx-auto px-6 py-6 flex items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-2 bg-surface-card rounded-lg border border-surface-border shadow-md shadow-brand-green/10">
            <Landmark className="h-6 w-6 text-brand-green-light" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">Finanzas<span className="text-brand-green-light">DMS</span></span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-surface-card p-8 rounded-2xl shadow-2xl w-full max-w-md border border-surface-border">

        {sent ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-brand-green/10 border border-brand-green/30 rounded-full p-4">
                <CheckCircle className="w-10 h-10 text-brand-green-light" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Correo enviado</h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Si <span className="text-white font-medium">{email}</span> está registrado, recibirás
              un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-brand-green-light hover:text-brand-green-light text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-5">
              <div className="bg-brand-violet/10 border border-brand-violet/30 rounded-full p-4">
                <Mail className="w-8 h-8 text-brand-violet" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-2">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="text-text-secondary text-sm text-center mb-6 leading-relaxed">
              Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-text-primary text-sm font-medium mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-base border border-surface-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand-green transition-colors"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-green hover:bg-brand-green-light text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-brand-green/20 disabled:opacity-50"
              >
                {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
