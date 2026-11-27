/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Plus, CalendarClock, CalendarDays, Trash2, Pencil, RefreshCw, X, Users,
  ArrowRight, LayoutGrid, MoreHorizontal, ShieldCheck, Share2, UserRoundCheck,
} from 'lucide-react';
import SubscriptionForm from './SubscriptionForm';
import HowSharingWorks from './HowSharingWorks';
import MemberPicker from './MemberPicker';
import { SharedByMeTable, SharedWithMeTable } from './SharedTables';
import ServiceLogo from '../../../components/ServiceLogo';
import {
  API, EMPTY_FORM, FREQ_LABEL, apiMessage, authHeaders, fmt, nextPaymentLabel,
  type PickedMember, type SharedByMe, type SharedMember, type SharedWithMe, type Sub, type SubFormValues,
} from './subscriptionUtils';

interface CardOption {
  id: string;
  name: string;
  color?: string;
}

// La lista, el formulario y la explicación comparten el mismo espacio: son "páginas internas" del módulo
type View = { kind: 'list' } | { kind: 'create' } | { kind: 'edit'; sub: Sub } | { kind: 'howItWorks' };

// Pestañas tipo hoja de cálculo; la activa vive en la URL (?tab=) para poder enlazarla
const TABS = [
  { id: 'mias',        label: 'Mis Suscripciones',   Icon: LayoutGrid },
  { id: 'compartidas', label: 'Compartidas por mí',  Icon: Share2 },
  { id: 'conmigo',     label: 'Compartidas conmigo', Icon: UserRoundCheck },
] as const;
type TabId = typeof TABS[number]['id'];

// Suscripción a la que se le invitan miembros (nueva compartición o una existente)
interface ShareTarget {
  scheduledExpenseId: string;
  name: string;
  amount: number | string;
  frequency: string;
  shared: { id: string; members: SharedMember[]; costPerMember: number } | null;
}

function ShareButton({ sub, onClick }: { sub: Sub; onClick: () => void }) {
  const members = sub.sharedSubscription?.members.length ?? 0;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 border border-white/10 bg-surface-base/40 hover:border-brand-green/40 hover:text-brand-green-light text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
    >
      <Users size={16} />
      {members > 0 ? `Compartida · ${members}` : 'Compartir'}
    </button>
  );
}

function NextPayment({ sub }: { sub: Sub }) {
  return (
    <span className="inline-flex items-center gap-2 text-text-primary text-sm">
      <CalendarDays size={16} className="text-text-muted shrink-0" />
      {nextPaymentLabel(sub.frequency, sub.chargeDay)}
    </span>
  );
}

// Menú "⋯" con posición fija para que la tabla (overflow-x-auto) no lo recorte
function RowMenu({ onEdit, onDelete, disabled }: { onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      if (e.type === 'mousedown' && (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node))) return;
      setPos(null);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) { setPos(null); return; }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  };

  const itemCls = 'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors';

  return (
    <>
      <button
        ref={btnRef} onClick={toggle} disabled={disabled} aria-label="Acciones" aria-expanded={pos !== null}
        className="w-9 h-9 rounded-full border border-white/10 text-text-secondary hover:text-white hover:bg-surface-elevated/60 flex items-center justify-center transition-colors disabled:opacity-40"
      >
        <MoreHorizontal size={18} />
      </button>
      {pos && (
        <div
          ref={menuRef}
          className="fixed z-40 w-40 bg-surface-elevated/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-1"
          style={{ top: pos.top, right: pos.right }}
        >
          <button onClick={() => { setPos(null); onEdit(); }} className={`${itemCls} text-text-primary hover:bg-white/5`}>
            <Pencil size={15} /> Editar
          </button>
          <button onClick={() => { setPos(null); onDelete(); }} className={`${itemCls} text-red-400 hover:bg-red-500/10`}>
            <Trash2 size={15} /> Eliminar
          </button>
        </div>
      )}
    </>
  );
}

