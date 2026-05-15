import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Enlace inválido. No se encontró el token de verificación.');
      return;
    }

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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 text-center">

        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-4">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verificando tu cuenta…</h2>
            <p className="text-slate-400 text-sm">Por favor espera un momento.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full p-4">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">¡Cuenta verificada!</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
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
            <p className="text-slate-400 text-sm leading-relaxed mb-6">{message}</p>
            <Link
              to="/login"
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
            >
              Volver al inicio de sesión
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
