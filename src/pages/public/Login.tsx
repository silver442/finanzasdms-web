/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MailWarning, Landmark, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';

const svgPattern = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" x="40" y="40" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="2" fill="rgba(5, 150, 105, 0.15)"/></pattern></defs><rect width="400" height="400" fill="none"/><rect width="400" height="400" fill="url(#dots)"/></svg>`;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        email,
        password
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success('¡Bienvenido de vuelta!');
      navigate('/dashboard');
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
        {/* Gradiente overlay */}
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
            Tu plataforma de finanzas familiares inteligentes
          </p>

          {/* Beneficios */}
          <div className="space-y-4 w-full max-w-sm">
            {[
              'Visibilidad total de tu patrimonio',
              'Organiza cada peso de forma inteligente',
              'Toma decisiones financieras con datos reales'
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
            <Landmark className="h-5 w-5 text-brand-green" />
          </div>
          <span className="font-extrabold text-text-primary text-sm">
            Finanzas<span className="text-brand-green">DMS</span>
          </span>
        </Link>

        {/* Formulario */}
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-1 text-text-muted hover:text-text-secondary transition-colors text-sm font-medium mb-6">
            <ArrowLeft size={14} /> Volver al inicio
          </Link>
          <h2 className="text-3xl font-extrabold text-text-primary mb-2">Iniciar Sesión</h2>
          <p className="text-text-secondary mb-8 text-sm">Accede a tu cuenta FinanzasDMS</p>

          {unverified && (
            <div className="mb-6 p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl flex items-start gap-3">
              <MailWarning className="h-5 w-5 text-[#F59E0B] shrink-0 mt-0.5" />
              <div className="text-sm text-text-secondary">
                <p className="font-semibold text-[#F59E0B] mb-1">Email no verificado</p>
                <p>Revisa tu bandeja de entrada para confirmar tu correo.</p>
              </div>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-green/30"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-border space-y-4">
            <Link
              to="/forgot-password"
              className="block text-center text-sm text-text-secondary hover:text-brand-green transition-colors font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
            <p className="text-center text-sm text-text-muted">
              ¿No tienes cuenta?{' '}
              <Link
                to="/register"
                className="text-brand-green hover:text-brand-green-light font-bold transition-colors"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
