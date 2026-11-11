/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Users, X, Tag, CheckCircle2, XCircle, Lock, Unlock, ShieldCheck, ShieldOff,
} from 'lucide-react';

interface AppUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  level: string;
  points: number;
  creditLimit: string | number;
  currentRate: string | number;
  isBlocked: boolean;
  familyCode?: string | null;
  referralCode?: string | null;
}

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const LEVEL_LABELS: Record<string, string> = {
  NOVATO_1: 'Novato I', NOVATO_2: 'Novato II', NOVATO_3: 'Novato III',
  CUMPLIDOR_1: 'Cumplidor I', CUMPLIDOR_2: 'Cumplidor II', CUMPLIDOR_3: 'Cumplidor III',
  SOCIO_1: 'Socio I', SOCIO_2: 'Socio II', ELITE: 'Élite',
};

function levelColor(level: string) {
  if (level.startsWith('NOVATO'))    return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
  if (level.startsWith('CUMPLIDOR')) return 'bg-brand-green/10 text-brand-green-light border-brand-green/30';
  if (level.startsWith('SOCIO'))     return 'bg-brand-violet/10 text-brand-violet border-brand-violet/30';
  if (level === 'ELITE')             return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  return 'bg-surface-elevated/50 text-text-primary border-surface-border';
}

function getStoredUser(): { id: string | null; role: string | null } {
  try {
    const raw = localStorage.getItem('user');
    const p = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    return {
      id: typeof p?.id === 'string' ? p.id : null,
      role: typeof p?.role === 'string' ? p.role : null,
    };
  } catch { return { id: null, role: null }; }
}

type RoleFilter = 'ALL' | 'USER' | 'ADMIN';

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'USER', label: 'Usuarios' },
  { value: 'ADMIN', label: 'Administradores' },
];

