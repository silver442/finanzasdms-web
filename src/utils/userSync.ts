import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

// El rol puede cambiar en el servidor (p. ej. solicitud de inversionista aprobada) con la sesión abierta:
// se refleja en localStorage.user y se avisa al Sidebar. Devuelve el rol vigente (null si falla).
export async function syncRoleFromServer(): Promise<string | null> {
  try {
    const { data } = await axios.get<{ role?: string }>(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const role = data.role ?? null;
    if (!role) return null;
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as Record<string, unknown>;
    if (user.role !== role) {
      localStorage.setItem('user', JSON.stringify({ ...user, role }));
      window.dispatchEvent(new Event('user-flags-updated'));
    }
    return role;
  } catch {
    return null;
  }
}
