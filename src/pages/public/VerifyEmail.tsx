import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<Status>(() => (token ? 'loading' : 'error'));
  const [message, setMessage] = useState(() =>
    token ? '' : 'Enlace inválido. No se encontró el token de verificación.',
  );

  useEffect(() => {
    if (!token) return;

    axios
      .get<{ message: string }>(`${API}/auth/verify-email`, { params: { token } })
      .then((res) => {
        setMessage(res.data.message);
        setStatus('success');
      })
      .catch((err: unknown) => {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.message
            ? (err.response.data.message as string)
            : 'El enlace de verificación es inválido o ha expirado.';
        setMessage(msg);
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="bg-surface-card p-8 rounded-2xl shadow-2xl w-full max-w-md border border-surface-border text-center">

        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-4">
              <Loader2 className="w-10 h-10 text-brand-green-light animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verificando tu cuenta…</h2>
            <p className="text-text-secondary text-sm">Por favor espera un momento.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-brand-green/10 border border-brand-green/30 rounded-full p-4">
                <CheckCircle className="w-10 h-10 text-brand-green-light" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">¡Cuenta verificada!</h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-brand-green hover:bg-brand-green-light text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-lg shadow-brand-green/20"
            >
              Iniciar sesión
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-full p-4">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Verificación fallida</h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">{message}</p>
            <Link
              to="/login"
              className="text-brand-green-light hover:text-brand-green-light text-sm font-medium transition-colors"
            >
              Volver al inicio de sesión
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
