import { Fragment, useState } from 'react';
import {
  Check, CheckCircle2, ChevronDown, ChevronUp, Clock, Trash2, UserPlus, Users, XCircle,
} from 'lucide-react';
import { ServiceLogo } from './serviceBrand';
import {
  FREQ_LABEL, fmt, nextPaymentLabel,
  type MemberStatus, type SharedByMe, type SharedMember, type SharedWithMe,
} from './subscriptionUtils';

// ─── Insignias ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, { label: string; cls: string; Icon: typeof Clock }> = {
    PENDING:  { label: 'Pendiente', cls: 'bg-yellow-500/15 text-yellow-400', Icon: Clock },
    ACCEPTED: { label: 'Aceptó',    cls: 'bg-brand-green/15 text-brand-green-light', Icon: CheckCircle2 },
    DECLINED: { label: 'Rechazó',   cls: 'bg-red-500/15 text-red-400', Icon: XCircle },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  );
}

function PaidBadge({ hasPaid }: { hasPaid: boolean }) {
  return hasPaid ? (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 whitespace-nowrap">
      <CheckCircle2 size={12} /> Pagó
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-surface-elevated/60 text-text-secondary whitespace-nowrap">
      <Clock size={12} /> Sin pagar
    </span>
  );
}

const ghostBtn = 'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 text-text-primary hover:border-brand-green/40 hover:text-brand-green-light transition-all whitespace-nowrap';

function EmptyTab({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center py-16 px-6">
      <Users size={44} className="mx-auto mb-4 text-text-muted opacity-40" />
      <p className="text-lg font-semibold text-text-secondary">{title}</p>
      <p className="text-sm text-text-muted mt-1">{subtitle}</p>
    </div>
  );
}

// ─── Compartidas por mí ──────────────────────────────────────────────────────

interface SharedByMeProps {
  items: SharedByMe[];
  onAddMembers: (item: SharedByMe) => void;
  onStopSharing: (item: SharedByMe) => void;
  onTogglePaid: (memberId: string) => void;
  onRemoveMember: (member: SharedMember) => void;
}

