import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Users,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  CreditCard,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}
function fmt(v: number | string) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));
}

const FREQ_LABEL: Record<string, string> = {
  MONTHLY: 'Mensual',
  BIMONTHLY: 'Bimestral',
  YEARLY: 'Anual',
};

type MemberStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

interface Member {
  id: string;
  email: string;
  status: MemberStatus;
  hasPaid: boolean;
  paidAt: string | null;
  joinedAt: string | null;
  user: { name: string | null; email: string } | null;
}

interface ScheduledExpense {
  id: string;
  name: string;
  amount: number | string;
  frequency: string;
  chargeDay: number;
  creditCard: { name: string; color?: string } | null;
}

interface SharedSub {
  id: string;
  scheduledExpense: ScheduledExpense;
  owner: { name: string | null; email: string };
  members: Member[];
  costPerMember: number;
  createdAt: string;
}

interface MyInvitation extends Member {
  sharedSubscription: SharedSub & { scheduledExpense: ScheduledExpense };
  costPerMember: number;
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, { label: string; cls: string; Icon: typeof Clock }> = {
    PENDING:  { label: 'Pendiente', cls: 'bg-yellow-500/20 text-yellow-400', Icon: Clock },
    ACCEPTED: { label: 'Aceptó',    cls: 'bg-brand-green/20 text-brand-green-light', Icon: CheckCircle2 },
    DECLINED: { label: 'Rechazó',   cls: 'bg-red-500/20 text-red-400', Icon: XCircle },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${cls}`}>
      <Icon size={11} /> {label}
    </span>
  );
}

function PaidBadge({ hasPaid }: { hasPaid: boolean }) {
  return hasPaid ? (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
      <CheckCircle2 size={11} /> Pagó
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-surface-elevated/40 text-text-secondary">
      <Clock size={11} /> Pendiente
    </span>
  );
}

function MySharedCard({ shared, onDelete, onTogglePaid, onRemoveMember }: {
  shared: SharedSub;
  onDelete: (id: string, name: string) => void;
  onTogglePaid: (memberId: string) => void;
  onRemoveMember: (memberId: string, email: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const accepted = shared.members.filter((m) => m.status === 'ACCEPTED').length;

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden">
      <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <p className="font-bold text-white text-lg">{shared.scheduledExpense.name}</p>
            {shared.scheduledExpense.creditCard && (
              <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: shared.scheduledExpense.creditCard.color ?? '#10B981' }}
                />
                {shared.scheduledExpense.creditCard.name}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
            <span>Total: <strong className="text-red-400">{fmt(shared.scheduledExpense.amount)}</strong></span>
            <span>·</span>
            <span>{FREQ_LABEL[shared.scheduledExpense.frequency] ?? shared.scheduledExpense.frequency}</span>
            <span>·</span>
            <span>Día {shared.scheduledExpense.chargeDay}</span>
            <span>·</span>
            <span>{shared.members.length} invitado{shared.members.length !== 1 ? 's' : ''} ({accepted} aceptó)</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-text-muted">Tu parte</p>
            <p className="text-lg font-extrabold text-brand-green-light">{fmt(shared.costPerMember)}</p>
          </div>
          <button
            onClick={() => void onDelete(shared.id, shared.scheduledExpense.name)}
            className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Eliminar compartición"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-surface-elevated transition-all"
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-border p-5 space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3">Miembros invitados</p>
          {shared.members.length === 0 ? (
            <p className="text-text-muted text-sm">Sin miembros aún.</p>
          ) : (
            shared.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 bg-surface-base/50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{m.user?.name ?? m.email}</p>
                  {m.user?.name && <p className="text-xs text-text-muted">{m.email}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <StatusBadge status={m.status} />
                  <PaidBadge hasPaid={m.hasPaid} />
                  {m.status === 'ACCEPTED' && (
                    <button
                      onClick={() => onTogglePaid(m.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-elevated text-text-primary transition-all font-medium"
                    >
                      {m.hasPaid ? 'Desmarcar pago' : 'Marcar pagado'}
                    </button>
                  )}
                  <button
                    onClick={() => void onRemoveMember(m.id, m.email)}
                    className="p-1 rounded text-text-muted hover:text-red-400 transition-all"
                    title="Remover miembro"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function InvitedCard({ inv, onRespond, onTogglePaid }: {
  inv: MyInvitation;
  onRespond: (memberId: string, status: 'ACCEPTED' | 'DECLINED') => void;
  onTogglePaid: (memberId: string) => void;
}) {
  const sub = inv.sharedSubscription;
  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <p className="font-bold text-white text-lg">{sub.scheduledExpense.name}</p>
          {sub.scheduledExpense.creditCard && (
            <span className="flex items-center gap-1.5 text-xs text-text-secondary">
              <CreditCard size={12} />
              {sub.scheduledExpense.creditCard.name}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
          <span>Compartida por: <strong className="text-text-primary">{sub.owner.name ?? sub.owner.email}</strong></span>
          <span>·</span>
          <span>Total: <strong className="text-red-400">{fmt(sub.scheduledExpense.amount)}</strong></span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
        <div className="text-right">
          <p className="text-xs text-text-muted">Tu parte</p>
          <p className="text-lg font-extrabold text-brand-green-light">{fmt(inv.costPerMember)}</p>
        </div>
        <StatusBadge status={inv.status} />
        {inv.status === 'PENDING' && (
          <>
            <button
              onClick={() => onRespond(inv.id, 'ACCEPTED')}
              className="bg-brand-green hover:bg-brand-green text-white text-xs font-bold px-3 py-2 rounded-lg transition-all"
            >
              Aceptar
            </button>
            <button
              onClick={() => onRespond(inv.id, 'DECLINED')}
              className="bg-surface-elevated hover:bg-surface-elevated text-text-primary text-xs font-bold px-3 py-2 rounded-lg transition-all"
            >
              Rechazar
            </button>
          </>
        )}
        {inv.status === 'ACCEPTED' && (
          <>
            <PaidBadge hasPaid={inv.hasPaid} />
            <button
              onClick={() => onTogglePaid(inv.id)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-elevated text-text-primary transition-all font-medium"
            >
              {inv.hasPaid ? 'Desmarcar pago' : 'Marcar pagado'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SharedSubscriptions() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'mine' | 'invited'>('mine');
  const [mine, setMine] = useState<SharedSub[]>([]);
  const [invited, setInvited] = useState<MyInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mineRes, invitedRes] = await Promise.all([
        axios.get<SharedSub[]>(`${API}/shared-subscriptions/mine`, { headers: authHeaders() }),
        axios.get<MyInvitation[]>(`${API}/shared-subscriptions/invited`, { headers: authHeaders() }),
      ]);
      setMine(mineRes.data);
      setInvited(invitedRes.data);
    } catch {
      toast.error('No se pudieron cargar las suscripciones compartidas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la compartición de "${name}"? Los miembros ya no podrán verla.`)) return;
    try {
      await axios.delete(`${API}/shared-subscriptions/${id}`, { headers: authHeaders() });
      toast.success(`Compartición de "${name}" eliminada`);
      setMine((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error('Error al eliminar la compartición');
    }
  };

  const handleTogglePaid = async (memberId: string) => {
    try {
      await axios.patch(`${API}/shared-subscriptions/members/${memberId}/pay`, {}, { headers: authHeaders() });
      void fetchAll();
    } catch {
      toast.error('Error al actualizar el estado de pago');
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!confirm(`¿Remover a ${email} de esta suscripción compartida?`)) return;
    try {
      await axios.delete(`${API}/shared-subscriptions/members/${memberId}`, { headers: authHeaders() });
      toast.success(`${email} removido`);
      void fetchAll();
    } catch {
      toast.error('Error al remover el miembro');
    }
  };

  const handleRespond = async (memberId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      await axios.patch(
        `${API}/shared-subscriptions/members/${memberId}/respond`,
        { status },
        { headers: authHeaders() },
      );
      toast.success(status === 'ACCEPTED' ? 'Invitación aceptada' : 'Invitación rechazada');
      void fetchAll();
    } catch {
      toast.error('Error al responder la invitación');
    }
  };

  const tabCls = (active: boolean) =>
    `px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
      active ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'bg-surface-card text-text-secondary hover:text-white'
    }`;

  return (
    <div className="p-8 text-white font-sans max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/subscriptions')}
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Volver a Suscripciones
        </button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-green-light flex items-center gap-3">
            <Users size={30} />
            Suscripciones Compartidas
          </h1>
          <p className="text-text-secondary mt-1 text-sm">Gestiona gastos recurrentes divididos con tu familia o amigos</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button className={tabCls(tab === 'mine')} onClick={() => setTab('mine')}>
          Compartidas por mí {mine.length > 0 && <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{mine.length}</span>}
        </button>
        <button className={tabCls(tab === 'invited')} onClick={() => setTab('invited')}>
          Compartidas conmigo {invited.length > 0 && <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{invited.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-text-secondary gap-2">
          <RefreshCw size={18} className="animate-spin" /> Cargando...
        </div>
      ) : tab === 'mine' ? (
        mine.length === 0 ? (
          <div className="text-center py-20 text-text-muted bg-surface-card/50 rounded-2xl border border-surface-border">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-semibold text-text-secondary">Aún no compartes ninguna suscripción</p>
            <p className="text-sm mt-1">Ve a Suscripciones y usa el botón <strong className="text-brand-green-light">Compartir</strong> en cualquier servicio.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mine.map((s) => (
              <MySharedCard
                key={s.id}
                shared={s}
                onDelete={handleDelete}
                onTogglePaid={handleTogglePaid}
                onRemoveMember={handleRemoveMember}
              />
            ))}
          </div>
        )
      ) : (
        invited.length === 0 ? (
          <div className="text-center py-20 text-text-muted bg-surface-card/50 rounded-2xl border border-surface-border">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-semibold text-text-secondary">No tienes invitaciones de suscripciones</p>
            <p className="text-sm mt-1">Cuando alguien comparta una suscripción contigo, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invited.map((inv) => (
              <InvitedCard
                key={inv.id}
                inv={inv}
                onRespond={handleRespond}
                onTogglePaid={handleTogglePaid}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