function roleBadge(role: string) {
  if (role === 'SUPER_ADMIN') return { label: 'Super Admin', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
  if (role === 'ADMIN')       return { label: 'Admin',       cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
  return null;
}

export default function AdminUsers() {
  const { id: currentUserId, role: currentRole } = getStoredUser();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [roleTarget, setRoleTarget] = useState<AppUser | null>(null);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [togglingBlock, setTogglingBlock] = useState<string | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get<AppUser[]>(`${API}/users`, { headers: authHeaders() });
      // SUPER_ADMIN ve también a los administradores; un ADMIN solo gestiona usuarios.
      setUsers(isSuperAdmin ? res.data : res.data.filter(u => u.role === 'USER'));
    } catch {
      toast.error('No se pudo cargar la información');
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const openEdit = (user: AppUser) => {
    setEditTarget(user);
    setSelectedCode(user.referralCode ?? '');
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setIsSaving(true);
    try {
      const payload = { code: selectedCode || null };
      await axios.patch(
        `${API}/users/${editTarget.id}/referral-code`,
        payload,
        { headers: authHeaders() },
      );
      setUsers(prev => prev.map(u =>
        u.id === editTarget.id ? { ...u, referralCode: selectedCode || null } : u
      ));
      toast.success(
        selectedCode
          ? `Código "${selectedCode}" asignado a ${editTarget.name ?? editTarget.email}`
          : `Código de referido removido de ${editTarget.name ?? editTarget.email}`
      );
      setEditTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBlock = async (user: AppUser) => {
    setTogglingBlock(user.id);
    try {
      const { data } = await axios.patch<{ isBlocked: boolean }>(
        `${API}/users/${user.id}/toggle-block`,
        {},
        { headers: authHeaders() },
      );
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, isBlocked: data.isBlocked } : u)));
      toast.success(`${user.name ?? user.email} ${data.isBlocked ? 'bloqueado' : 'desbloqueado'}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al cambiar el estado de la cuenta');
    } finally {
      setTogglingBlock(null);
    }
  };

  const handleChangeRole = async () => {
    if (!roleTarget) return;
    const newRole = roleTarget.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setIsChangingRole(true);
    try {
      const { data } = await axios.patch<{ role: string }>(
        `${API}/users/${roleTarget.id}/role`,
        { role: newRole },
        { headers: authHeaders() },
      );
      setUsers(prev => prev.map(u => (u.id === roleTarget.id ? { ...u, role: data.role } : u)));
      toast.success(
        data.role === 'ADMIN'
          ? `${roleTarget.name ?? roleTarget.email} ahora es administrador`
          : `${roleTarget.name ?? roleTarget.email} ya no es administrador`,
      );
      setRoleTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al cambiar el rol');
    } finally {
      setIsChangingRole(false);
    }
  };

  const filtered = users.filter(u => {
    if (roleFilter === 'USER' && u.role !== 'USER') return false;
    if (roleFilter === 'ADMIN' && u.role === 'USER') return false;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name ?? '').toLowerCase().includes(q)
    );
  });

  const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand-green transition-colors';

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-violet flex items-center gap-3">
          <Users size={32} />
          Gestión de Usuarios
        </h1>
        <p className="text-text-secondary mt-2">Asigna códigos de referido a usuarios de confianza</p>
      </div>

      {/* Search + filtro de rol (solo SUPER_ADMIN) */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={inputCls + ' max-w-sm'}
        />
        {isSuperAdmin && (
          <div className="inline-flex bg-surface-card border border-surface-border rounded-xl p-1 self-start">
            {ROLE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setRoleFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${roleFilter === f.value
                  ? 'bg-brand-green/10 text-brand-green-light border border-brand-green/20'
                  : 'text-text-secondary hover:text-white border border-transparent'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-text-secondary">Cargando usuarios...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p>No se encontraron usuarios.</p>
        </div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-base/40">
                <th className="text-left px-5 py-3 text-text-secondary font-semibold">Usuario</th>
                <th className="text-left px-5 py-3 text-text-secondary font-semibold">Nivel</th>
                <th className="text-center px-5 py-3 text-text-secondary font-semibold">Familiar</th>
                <th className="text-left px-5 py-3 text-text-secondary font-semibold">Código Referido</th>
                <th className="text-center px-5 py-3 text-text-secondary font-semibold">Estado</th>
                <th className="text-center px-5 py-3 text-text-secondary font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map(user => {
                const badge = roleBadge(user.role);
                const isSelf = user.id === currentUserId;
                return (
                <tr key={user.id} className="hover:bg-surface-elevated/20 transition-colors">
                  {/* Usuario */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{user.name ?? '—'}</p>
                      {badge && (
                        <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                      {isSelf && <span className="text-[10px] text-text-muted font-semibold">(tú)</span>}
                    </div>
                    <p className="text-text-secondary text-xs">{user.email}</p>
                  </td>

                  {/* Nivel */}
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${levelColor(user.level)}`}>
                      {LEVEL_LABELS[user.level] ?? user.level}
                    </span>
                  </td>

                  {/* Familiar */}
                  <td className="px-5 py-4 text-center">
                    {user.familyCode
                      ? <span title="Familiar asignado" className="inline-flex"><CheckCircle2 size={16} className="text-brand-green-light" /></span>
                      : <span title="Sin código de familia" className="inline-flex"><XCircle size={16} className="text-text-muted" /></span>
                    }
                  </td>

                  {/* Código Referido */}
                  <td className="px-5 py-4">
                    {user.referralCode
                      ? (
                        <span className="inline-flex items-center gap-1.5 bg-brand-green/10 border border-brand-green/30 text-brand-green-light text-xs px-2.5 py-1 rounded-lg font-mono font-semibold">
                          <Tag size={11} />
                          {user.referralCode}
                        </span>
                      )
                      : <span className="text-text-muted text-xs">Sin asignar</span>
                    }
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-4 text-center">
                    {user.isBlocked
                      ? <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-full">BLOQUEADO</span>
                      : <span className="bg-brand-green/20 text-brand-green-light text-xs font-bold px-2 py-1 rounded-full">ACTIVO</span>}
                  </td>

                  {/* Acción */}
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="bg-brand-violet/10 hover:bg-brand-violet text-brand-violet hover:text-white border border-brand-violet/30 hover:border-brand-violet px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        {user.referralCode ? 'Cambiar' : 'Asignar'}
                      </button>
                      {isSuperAdmin && !isSelf && user.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => setRoleTarget(user)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${user.role === 'ADMIN'
                            ? 'bg-surface-elevated/50 hover:bg-surface-elevated text-text-secondary hover:text-white border-surface-border'
                            : 'bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border-sky-500/30'}`}
                        >
                          {user.role === 'ADMIN' ? <><ShieldOff size={12} /> Quitar admin</> : <><ShieldCheck size={12} /> Hacer admin</>}
                        </button>
                      )}
                      {isSuperAdmin && !isSelf && (
                        <button
                          onClick={() => void handleToggleBlock(user)}
                          disabled={togglingBlock === user.id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 ${user.isBlocked
                            ? 'bg-brand-green/10 hover:bg-brand-green text-brand-green-light hover:text-white border-brand-green/30'
                            : 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/30'}`}
                        >
                          {user.isBlocked ? <><Unlock size={12} /> Desbloquear</> : <><Lock size={12} /> Bloquear</>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal confirmar cambio de rol (SUPER_ADMIN) */}
      {roleTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full max-w-sm p-6 text-center">
            {roleTarget.role === 'ADMIN'
              ? <ShieldOff size={36} className="text-text-secondary mx-auto mb-3" />
              : <ShieldCheck size={36} className="text-sky-400 mx-auto mb-3" />}
            <h3 className="text-lg font-bold text-white mb-2">
              {roleTarget.role === 'ADMIN' ? '¿Quitar rol de administrador?' : '¿Hacer administrador?'}
            </h3>
            <p className="text-white font-semibold">{roleTarget.name ?? '—'}</p>
            <p className="text-text-secondary text-xs mb-4">{roleTarget.email}</p>
            <p className="text-text-muted text-sm mb-6">
              {roleTarget.role === 'ADMIN'
                ? 'Perderá el acceso al panel de administración de inmediato y sus cuentas bancarias dejarán de mostrarse para recibir pagos SPEI.'
                : 'Podrá aprobar préstamos, validar pagos SPEI y gestionar usuarios. El cambio aplica de inmediato.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRoleTarget(null)}
                disabled={isChangingRole}
                className="flex-1 px-4 py-2 rounded-lg border border-surface-border text-text-primary hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleChangeRole()}
                disabled={isChangingRole}
                className="flex-1 bg-brand-green hover:bg-brand-green-light text-white px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 shadow-lg shadow-brand-green/20"
              >
                {isChangingRole ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal asignar código */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-surface-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag size={18} className="text-brand-violet" />
                Asignar Código de Referido
              </h3>
              <button onClick={() => setEditTarget(null)} className="text-text-secondary hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-surface-base rounded-xl p-4 text-sm space-y-1">
                <p className="text-text-secondary">Usuario</p>
                <p className="text-white font-semibold">{editTarget.name ?? '—'}</p>
                <p className="text-text-secondary text-xs">{editTarget.email}</p>
              </div>

              <div>
                <label className="text-sm text-text-primary font-medium block mb-1">
                  Código a asignar
                </label>
                <input
                  type="text"
                  value={selectedCode}
                  onChange={e => setSelectedCode(e.target.value.toUpperCase())}
                  placeholder="Ej. AMIGO2025 — dejar vacío para remover"
                  className={inputCls}
                />
                <p className="text-xs text-text-muted mt-1">
                  Escribe cualquier código de confianza. Al solicitar préstamo se aplicará automáticamente.
                </p>
              </div>

              {selectedCode && (
                <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-3 text-sm flex items-center gap-2">
                  <Tag size={14} className="text-brand-green-light shrink-0" />
                  <p className="text-text-primary">
                    Al solicitar su próximo préstamo, el código <strong className="text-brand-green-light font-mono">{selectedCode}</strong> se aplicará automáticamente.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-surface-border flex gap-3 justify-end">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 rounded-lg text-text-primary hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="bg-brand-violet hover:bg-brand-violet-600 text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
