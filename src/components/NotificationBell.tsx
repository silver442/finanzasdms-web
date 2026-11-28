import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  AlertTriangle, Bell, BellOff, Bitcoin, CalendarClock, CheckCheck, CheckCircle2, Clock,
  CreditCard, Landmark, Receipt, RefreshCw, Users, X, XCircle,
} from 'lucide-react';
import { syncRoleFromServer } from '../utils/userSync';

const API = import.meta.env.VITE_API_URL;
const POLL_MS = 60_000;
const RETENTION_DAYS = 30;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  data: { memberId?: string; response?: 'ACCEPTED' | 'DECLINED' } | null;
  readAt: string | null;
  createdAt: string;
}

// Ícono y color por tipo de aviso
const TYPE_STYLE: Record<string, { Icon: typeof Bell; cls: string }> = {
  SUBSCRIPTION_INVITE:      { Icon: Users,         cls: 'bg-brand-green/15 text-brand-green-light' },
  SUBSCRIPTION_RESPONSE:    { Icon: Users,         cls: 'bg-brand-green/15 text-brand-green-light' },
  SUBSCRIPTION_PAYMENT:     { Icon: CalendarClock, cls: 'bg-blue-500/15 text-blue-400' },
  LOAN_REQUESTED:           { Icon: Landmark,      cls: 'bg-blue-500/15 text-blue-400' },
  LOAN_APPROVED:            { Icon: Landmark,      cls: 'bg-brand-green/15 text-brand-green-light' },
  LOAN_CONDITIONS_RESPONSE: { Icon: Landmark,      cls: 'bg-blue-500/15 text-blue-400' },
  LOAN_ACTIVATED:           { Icon: CheckCircle2,  cls: 'bg-brand-green/15 text-brand-green-light' },
  LOAN_REJECTED:            { Icon: XCircle,       cls: 'bg-red-500/15 text-red-400' },
  LOAN_CANCELLED:           { Icon: XCircle,       cls: 'bg-red-500/15 text-red-400' },
  INSTALLMENT_DUE_SOON:     { Icon: Clock,         cls: 'bg-yellow-500/15 text-yellow-400' },
  INSTALLMENT_OVERDUE:      { Icon: AlertTriangle, cls: 'bg-red-500/15 text-red-400' },
  PAYMENT_SUBMITTED:        { Icon: Receipt,       cls: 'bg-blue-500/15 text-blue-400' },
  PAYMENT_APPROVED:         { Icon: CheckCircle2,  cls: 'bg-brand-green/15 text-brand-green-light' },
  PAYMENT_REJECTED:         { Icon: XCircle,       cls: 'bg-red-500/15 text-red-400' },
  CRYPTO_ALERT:             { Icon: Bitcoin,       cls: 'bg-orange-500/15 text-orange-400' },
  CARD_CUTOFF_SOON:         { Icon: CreditCard,    cls: 'bg-blue-500/15 text-blue-400' },
  CARD_PAYMENT_DUE:         { Icon: CreditCard,    cls: 'bg-yellow-500/15 text-yellow-400' },
  INVESTOR_APPLICATION_SUBMITTED: { Icon: Users,        cls: 'bg-blue-500/15 text-blue-400' },
  INVESTOR_APPLICATION_APPROVED:  { Icon: CheckCircle2, cls: 'bg-brand-green/15 text-brand-green-light' },
  INVESTOR_APPLICATION_REJECTED:  { Icon: XCircle,      cls: 'bg-red-500/15 text-red-400' },
};
const DEFAULT_STYLE = { Icon: Bell, cls: 'bg-surface-elevated text-text-secondary' };

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function errorMessage(e: unknown, fallback: string): string {
  return (axios.isAxiosError<{ message?: string }>(e) && e.response?.data?.message) || fallback;
}

