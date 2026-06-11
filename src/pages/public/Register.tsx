import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Landmark, User, Mail, Lock, Loader2, CheckCircle, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

const svgPattern = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" x="40" y="40" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="2" fill="rgba(5, 150, 105, 0.15)"/></pattern></defs><rect width="400" height="400" fill="none"/><rect width="400" height="400" fill="url(#dots)"/></svg>`;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      setRegistered(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al crear la cuenta. Intenta de nuevo.';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-base p-6">
        <div className="max-w-md w-full bg-surface-card border border-surface-border rounded-2xl p-8 text-center shadow-2xl">
          <div className="flex justify-center mb-5">
            <div className="bg-brand-green/10 border border-brand-green/30 rounded-full p-4">
              <CheckCircle className="w-10 h-10 text-brand-green-light" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-3">¡Cuenta creada con éxito!</h1>

          <p className="text-text-secondary leading-relaxed mb-6">
            Te hemos enviado un enlace de verificación a tu correo electrónico. Por favor, verifica tu cuenta para continuar.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-green-light text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/30 text-base"
          >
            Ir a Iniciar Sesión
          </Link>

          <p className="text-text-muted text-sm mt-5">
            Revisa tu bandeja de entrada y tu carpeta de spam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-surface-base">
      {/* Panel izquierdo — solo desktop */}
      <div
        className="hidden md:flex flex-col items-center justify-center w-7/12 relative overflow-hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svgPattern)}")`,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0',
        }}
      >
        {/* Gradiente overlay — verde, igual que Login */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#059669]/40 via-transparent to-transparent pointer-events-none" />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="mb-6 p-3 bg-brand-green/20 rounded-2xl border border-brand-green/30">
            <Landmark className="h-12 w-12 text-brand-green" />
          </div>
          <h1 className="text-5xl font-extrabold text-text-primary mb-3">
            Finanzas<span className="text-brand-green">DMS</span>
          </h1>
          <p className="text-xl text-text-secondary mb-12 max-w-sm">
            Comienza a organizar tus finanzas hoy
          </p>

          {/* Beneficios */}
          <div className="space-y-4 w-full max-w-sm">
            {[
              'Crea tu perfil en menos de un minuto',
              'Accede a múltiples módulos financieros',
              'Gamificación y recompensas por buen historial'
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                <span className="text-text-secondary text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-col items-center justify-center w-full md:w-5/12 p-6 bg-surface-card">
        {/* Logo en mobile */}
        <Link to="/" className="md:hidden mb-8 flex items-center gap-2">
          <div className="p-2 bg-surface-elevated rounded-lg border border-surface-border">
            <Landmark className="h-5 w-5 text-brand-green-light" />
          </div>
          <span className="font-extrabold text-text-primary text-sm">
            Finanzas<span className="text-brand-green-light">DMS</span>
          </span>
        </Link>

        {/* Formulario */}
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-1 text-text-muted hover:text-text-secondary transition-colors text-sm font-medium mb-6">
            <ArrowLeft size={14} /> Volver al inicio
          </Link>
          <h2 className="text-3xl font-extrabold text-text-primary mb-2">Crear cuenta</h2>
          <p className="text-text-secondary mb-8 text-sm">Toma el control de tu patrimonio hoy mismo</p>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                required
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-surface-base border border-surface-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-surface-base border border-surface-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-base border border-surface-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/50 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-base border border-surface-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/50 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-green/30"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-border">
            <p className="text-center text-sm text-text-muted">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="text-brand-green hover:text-brand-green-light font-bold transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
