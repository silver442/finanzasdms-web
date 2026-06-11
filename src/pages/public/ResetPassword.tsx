import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { LockKeyhole, Eye, EyeOff, CheckCircle, Landmark } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { token, newPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? (err.response.data.message as string)
          : 'El enlace es inválido o ha expirado. Solicita uno nuevo.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logoNav = (
    <nav className="container mx-auto px-6 py-6 flex items-center">
      <Link to="/" className="flex items-center gap-2">
        <div className="p-2 bg-surface-card rounded-lg border border-surface-border shadow-md shadow-brand-green/10">
          <Landmark className="h-6 w-6 text-brand-green-light" />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-white">Finanzas<span className="text-brand-green-light">DMS</span></span>
      </Link>
    </nav>
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col">
        {logoNav}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-surface-card p-8 rounded-2xl w-full max-w-md border border-surface-border text-center">
            <p className="text-red-400 mb-4">Enlace inválido. Solicita uno nuevo.</p>
            <Link to="/forgot-password" className="text-brand-green-light hover:text-brand-green-light text-sm">
              Recuperar contraseña
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      {logoNav}
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-surface-card p-8 rounded-2xl shadow-2xl w-full max-w-md border border-surface-border">

        {done ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-brand-green/10 border border-brand-green/30 rounded-full p-4">
                <CheckCircle className="w-10 h-10 text-brand-green-light" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">¡Contraseña actualizada!</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Tu contraseña fue cambiada exitosamente. Serás redirigido al inicio de sesión en unos
              segundos…
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-5">
              <div className="bg-brand-green/10 border border-brand-green/30 rounded-full p-4">
                <LockKeyhole className="w-8 h-8 text-brand-green-light" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-2">Nueva contraseña</h2>
            <p className="text-text-secondary text-sm text-center mb-6">
              Elige una contraseña segura de al menos 8 caracteres.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-text-primary text-sm font-medium mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-surface-base border border-surface-border text-white rounded-lg px-4 py-2 pr-10 focus:outline-none focus:border-brand-green transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-text-primary text-sm font-medium mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-surface-base border border-surface-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand-green transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-green hover:bg-brand-green-light text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-brand-green/20 disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
