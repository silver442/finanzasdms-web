/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, CalendarClock, Trash2, Pencil, RefreshCw, X, Users, Share2 } from 'lucide-react';

interface CardRef {
  name: string;
  color?: string;
}

interface SharedMember {
  id: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  hasPaid: boolean;
  user: { name: string | null; email: string } | null;
}

interface SharedInfo {
  id: string;
  members: SharedMember[];
  costPerMember: number;
}

interface Sub {
  id: string;
  name: string;
  amount: number | string;
  frequency: 'MONTHLY' | 'BIMONTHLY' | 'YEARLY';
  chargeDay: number;
  creditCard?: CardRef;
  creditCardId?: string;
  sharedSubscription?: SharedInfo | null;
}

interface CardOption {
  id: string;
  name: string;
  color?: string;
}

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

const EMPTY_FORM = { name: '', amount: '', frequency: 'MONTHLY', chargeDay: '', creditCardId: '' };

const inputCls = 'w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600';
const labelCls = 'block text-slate-400 text-sm font-medium mb-1';

// SubForm fuera del componente padre para evitar desmontaje en cada render
function SubForm({ values, onChange, onSubmit, onCancel, saving, title, icon, cards }: {
  values: typeof EMPTY_FORM;
  onChange: (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  title: string;
  icon: React.ReactNode;
  cards: CardOption[];
}) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-[95%] md:max-w-lg max-h-[85vh] flex flex-col">
      <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-700 shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-white"><X size={20} /></button>
      </div>
      <form onSubmit={e => void onSubmit(e)} className="overflow-y-auto flex-1 p-4 md:p-6 space-y-4">
        <div>
          <label className={labelCls}>Nombre del servicio *</label>
          <input type="text" required placeholder="Ej. Netflix, Spotify, Gimnasio" value={values.name} onChange={onChange('name')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Monto (MXN) *</label>
          <input type="number" required min="0.01" step="0.01" placeholder="0.00" value={values.amount} onChange={onChange('amount')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Frecuencia *</label>
          <select value={values.frequency} onChange={onChange('frequency')} className={inputCls}>
            <option value="MONTHLY">Mensual</option>
            <option value="BIMONTHLY">Bimestral</option>
            <option value="YEARLY">Anual</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Día de cobro (1–31) *</label>
          <input type="number" required min="1" max="31" step="1" placeholder="Ej. 15" value={values.chargeDay} onChange={onChange('chargeDay')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Tarjeta vinculada (opcional)</label>
          <select value={values.creditCardId} onChange={onChange('creditCardId')} className={inputCls}>
            <option value="">Sin tarjeta vinculada</option>
            {cards.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition-all font-medium">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl transition-all font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><RefreshCw size={15} className="animate-spin" /> Guardando...</> : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Subscriptions() {
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [cards, setCards] = useState<CardOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [editTarget, setEditTarget] = useState<Sub | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal de compartir
  const [shareTarget, setShareTarget] = useState<Sub | null>(null);
  const [shareEmailInput, setShareEmailInput] = useState('');
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [isSharingNew, setIsSharingNew] = useState(false);

  const fetchSubs = useCallback(async () => {
    try {
      const [subsRes, sharedRes] = await Promise.all([
        axios.get<Sub[]>(`${API}/scheduled-expenses`, { headers: authHeaders() }),
        axios.get<{ id: string; scheduledExpenseId: string; members: SharedMember[]; costPerMember: number }[]>(
          `${API}/shared-subscriptions/mine`, { headers: authHeaders() }
        ).catch(() => ({ data: [] })),
      ]);
      const sharedMap = new Map(
        sharedRes.data.map((s) => [s.scheduledExpenseId, { id: s.id, members: s.members, costPerMember: s.costPerMember }])
      );
      setSubs(subsRes.data.map((s) => ({ ...s, sharedSubscription: sharedMap.get(s.id) ?? null })));
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

  const set = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const setEdit = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setEditForm(prev => ({ ...prev, [key]: e.target.value }));

  const openEdit = (sub: Sub) => {
    setEditTarget(sub);
    setEditForm({
      name: sub.name,
      amount: String(Number(sub.amount)),
      frequency: sub.frequency,
      chargeDay: String(sub.chargeDay),
      creditCardId: sub.creditCardId ?? '',
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const chargeDay = parseInt(form.chargeDay);
    if (chargeDay < 1 || chargeDay > 31) { toast.error('El día de cobro debe ser entre 1 y 31'); return; }
    setIsSaving(true);
    try {
      await axios.post(
        `${API}/scheduled-expenses`,
        {
          name: form.name,
          amount: parseFloat(form.amount),
          frequency: form.frequency,
          chargeDay,
          ...(form.creditCardId ? { creditCardId: form.creditCardId } : {}),
        },
        { headers: authHeaders() },
      );
      toast.success(`${form.name} agregada`);
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      void fetchSubs();
    } catch {
      toast.error('Error al guardar la suscripción');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsEditing(true);
    try {
      await axios.patch(
        `${API}/scheduled-expenses/${editTarget.id}`,
        {
          name: editForm.name || undefined,
          amount: editForm.amount ? parseFloat(editForm.amount) : undefined,
          frequency: editForm.frequency || undefined,
          chargeDay: editForm.chargeDay ? parseInt(editForm.chargeDay) : undefined,
          creditCardId: editForm.creditCardId || '',
        },
        { headers: authHeaders() },
      );
      toast.success('Suscripción actualizada');
      setEditTarget(null);
      void fetchSubs();
    } catch {
      toast.error('Error al actualizar la suscripción');
    } finally {
      setIsEditing(false);
    }
  };

  const openShare = (sub: Sub) => {
    setShareTarget(sub);
    setShareEmails([]);
    setShareEmailInput('');
  };

  const addShareEmail = () => {
    const email = shareEmailInput.trim().toLowerCase();
    if (!email.includes('@')) { toast.error('Email no válido'); return; }
    if (shareEmails.includes(email)) { toast.error('Email ya agregado'); return; }
    setShareEmails((prev) => [...prev, email]);
    setShareEmailInput('');
  };

  const handleShare = async () => {
    if (!shareTarget) return;
    if (shareEmails.length === 0) { toast.error('Agrega al menos un email'); return; }
    setIsSharingNew(true);
    try {
      if (shareTarget.sharedSubscription) {
        await axios.post(
          `${API}/shared-subscriptions/${shareTarget.sharedSubscription.id}/members`,
          { emails: shareEmails },
          { headers: authHeaders() },
        );
        toast.success('Miembros agregados');
      } else {
        await axios.post(
          `${API}/shared-subscriptions`,
          { scheduledExpenseId: shareTarget.id, emails: shareEmails },
          { headers: authHeaders() },
        );
        toast.success(`"${shareTarget.name}" ahora está compartida`);
      }
      setShareTarget(null);
      void fetchSubs();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al compartir la suscripción');
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
      setSubs(prev => prev.filter(s => s.id !== id));
    } catch {
      toast.error('Error al eliminar la suscripción');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 text-white font-sans max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-400 flex items-center gap-3">
            <CalendarClock size={32} />
            Suscripciones
          </h1>
          <p className="text-slate-400 mt-2">Gastos recurrentes vinculados a tus tarjetas de crédito</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate('/subscriptions/shared')}
            className="flex-1 md:flex-none bg-slate-700 hover:bg-slate-600 text-slate-200 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Users size={18} />
            Compartidas
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Nueva
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-400 gap-2">
          <RefreshCw size={18} className="animate-spin" /> Cargando suscripciones...
        </div>
      ) : subs.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700">
          <CalendarClock size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold text-slate-400">Sin suscripciones registradas</p>
          <p className="text-sm mt-1">Agrega tus servicios recurrentes como Netflix, Spotify, gimnasio, etc.</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                  <th className="px-5 py-4 font-semibold">Servicio</th>
                  <th className="px-5 py-4 font-semibold text-right">Monto</th>
                  <th className="px-5 py-4 font-semibold text-center">Frecuencia</th>
                  <th className="px-5 py-4 font-semibold text-center">Día de Cobro</th>
                  <th className="px-5 py-4 font-semibold">Tarjeta</th>
                  <th className="px-5 py-4 font-semibold text-center">Compartida</th>
                  <th className="px-5 py-4 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {subs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4 font-semibold text-white">{sub.name}</td>
                    <td className="px-5 py-4 text-right font-bold text-red-400">{fmt(sub.amount)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
                        {FREQ_LABEL[sub.frequency] ?? sub.frequency}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-300 font-medium">Día {sub.chargeDay}</td>
                    <td className="px-5 py-4">
                      {sub.creditCard ? (
                        <span className="flex items-center gap-2 text-sm text-slate-300">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: sub.creditCard.color ?? '#10B981' }}
                          />
                          {sub.creditCard.name}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {sub.sharedSubscription ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-violet-500/20 text-violet-400">
                          <Users size={11} /> {sub.sharedSubscription.members.length}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openShare(sub)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                          title="Compartir suscripción"
                        >
                          <Share2 size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(sub)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                          title="Editar suscripción"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => void handleDelete(sub.id, sub.name)}
                          disabled={deletingId === sub.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                          title="Eliminar suscripción"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <SubForm
            values={form}
            onChange={set}
            onSubmit={handleAdd}
            onCancel={() => { setIsModalOpen(false); setForm(EMPTY_FORM); }}
            saving={isSaving}
            title="Nueva Suscripción"
            icon={<CalendarClock className="text-emerald-500" size={20} />}
            cards={cards}
          />
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <SubForm
            values={editForm}
            onChange={setEdit}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            saving={isEditing}
            title="Editar Suscripción"
            icon={<Pencil className="text-sky-400" size={18} />}
            cards={cards}
          />
        </div>
      )}

      {shareTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-[95%] md:max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-700 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Share2 className="text-violet-400" size={20} />
                  Compartir &quot;{shareTarget.name}&quot;
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Monto total: <strong className="text-red-400">{fmt(shareTarget.amount)}</strong> · {FREQ_LABEL[shareTarget.frequency] ?? shareTarget.frequency}
                </p>
              </div>
              <button onClick={() => setShareTarget(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 md:p-6 space-y-5">
              <div>
                <label className={labelCls}>Agregar miembro por email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={shareEmailInput}
                    onChange={(e) => setShareEmailInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addShareEmail(); } }}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={addShareEmail}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-medium transition-all shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {shareEmails.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Por invitar</p>
                  <div className="space-y-2">
                    {shareEmails.map((email) => (
                      <div key={email} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-2.5">
                        <span className="text-sm text-slate-300">{email}</span>
                        <button onClick={() => setShareEmails((prev) => prev.filter((e) => e !== email))} className="text-slate-600 hover:text-red-400 transition-all">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {shareTarget.sharedSubscription && shareTarget.sharedSubscription.members.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Miembros actuales</p>
                  <div className="space-y-2">
                    {shareTarget.sharedSubscription.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-2.5">
                        <span className="text-sm text-slate-300">{m.user?.name ?? m.email}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          m.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' :
                          m.status === 'DECLINED' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>{m.status === 'ACCEPTED' ? 'Aceptó' : m.status === 'DECLINED' ? 'Rechazó' : 'Pendiente'}</span>
                      </div>
                    ))}
                  </div>
                  {shareTarget.sharedSubscription.members.filter((m) => m.status === 'ACCEPTED').length > 0 && (
                    <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                      <p className="text-sm text-emerald-400 font-semibold">
                        Costo por persona: {fmt(shareTarget.sharedSubscription.costPerMember)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tú + {shareTarget.sharedSubscription.members.filter((m) => m.status === 'ACCEPTED').length} miembro(s) aceptaron
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-4 md:p-6 border-t border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setShareTarget(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleShare()}
                disabled={isSharingNew || shareEmails.length === 0}
                className="flex-1 bg-violet-500 hover:bg-violet-400 text-white py-3 rounded-xl transition-all font-bold shadow-lg shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
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