function MemberList({ members, onTogglePaid, onRemoveMember }: {
  members: SharedMember[];
  onTogglePaid: (memberId: string) => void;
  onRemoveMember: (member: SharedMember) => void;
}) {
  if (members.length === 0) return <p className="text-text-muted text-sm">Sin miembros aún.</p>;
  return (
    <div className="flex flex-col gap-2">
      {members.map((m) => (
        <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-surface-base/50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-green/15 text-brand-green-light font-bold text-sm flex items-center justify-center shrink-0">
              {(m.user?.name ?? m.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{m.user?.name ?? m.email}</p>
              {m.user?.name && <p className="text-xs text-text-muted truncate">{m.email}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={m.status} />
            {m.status === 'ACCEPTED' && <PaidBadge hasPaid={m.hasPaid} />}
            {m.status === 'ACCEPTED' && (
              <button onClick={() => onTogglePaid(m.id)} className={ghostBtn}>
                {m.hasPaid ? 'Desmarcar pago' : <><Check size={13} /> Marcar pagado</>}
              </button>
            )}
            <button
              onClick={() => onRemoveMember(m)} aria-label={`Remover a ${m.email}`} title="Remover miembro"
              className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MembersSummary({ members }: { members: SharedMember[] }) {
  const accepted = members.filter((m) => m.status === 'ACCEPTED');
  const paid = accepted.filter((m) => m.hasPaid).length;
  return (
    <div className="flex flex-col">
      <span className="text-sm text-white font-medium">{accepted.length} de {members.length} aceptaron</span>
      {accepted.length > 0 && <span className="text-xs text-text-muted">{paid} de {accepted.length} pagaron</span>}
    </div>
  );
}

export function SharedByMeTable({ items, onAddMembers, onStopSharing, onTogglePaid, onRemoveMember }: SharedByMeProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  if (items.length === 0) {
    return <EmptyTab title="Aún no compartes ninguna suscripción" subtitle='Usa el botón "Compartir" en la pestaña Mis Suscripciones para dividir un gasto.' />;
  }

  const actions = (item: SharedByMe) => (
    <>
      <button onClick={() => onAddMembers(item)} className={ghostBtn}><UserPlus size={14} /> Invitar</button>
      <button
        onClick={() => onStopSharing(item)} title="Dejar de compartir" aria-label="Dejar de compartir"
        className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
      >
        <Trash2 size={15} />
      </button>
    </>
  );

  const expandBtn = (item: SharedByMe) => (
    <button
      onClick={() => toggle(item.id)} aria-expanded={expanded === item.id} aria-label="Ver miembros"
      className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-surface-elevated/60 transition-colors"
    >
      {expanded === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
  );

  return (
    <>
      {/* Tabla (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-text-secondary text-sm border-b border-surface-border">
              <th className="px-6 py-4 font-semibold">Servicio</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Tu parte</th>
              <th className="px-6 py-4 font-semibold">Miembros</th>
              <th className="px-6 py-4 font-semibold">Próximo Pago</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <Fragment key={item.id}>
                <tr className="border-b border-surface-border/60 hover:bg-surface-elevated/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-4">
                      <ServiceLogo name={item.scheduledExpense.name} />
                      <div>
                        <p className="font-medium text-white">{item.scheduledExpense.name}</p>
                        <p className="text-xs text-text-muted">{FREQ_LABEL[item.scheduledExpense.frequency]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-bold text-white">{fmt(item.scheduledExpense.amount)}</td>
                  <td className="px-6 py-3 font-bold text-brand-green-light">{fmt(item.costPerMember)}</td>
                  <td className="px-6 py-3"><MembersSummary members={item.members} /></td>
                  <td className="px-6 py-3 text-sm text-text-primary">{nextPaymentLabel(item.scheduledExpense.frequency, item.scheduledExpense.chargeDay)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1">{actions(item)}{expandBtn(item)}</div>
                  </td>
                </tr>
                {expanded === item.id && (
                  <tr className="border-b border-surface-border/60 bg-surface-base/30">
                    <td colSpan={6} className="px-6 py-4">
                      <MemberList members={item.members} onTogglePaid={onTogglePaid} onRemoveMember={onRemoveMember} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista (móvil) */}
      <div className="md:hidden divide-y divide-surface-border/60">
        {items.map((item) => (
          <div key={item.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <ServiceLogo name={item.scheduledExpense.name} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{item.scheduledExpense.name}</p>
                <p className="text-xs text-text-muted">Total {fmt(item.scheduledExpense.amount)} · Tu parte <span className="text-brand-green-light font-bold">{fmt(item.costPerMember)}</span></p>
              </div>
              {expandBtn(item)}
            </div>
            <div className="flex items-center justify-between gap-3">
              <MembersSummary members={item.members} />
              <div className="flex items-center gap-1">{actions(item)}</div>
            </div>
            {expanded === item.id && (
              <MemberList members={item.members} onTogglePaid={onTogglePaid} onRemoveMember={onRemoveMember} />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Compartidas conmigo ─────────────────────────────────────────────────────

interface SharedWithMeProps {
  items: SharedWithMe[];
  onRespond: (memberId: string, status: 'ACCEPTED' | 'DECLINED') => void;
  onTogglePaid: (memberId: string) => void;
}

export function SharedWithMeTable({ items, onRespond, onTogglePaid }: SharedWithMeProps) {
  if (items.length === 0) {
    return <EmptyTab title="No tienes suscripciones compartidas contigo" subtitle="Cuando alguien de Cashi comparta una suscripción contigo, aparecerá aquí." />;
  }

  const actions = (inv: SharedWithMe) => {
    if (inv.status === 'PENDING') {
      return (
        <>
          <button onClick={() => onRespond(inv.id, 'ACCEPTED')} className="bg-brand-green hover:bg-brand-green-light text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
            Aceptar
          </button>
          <button onClick={() => onRespond(inv.id, 'DECLINED')} className="bg-surface-elevated hover:bg-surface-elevated/70 text-text-primary text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
            Rechazar
          </button>
        </>
      );
    }
    if (inv.status === 'ACCEPTED') {
      return (
        <>
          <PaidBadge hasPaid={inv.hasPaid} />
          <button onClick={() => onTogglePaid(inv.id)} className={ghostBtn}>
            {inv.hasPaid ? 'Desmarcar pago' : <><Check size={13} /> Marcar pagado</>}
          </button>
        </>
      );
    }
    return null;
  };

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-text-secondary text-sm border-b border-surface-border">
              <th className="px-6 py-4 font-semibold">Servicio</th>
              <th className="px-6 py-4 font-semibold">Compartida por</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Tu parte</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/60">
            {items.map((inv) => {
              const exp = inv.sharedSubscription.scheduledExpense;
              const owner = inv.sharedSubscription.owner;
              return (
                <tr key={inv.id} className="hover:bg-surface-elevated/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-4">
                      <ServiceLogo name={exp.name} />
                      <div>
                        <p className="font-medium text-white">{exp.name}</p>
                        <p className="text-xs text-text-muted">{FREQ_LABEL[exp.frequency]} · {nextPaymentLabel(exp.frequency, exp.chargeDay)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-text-primary">{owner.name ?? owner.email}</td>
                  <td className="px-6 py-3 font-bold text-white">{fmt(exp.amount)}</td>
                  <td className="px-6 py-3 font-bold text-brand-green-light">{fmt(inv.costPerMember)}</td>
                  <td className="px-6 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-6 py-3"><div className="flex items-center justify-end gap-2">{actions(inv)}</div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-surface-border/60">
        {items.map((inv) => {
          const exp = inv.sharedSubscription.scheduledExpense;
          const owner = inv.sharedSubscription.owner;
          return (
            <div key={inv.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <ServiceLogo name={exp.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{exp.name}</p>
                  <p className="text-xs text-text-muted truncate">De {owner.name ?? owner.email}</p>
                </div>
                <StatusBadge status={inv.status} />
              </div>
              <p className="text-sm text-text-secondary">
                Total {fmt(exp.amount)} · Tu parte <span className="text-brand-green-light font-bold">{fmt(inv.costPerMember)}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2">{actions(inv)}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