function ShareBanner({ onLearnMore }: { onLearnMore: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-green/25 bg-gradient-to-r from-surface-card via-brand-green-dark/30 to-brand-green/40 p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6">
      <div className="absolute -right-20 -top-20 w-72 h-72 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex-1">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Comparte tus suscripciones</h2>
        <p className="text-text-secondary mt-1">Divide el costo de tus suscripciones con amigos, familiares o roomies.</p>
        <button
          onClick={onLearnMore}
          className="mt-4 inline-flex items-center gap-2 border border-brand-green/40 hover:bg-brand-green/10 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all"
        >
          Saber más <ArrowRight size={16} />
        </button>
      </div>
      <div className="relative hidden sm:flex items-center gap-4">
        <div className="-rotate-6"><ServiceLogo name="Netflix" size="lg" /></div>
        <div className="-translate-y-2"><ServiceLogo name="Spotify" size="lg" /></div>
        <div className="rotate-6"><ServiceLogo name="Prime Video" size="lg" /></div>
        <div className="w-20 h-20 rounded-full bg-brand-green/20 border border-brand-green/40 flex items-center justify-center ml-2">
          <Users size={36} className="text-brand-green-light" />
        </div>
      </div>
    </div>
  );
}

export default function Subscriptions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : 'mias';

  const [subs, setSubs] = useState<Sub[]>([]);
  const [sharedByMe, setSharedByMe] = useState<SharedByMe[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedWithMe[]>([]);
  const [cards, setCards] = useState<CardOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [view, setView] = useState<View>({ kind: 'list' });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Modal de compartir
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [shareMembers, setShareMembers] = useState<PickedMember[]>([]);
  const [isSharingNew, setIsSharingNew] = useState(false);

  const fetchSubs = useCallback(async () => {
    try {
      const [subsRes, mineRes, invitedRes] = await Promise.all([
        axios.get<Sub[]>(`${API}/scheduled-expenses`, { headers: authHeaders() }),
        axios.get<SharedByMe[]>(`${API}/shared-subscriptions/mine`, { headers: authHeaders() }).catch(() => ({ data: [] as SharedByMe[] })),
        axios.get<SharedWithMe[]>(`${API}/shared-subscriptions/invited`, { headers: authHeaders() }).catch(() => ({ data: [] as SharedWithMe[] })),
      ]);
      const sharedMap = new Map(
        mineRes.data.map((s) => [s.scheduledExpenseId, { id: s.id, members: s.members, costPerMember: s.costPerMember }])
      );
      setSubs(subsRes.data.map((s) => ({ ...s, sharedSubscription: sharedMap.get(s.id) ?? null })));
      setSharedByMe(mineRes.data);
      setSharedWithMe(invitedRes.data);
    } catch {
      toast.error('No se pudieron cargar las suscripciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCards = useCallback(async () => {
    try {
      const { data } = await axios.get<CardOption[]>(`${API}/credit-cards`, { headers: authHeaders() });
      setCards(data);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    void fetchSubs();
    void fetchCards();
  }, [fetchSubs, fetchCards]);

  // La campana puede aceptar/rechazar invitaciones mientras esta página está abierta
  useEffect(() => {
    const refresh = () => { void fetchSubs(); };
    window.addEventListener('shared-subscriptions-updated', refresh);
    return () => window.removeEventListener('shared-subscriptions-updated', refresh);
  }, [fetchSubs]);

  // Al cambiar de vista interna se vuelve al inicio del módulo (no en la carga inicial)
  const isFirstView = useRef(true);
  useEffect(() => {
    if (isFirstView.current) { isFirstView.current = false; return; }
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [view.kind]);

  const openView = (next: View) => setView(next);

  const selectTab = (id: TabId) => {
    setSearchParams(id === 'mias' ? {} : { tab: id }, { replace: true });
  };

  const handleSave = async (values: SubFormValues, emails: string[]) => {
    const chargeDay = parseInt(values.chargeDay);
    if (chargeDay < 1 || chargeDay > 31) { toast.error('El día de cobro debe ser entre 1 y 31'); return; }
    setIsSaving(true);
    try {
      if (view.kind === 'edit') {
        await axios.patch(
          `${API}/scheduled-expenses/${view.sub.id}`,
          {
            name: values.name || undefined,
            amount: values.amount ? parseFloat(values.amount) : undefined,
            frequency: values.frequency || undefined,
            chargeDay,
            creditCardId: values.creditCardId || '',
          },
          { headers: authHeaders() },
        );
        toast.success('Suscripción actualizada');
      } else {
        const { data: created } = await axios.post<{ id: string }>(
          `${API}/scheduled-expenses`,
          {
            name: values.name,
            amount: parseFloat(values.amount),
            frequency: values.frequency,
            chargeDay,
            ...(values.creditCardId ? { creditCardId: values.creditCardId } : {}),
          },
          { headers: authHeaders() },
        );
        toast.success(`${values.name} agregada`);
        if (emails.length > 0) {
          try {
            await axios.post(`${API}/shared-subscriptions`, { scheduledExpenseId: created.id, emails }, { headers: authHeaders() });
            toast.success(`"${values.name}" ahora está compartida`);
          } catch (e) {
            toast.error(apiMessage(e) ?? 'La suscripción se guardó, pero no se pudo compartir');
          }
        }
      }
      setView({ kind: 'list' });
      void fetchSubs();
    } catch {
      toast.error(view.kind === 'edit' ? 'Error al actualizar la suscripción' : 'Error al guardar la suscripción');
    } finally {
      setIsSaving(false);
    }
  };

  const openShare = (target: ShareTarget) => {
    setShareTarget(target);
    setShareMembers([]);
  };

  const shareFromSub = (sub: Sub) => openShare({
    scheduledExpenseId: sub.id, name: sub.name, amount: sub.amount, frequency: sub.frequency,
    shared: sub.sharedSubscription ?? null,
  });

  const shareFromShared = (item: SharedByMe) => openShare({
    scheduledExpenseId: item.scheduledExpenseId, name: item.scheduledExpense.name,
    amount: item.scheduledExpense.amount, frequency: item.scheduledExpense.frequency,
    shared: { id: item.id, members: item.members, costPerMember: item.costPerMember },
  });

  const handleShare = async () => {
    if (!shareTarget) return;
    if (shareMembers.length === 0) { toast.error('Agrega al menos un miembro'); return; }
    const emails = shareMembers.map((m) => m.email);
    setIsSharingNew(true);
    try {
      if (shareTarget.shared) {
        await axios.post(`${API}/shared-subscriptions/${shareTarget.shared.id}/members`, { emails }, { headers: authHeaders() });
        toast.success('Miembros invitados');
      } else {
        await axios.post(`${API}/shared-subscriptions`, { scheduledExpenseId: shareTarget.scheduledExpenseId, emails }, { headers: authHeaders() });
        toast.success(`"${shareTarget.name}" ahora está compartida`);
      }
      setShareTarget(null);
      void fetchSubs();
    } catch (e) {
      toast.error(apiMessage(e) ?? 'Error al compartir la suscripción');
    } finally {
      setIsSharingNew(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la suscripción "${name}"?`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API}/scheduled-expenses/${id}`, { headers: authHeaders() });
      toast.success(`${name} eliminada`);
      void fetchSubs();
    } catch {
      toast.error('Error al eliminar la suscripción');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStopSharing = async (item: SharedByMe) => {
    const name = item.scheduledExpense.name;
    if (!confirm(`¿Dejar de compartir "${name}"? Los miembros ya no podrán verla.`)) return;
    try {
      await axios.delete(`${API}/shared-subscriptions/${item.id}`, { headers: authHeaders() });
      toast.success(`Dejaste de compartir "${name}"`);
      void fetchSubs();
    } catch {
      toast.error('Error al dejar de compartir');
    }
  };

  const handleRemoveMember = async (member: SharedMember) => {
    const who = member.user?.name ?? member.email;
    if (!confirm(`¿Remover a ${who} de esta suscripción compartida?`)) return;
    try {
      await axios.delete(`${API}/shared-subscriptions/members/${member.id}`, { headers: authHeaders() });
      toast.success(`${who} removido`);
      void fetchSubs();
    } catch {
      toast.error('Error al remover el miembro');
    }
  };

  const handleTogglePaid = async (memberId: string) => {
    try {
      await axios.patch(`${API}/shared-subscriptions/members/${memberId}/pay`, {}, { headers: authHeaders() });
      void fetchSubs();
    } catch {
      toast.error('Error al actualizar el estado de pago');
    }
  };

  const handleRespond = async (memberId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      await axios.patch(`${API}/shared-subscriptions/members/${memberId}/respond`, { status }, { headers: authHeaders() });
      toast.success(status === 'ACCEPTED' ? 'Invitación aceptada' : 'Invitación rechazada');
      window.dispatchEvent(new Event('notifications-updated'));
      void fetchSubs();
    } catch {
      toast.error('Error al responder la invitación');
    }
  };

  const editValues = (sub: Sub): SubFormValues => ({
    name: sub.name,
    amount: String(Number(sub.amount)),
    frequency: sub.frequency,
    chargeDay: String(sub.chargeDay),
    creditCardId: sub.creditCardId ?? '',
  });

  const tabCount: Record<TabId, number> = {
    mias: subs.length,
    compartidas: sharedByMe.length,
    conmigo: sharedWithMe.length,
  };
  const pendingInvites = sharedWithMe.filter((i) => i.status === 'PENDING').length;

  const renderMine = () => subs.length === 0 ? (
    <div className="text-center py-16 px-6">
      <CalendarClock size={48} className="mx-auto mb-4 text-text-muted opacity-40" />
      <p className="text-lg font-semibold text-text-secondary">Sin suscripciones registradas</p>
      <p className="text-sm text-text-muted mt-1">Agrega tus servicios recurrentes como Netflix, Spotify, gimnasio, etc.</p>
      <button
        onClick={() => openView({ kind: 'create' })}
        className="mt-6 inline-flex items-center gap-2 bg-brand-green hover:bg-brand-green-light text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20"
      >
        <Plus size={18} /> Agregar la primera
      </button>
    </div>
  ) : (
    <>
      {/* Tabla (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-text-secondary text-sm border-b border-surface-border">
              <th className="px-6 py-4 font-semibold">Servicio</th>
              <th className="px-6 py-4 font-semibold">Monto</th>
              <th className="px-6 py-4 font-semibold">Frecuencia</th>
              <th className="px-6 py-4 font-semibold">Próximo Pago</th>
              <th className="px-6 py-4 font-semibold">Compartir</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/60">
            {subs.map((sub) => (
              <tr key={sub.id} className="hover:bg-surface-elevated/30 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-4">
                    <ServiceLogo name={sub.name} />
                    <div className="min-w-0">
                      <p className="font-medium text-white">{sub.name}</p>
                      {sub.creditCard && (
                        <p className="flex items-center gap-1.5 text-xs text-text-muted">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.creditCard.color ?? '#10B981' }} />
                          {sub.creditCard.name}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 font-bold text-white">{fmt(sub.amount)}</td>
                <td className="px-6 py-3">
                  <span className="bg-brand-green/15 text-brand-green-light text-xs font-bold px-3 py-1 rounded-full">
                    {FREQ_LABEL[sub.frequency] ?? sub.frequency}
                  </span>
                </td>
                <td className="px-6 py-3"><NextPayment sub={sub} /></td>
                <td className="px-6 py-3"><ShareButton sub={sub} onClick={() => shareFromSub(sub)} /></td>
                <td className="px-6 py-3">
                  <div className="flex justify-end">
                    <RowMenu
                      disabled={deletingId === sub.id}
                      onEdit={() => openView({ kind: 'edit', sub })}
                      onDelete={() => void handleDelete(sub.id, sub.name)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista (móvil) */}
      <div className="md:hidden divide-y divide-surface-border/60">
        {subs.map((sub) => (
          <div key={sub.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <ServiceLogo name={sub.name} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{sub.name}</p>
                <p className="font-bold text-white">{fmt(sub.amount)}</p>
              </div>
              <RowMenu
                disabled={deletingId === sub.id}
                onEdit={() => openView({ kind: 'edit', sub })}
                onDelete={() => void handleDelete(sub.id, sub.name)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-brand-green/15 text-brand-green-light text-xs font-bold px-3 py-1 rounded-full">
                {FREQ_LABEL[sub.frequency] ?? sub.frequency}
              </span>
              <NextPayment sub={sub} />
              <div className="ml-auto"><ShareButton sub={sub} onClick={() => shareFromSub(sub)} /></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const acceptedCount = shareTarget?.shared?.members.filter((m) => m.status === 'ACCEPTED').length ?? 0;

  return (
    <div ref={topRef} className="p-4 md:p-8 text-white font-sans max-w-6xl mx-auto flex flex-col gap-6 md:gap-8">
      {/* ── Encabezado del módulo (se mantiene en todas las vistas internas) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="bg-brand-green/10 border border-brand-green/25 rounded-2xl p-4 shrink-0 shadow-lg shadow-brand-green/10">
            <CalendarClock size={36} className="text-brand-green-light" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white">Suscripciones</h1>
            <p className="text-text-secondary mt-1">Gestiona tus suscripciones y controla tus gastos recurrentes</p>
          </div>
        </div>
        {view.kind === 'list' && (
          <button
            onClick={() => openView({ kind: 'create' })}
            className="bg-brand-green hover:bg-brand-green-light text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-2 shrink-0"
          >
            <Plus size={20} /> Nueva Suscripción
          </button>
        )}
      </div>

      {view.kind === 'create' || view.kind === 'edit' ? (
        <SubscriptionForm
          key={view.kind === 'edit' ? view.sub.id : 'create'}
          mode={view.kind}
          initialValues={view.kind === 'edit' ? editValues(view.sub) : EMPTY_FORM}
          cards={cards}
          saving={isSaving}
          onSubmit={(values, emails) => void handleSave(values, emails)}
          onCancel={() => setView({ kind: 'list' })}
        />
      ) : view.kind === 'howItWorks' ? (
        <HowSharingWorks
          onBack={() => setView({ kind: 'list' })}
          onStartSharing={() => { selectTab('mias'); openView(subs.length === 0 ? { kind: 'create' } : { kind: 'list' }); }}
        />
      ) : (
        <>
          <ShareBanner onLearnMore={() => openView({ kind: 'howItWorks' })} />

          {/* ── Pestañas tipo hoja de cálculo + tabla ── */}
          <div>
            <div role="tablist" aria-label="Vistas de suscripciones" className="flex gap-1 overflow-x-auto px-1 -mb-px relative z-10">
              {TABS.map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id} role="tab" aria-selected={active} onClick={() => selectTab(id)}
                    className={`inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-t-2xl text-sm font-semibold whitespace-nowrap border border-b-0 transition-colors ${
                      active
                        ? 'bg-surface-card text-white border-white/5 border-t-2 border-t-brand-green-light'
                        : 'bg-surface-base/60 text-text-secondary border-transparent hover:text-white hover:bg-surface-card/50'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-brand-green-light' : ''} />
                    {label}
                    {!isLoading && (
                      id === 'conmigo' && pendingInvites > 0 ? (
                        <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full" title="Invitaciones pendientes">
                          {pendingInvites} nueva{pendingInvites !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-brand-green/15 text-brand-green-light' : 'bg-white/5 text-text-muted'}`}>
                          {tabCount[id]}
                        </span>
                      )
                    )}
                  </button>
                );
              })}
            </div>

            <div role="tabpanel" className="bg-surface-card border border-white/5 rounded-3xl rounded-tl-none shadow-card overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center py-20 text-text-secondary gap-2">
                  <RefreshCw size={18} className="animate-spin" /> Cargando suscripciones...
                </div>
              ) : tab === 'mias' ? renderMine() : tab === 'compartidas' ? (
                <SharedByMeTable
                  items={sharedByMe}
                  onAddMembers={shareFromShared}
                  onStopSharing={(item) => void handleStopSharing(item)}
                  onTogglePaid={(id) => void handleTogglePaid(id)}
                  onRemoveMember={(m) => void handleRemoveMember(m)}
                />
              ) : (
                <SharedWithMeTable
                  items={sharedWithMe}
                  onRespond={(id, status) => void handleRespond(id, status)}
                  onTogglePaid={(id) => void handleTogglePaid(id)}
                />
              )}
            </div>
          </div>

          {/* ── Aviso de seguridad ── */}
          <div className="bg-surface-card/60 backdrop-blur-md rounded-3xl border border-white/5 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <ShieldCheck size={40} className="text-brand-green-light shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-white">Tus datos siempre seguros</p>
              <p className="text-text-secondary text-sm">Solo compartes con personas registradas en Cashi. Tú controlas quién tiene acceso y puede ver los detalles.</p>
            </div>
            <button
              onClick={() => openView({ kind: 'howItWorks' })}
              className="inline-flex items-center gap-1.5 text-brand-green-light hover:text-brand-green font-semibold text-sm shrink-0 transition-colors"
            >
              Conoce más <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}

      {shareTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card/95 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl w-full md:max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start gap-4 p-5 md:p-6 border-b border-surface-border shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <ServiceLogo name={shareTarget.name} />
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white truncate">Compartir "{shareTarget.name}"</h2>
                  <p className="text-text-secondary text-sm">
                    {fmt(shareTarget.amount)} · {FREQ_LABEL[shareTarget.frequency] ?? shareTarget.frequency}
                  </p>
                </div>
              </div>
              <button onClick={() => setShareTarget(null)} aria-label="Cerrar" className="text-text-secondary hover:text-white"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 md:p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-text-primary">Invitar a un miembro de Cashi</p>
                <p className="text-xs text-text-muted">Busca por correo. Solo puedes compartir con personas registradas en la plataforma.</p>
                <MemberPicker
                  members={shareMembers}
                  onChange={setShareMembers}
                  existingEmails={shareTarget.shared?.members.map((m) => m.email.toLowerCase()) ?? []}
                />
              </div>

              {shareTarget.shared && shareTarget.shared.members.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">Miembros actuales</p>
                  <div className="flex flex-col gap-2">
                    {shareTarget.shared.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between bg-surface-base/50 rounded-xl px-4 py-2.5">
                        <span className="text-sm text-text-primary truncate">{m.user?.name ?? m.email}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          m.status === 'ACCEPTED' ? 'bg-brand-green/20 text-brand-green-light' :
                          m.status === 'DECLINED' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>{m.status === 'ACCEPTED' ? 'Aceptó' : m.status === 'DECLINED' ? 'Rechazó' : 'Pendiente'}</span>
                      </div>
                    ))}
                  </div>
                  {acceptedCount > 0 && (
                    <div className="mt-3 bg-brand-green/10 border border-brand-green/20 rounded-xl px-4 py-3">
                      <p className="text-sm text-brand-green-light font-semibold">Costo por persona: {fmt(shareTarget.shared.costPerMember)}</p>
                      <p className="text-xs text-text-secondary mt-0.5">Tú + {acceptedCount} miembro(s) que aceptaron</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 md:p-6 border-t border-surface-border shrink-0">
              <button
                type="button" onClick={() => setShareTarget(null)}
                className="flex-1 bg-surface-elevated hover:bg-surface-elevated/70 text-white py-3 rounded-xl transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                type="button" onClick={() => void handleShare()} disabled={isSharingNew || shareMembers.length === 0}
                className="flex-1 bg-brand-green hover:bg-brand-green-light text-white py-3 rounded-xl transition-all font-bold shadow-lg shadow-brand-green/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSharingNew ? <><RefreshCw size={15} className="animate-spin" /> Guardando...</> : <><Users size={16} /> Compartir</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
