import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

export default function GoogleAuthButton() {
  const navigate = useNavigate();

  const handleSuccess = async ({ credential }: CredentialResponse) => {
    if (!credential) {
      toast.error('No se recibió la credencial de Google');
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/google`, { credential });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success('¡Bienvenido!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'No se pudo iniciar sesión con Google';
      toast.error(Array.isArray(message) ? message[0] : message);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 border-t border-surface-border" />
        <span className="text-xs text-text-muted">o continúa con</span>
        <div className="flex-1 border-t border-surface-border" />
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={(res) => void handleSuccess(res)}
          onError={() => toast.error('Error al conectar con Google')}
          theme="filled_black"
          shape="pill"
          text="continue_with"
        />
      </div>
    </div>
  );
}
