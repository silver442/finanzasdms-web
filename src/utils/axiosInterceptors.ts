import axios from 'axios';

// El backend marca así el 403 de cuenta bloqueada (AuthGuard); otros 403 son de permisos y se ignoran aquí.
export const ACCOUNT_BLOCKED_CODE = 'ACCOUNT_BLOCKED';

function markUserBlocked(): boolean {
  try {
    const raw = localStorage.getItem('user');
    const user = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    if (user.isBlocked === true) return false; // ya marcado: evita recargas en cadena
    localStorage.setItem('user', JSON.stringify({ ...user, isBlocked: true }));
    return true;
  } catch {
    return false;
  }
}

// Los 401 de /auth/* son errores de formulario (credenciales, correo sin verificar, token de reset), no de sesión.
function isAuthEndpoint(url: string | undefined): boolean {
  return !!url && /\/auth\//.test(url);
}

let isExpiring = false; // varias peticiones pueden fallar a la vez: solo una redirige

function expireSession() {
  if (isExpiring || !localStorage.getItem('token')) return;
  isExpiring = true;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (window.location.pathname !== '/login') window.location.href = '/login';
}

// Se registra sobre la instancia global de axios: todas las páginas la usan directamente.
export function setupAxiosInterceptors() {
  axios.interceptors.response.use(
    response => response,
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as { code?: string } | undefined;
        if (status === 401 && !isAuthEndpoint(error.config?.url)) {
          // Token expirado o inválido: se limpia la sesión y se vuelve al login.
          expireSession();
        } else if (status === 403 && data?.code === ACCOUNT_BLOCKED_CODE && markUserBlocked()) {
          // ProtectedRoute pinta la pantalla de "Cuenta Bloqueada" al leer isBlocked.
          window.location.href = '/dashboard';
        }
      }
      return Promise.reject(error);
    },
  );
}