// Aceptar una invitación puede activar el módulo de Suscripciones: se refleja en el usuario guardado y el Sidebar
function markSubscriptionsModuleActive() {
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as Record<string, unknown>;
    localStorage.setItem('user', JSON.stringify({ ...user, hasSubscriptionsModule: true }));
  } catch { /* sin storage */ }
  window.dispatchEvent(new Event('user-flags-updated'));
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef<number | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await axios.get<{ count: number }>(`${API}/notifications/unread-count`, { headers: authHeaders() });
      setUnread(data.count);
      // Un aviso nuevo puede ser la aprobación como inversionista: el Sidebar debe mostrar su sección
      if (lastCountRef.current !== null && data.count > lastCountRef.current) void syncRoleFromServer();
      lastCountRef.current = data.count;
    } catch { /* silencioso: se reintenta en el siguiente ciclo */ }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<{ items: AppNotification[]; unreadCount: number }>(`${API}/notifications`, { headers: authHeaders() });
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch {
      toast.error('No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  // Contador: al montar, cada minuto y al volver a la pestaña
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con la API al montar
    void fetchCount();
    const id = window.setInterval(() => { if (!document.hidden) void fetchCount(); }, POLL_MS);
    const onVisible = () => { if (!document.hidden) void fetchCount(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('notifications-updated', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('notifications-updated', onVisible);
    };
  }, [fetchCount]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const markRead = async (n: AppNotification) => {
    if (n.readAt) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    setUnread((c) => Math.max(0, c - 1));
    try {
      await axios.patch(`${API}/notifications/${n.id}/read`, {}, { headers: authHeaders() });
    } catch { /* el siguiente refresco corrige el contador */ }
  };

  const openNotification = (n: AppNotification) => {
    void markRead(n);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.patch(`${API}/notifications/read-all`, {}, { headers: authHeaders() });
      const now = new Date().toISOString();
      setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? now })));
      setUnread(0);
    } catch {
      toast.error('No se pudieron marcar como leídas');
    }
  };

  const remove = async (n: AppNotification) => {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    if (!n.readAt) setUnread((c) => Math.max(0, c - 1));
    try {
      await axios.delete(`${API}/notifications/${n.id}`, { headers: authHeaders() });
    } catch {
      void fetchList();
    }
  };

  const respondInvite = async (n: AppNotification, status: 'ACCEPTED' | 'DECLINED') => {
    if (!n.data?.memberId) return;
    setRespondingId(n.id);
    try {
      const { data } = await axios.patch<{ moduleActivated?: boolean }>(
        `${API}/shared-subscriptions/members/${n.data.memberId}/respond`,
        { status },
        { headers: authHeaders() },
      );
      if (data.moduleActivated) markSubscriptionsModuleActive();
      toast.success(
        status === 'ACCEPTED'
          ? data.moduleActivated ? 'Invitación aceptada. Activamos tu módulo de Suscripciones.' : 'Invitación aceptada'
          : 'Invitación rechazada',
      );
      window.dispatchEvent(new Event('shared-subscriptions-updated'));
      await fetchList();
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo responder la invitación'));
      void fetchList();
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => {
          if (!open) void fetchList();
          setOpen(!open);
        }}
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60 transition-colors"
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-4 text-center ring-2 ring-surface-base">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 z-50 bg-surface-card/95 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col max-h-[70vh] overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-border shrink-0">
            <p className="font-bold text-text-primary">Notificaciones</p>
            {unread > 0 && (
              <button onClick={() => void markAllRead()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green-light hover:text-brand-green transition-colors">
                <CheckCheck size={14} /> Marcar todo como leído
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && items.length === 0 ? (
              <div className="flex justify-center items-center gap-2 py-10 text-text-secondary text-sm">
                <RefreshCw size={16} className="animate-spin" /> Cargando...
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 px-6 text-center">
                <BellOff size={32} className="text-text-muted opacity-50" />
                <p className="text-text-secondary text-sm font-semibold">No tienes notificaciones</p>
                <p className="text-text-muted text-xs">Aquí verás avisos de tus préstamos, pagos, tarjetas, cripto y suscripciones.</p>
              </div>
            ) : (
              <ul className="divide-y divide-surface-border/60">
                {items.map((n) => {
                  const { Icon, cls } = TYPE_STYLE[n.type] ?? DEFAULT_STYLE;
                  const pendingInvite = n.type === 'SUBSCRIPTION_INVITE' && n.data?.memberId && !n.data.response;
                  return (
                    <li key={n.id} className={`group relative flex gap-3 px-4 py-3 transition-colors ${n.readAt ? '' : 'bg-brand-green/[4%]'} hover:bg-surface-elevated/40`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <button onClick={() => openNotification(n)} className="text-left w-full">
                          <p className={`text-sm pr-5 ${n.readAt ? 'text-text-secondary font-medium' : 'text-text-primary font-semibold'}`}>{n.title}</p>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{n.body}</p>
                          <p className="text-[11px] text-text-muted mt-1">{timeAgo(n.createdAt)}</p>
                        </button>

                        {pendingInvite && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => void respondInvite(n, 'ACCEPTED')} disabled={respondingId === n.id}
                              className="bg-brand-green hover:bg-brand-green-light text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                            >
                              Aceptar
                            </button>
                            <button
                              onClick={() => void respondInvite(n, 'DECLINED')} disabled={respondingId === n.id}
                              className="bg-surface-elevated hover:bg-surface-elevated/70 text-text-primary text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                        {n.type === 'SUBSCRIPTION_INVITE' && n.data?.response && (
                          <p className={`text-xs font-semibold mt-1.5 ${n.data.response === 'ACCEPTED' ? 'text-brand-green-light' : 'text-text-muted'}`}>
                            {n.data.response === 'ACCEPTED' ? 'Aceptaste esta invitación' : 'Rechazaste esta invitación'}
                          </p>
                        )}
                      </div>

                      {!n.readAt && <span className="hidden sm:block absolute right-4 top-4 w-2 h-2 rounded-full bg-brand-green-light sm:group-hover:hidden" />}
                      <button
                        onClick={() => void remove(n)} aria-label="Eliminar notificación"
                        className="absolute right-2.5 top-2.5 p-1 rounded-md text-text-muted hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p className="px-4 py-2.5 border-t border-surface-border text-[11px] text-text-muted text-center shrink-0">
            Las notificaciones se eliminan automáticamente después de {RETENTION_DAYS} días.
          </p>
        </div>
      )}
    </div>
  );
}
