// localStorage puede no estar disponible (modo privado, datos bloqueados): las preferencias son solo una comodidad
export function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

export function readNumberPref(key: string): number | null {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // sin persistencia: la preferencia vive solo en memoria
  }
}

// Id del usuario en sesión para separar preferencias por cuenta en un mismo navegador
export function currentUserId(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? 'null') as { id?: unknown } | null;
    return user?.id !== undefined && user.id !== null ? String(user.id) : null;
  } catch {
    return null;
  }
}
