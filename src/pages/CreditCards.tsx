import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Plus, CreditCard, Calendar, DollarSign,
  Trash2, RefreshCw, Pencil, CheckCircle2, AlertCircle, X,
} from 'lucide-react';

interface CreditCardItem {
  id: string;
  name: string;
  color?: string;
  creditLimit: number | string;
  cutoffDay: number;
  currentBalance: number | string;
  nextCutoffDate: string;
  paymentDeadline: string;
  createdAt: string;
}

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function fmt(v: number | string) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function debtColor(current: number | string, limit: number | string) {
  const pct = Number(limit) > 0 ? (Number(current) / Number(limit)) * 100 : 0;
  if (pct < 30)  return { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Saludable', bar: 'bg-emerald-400' };
  if (pct <= 70) return { dot: 'bg-amber-400',   text: 'text-amber-400',   label: 'Moderado',  bar: 'bg-amber-400'   };
  return           { dot: 'bg-red-400',     text: 'text-red-400',     label: 'Alto',      bar: 'bg-red-400'     };
}

const PALETTE = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

const EMPTY_FORM = { name: '', creditLimit: '', cutoffDay: '', initialDebt: '', color: '#10B981' };
const EMPTY_EDIT = { name: '', creditLimit: '', cutoffDay: '', color: '#10B981' };

export default function CreditCards() {
  const [cards, setCards] = useState<CreditCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal agregar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Modal editar
  const [editTarget, setEditTarget] = useState<CreditCardItem | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [isEditing, setIsEditing] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      const { data } = await axios.get<CreditCardItem[]>(`${API}/credit-cards`, { headers: authHeaders() });
      setCards(data);
    } catch {
      toast.error('No se pudieron cargar las tarjetas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchCards(); }, [fetchCards]);

  const set = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const setEdit = (key: keyof typeof EMPTY_EDIT) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setEditForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const cutoffDay = parseInt(form.cutoffDay);
    if (cutoffDay < 1 || cutoffDay > 31) { toast.error('El día de corte debe ser entre 1 y 31'); return; }
    setIsSaving(true);
    try {
      await axios.post(
        `${API}/credit-cards`,
        {
          name: form.name,
          color: form.color,
          creditLimit: parseFloat(form.creditLimit),
          cutoffDay,
          isExistingCard: isExisting,
          ...(isExisting && form.initialDebt ? { initialDebt: parseFloat(form.initialDebt) } : {}),
        },
        { headers: authHeaders() },
      );
      toast.success(`${form.name} agregada al panel de créditos`);
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      setIsExisting(false);
      void fetchCards();
    } catch {
      toast.error('Error al guardar la tarjeta');
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (card: CreditCardItem) => {
    setEditTarget(card);
    setEditForm({
      name: card.name,
      creditLimit: String(Number(card.creditLimit)),
      cutoffDay: String(card.cutoffDay),
      color: card.color ?? '#10B981',
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const payload: Record<string, string | number> = {};
    if (editForm.name && editForm.name !== editTarget.name) payload.name = editForm.name;
    if (editForm.color && editForm.color !== (editTarget.color ?? '#10B981')) payload.color = editForm.color;
    if (editForm.creditLimit) payload.creditLimit = parseFloat(editForm.creditLimit);
    if (editForm.cutoffDay) payload.cutoffDay = parseInt(editForm.cutoffDay);
    if (Object.keys(payload).length === 0) { setEditTarget(null); return; }

    setIsEditing(true);
    try {
      await axios.patch(`${API}/credit-cards/${editTarget.id}`, payload, { headers: authHeaders() });
      toast.success('Tarjeta actualizada');
      setEditTarget(null);
      void fetchCards();
    } catch {
      toast.error('Error al actualizar la tarjeta');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la tarjeta "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API}/credit-cards/${id}`, { headers: authHeaders() });
      toast.success(`${name} eliminada`);
      setCards(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Error al eliminar la tarjeta');
    } finally {
      setDeletingId(null);
    }
  };

  const totalDebt = cards.reduce((acc, c) => acc + Number(c.currentBalance), 0);

  const inputCls = 'w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600';
  const labelCls = 'block text-slate-400 text-sm font-medium mb-1';

  return (
    <div className="p-8 text-white font-sans max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 flex items-center gap-3">
            <CreditCard size={32} />
            Tarjetas de Crédito
          </h1>
          <p className="text-slate-400 mt-2">Seguimiento de cortes, límites y saldo utilizado</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Tarjeta
        </button>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-400 gap-2">
          <RefreshCw size={18} className="animate-spin" /> Cargando tarjetas...
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700">
          <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold text-slate-400">Sin tarjetas registradas</p>
          <p className="text-sm mt-1">Agrega tu primera tarjeta de crédito para comenzar el seguimiento.</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                  <th className="px-5 py-4 font-semibold">Tarjeta</th>
                  <th className="px-5 py-4 font-semibold text-center">Día Corte</th>
                  <th className="px-5 py-4 font-semibold">Próx. Corte</th>
                  <th className="px-5 py-4 font-semibold">Límite de Pago</th>
                  <th className="px-5 py-4 font-semibold text-right">Saldo Utilizado</th>
                  <th className="px-5 py-4 font-semibold text-center">Uso</th>
                  <th className="px-5 py-4 font-semibold text-center">Estado</th>
                  <th className="px-5 py-4 font-semibold text-center w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {cards.map((card) => {
                  const color = debtColor(card.currentBalance, card.creditLimit);
                  const pct = Number(card.creditLimit) > 0
                    ? Math.round((Number(card.currentBalance) / Number(card.creditLimit)) * 100)
                    : 0;
                  const isPaid = Number(card.currentBalance) <= 0;
                  return (
                    <tr key={card.id} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-700/80 flex items-center justify-center shrink-0">
                            <CreditCard size={16} style={{ color: card.color ?? '#10B981' }} />
                          </div>
                          <div>
                            <Link
                              to={`/credit-cards/${card.id}`}
                              className="font-semibold text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                            >
                              {card.name}
                            </Link>
                            <p className="text-xs text-slate-500">Límite: {fmt(card.creditLimit)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 bg-slate-700 px-3 py-1 rounded-full text-sm font-bold text-slate-300">
                          <Calendar size={12} className="text-emerald-400" />
                          {card.cutoffDay}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300 text-sm">{fmtDate(card.nextCutoffDate)}</td>
                      <td className="px-5 py-4 text-slate-300 text-sm">{fmtDate(card.paymentDeadline)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />
                          <span className={`font-bold text-base ${color.text}`}>
                            {fmt(card.currentBalance)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-bold ${color.text}`}>{pct}%</span>
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${color.bar}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs ${color.text}`}>{color.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {isPaid
                          ? <CheckCircle2 size={22} className="text-emerald-500 mx-auto" />
                          : <AlertCircle  size={22} className="text-amber-400  mx-auto" />}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(card)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                            title="Editar tarjeta"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => void handleDelete(card.id, card.name)}
                            disabled={deletingId === card.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                            title="Eliminar tarjeta"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900/80 border-t border-slate-600">
                  <td colSpan={4} className="px-5 py-5 text-right font-bold text-slate-400 uppercase tracking-wider text-sm">
                    Total saldo utilizado:
                  </td>
                  <td className="px-5 py-5 text-right font-black text-red-400 text-xl">
                    {fmt(totalDebt)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Agregar Tarjeta ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="text-emerald-500" size={20} />
                Registrar Tarjeta
              </h2>
              <button onClick={() => { setIsModalOpen(false); setForm(EMPTY_FORM); setIsExisting(false); }} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={e => void handleAddCard(e)} className="p-6 space-y-4">
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                <button type="button" onClick={() => setIsExisting(false)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isExisting ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                  Tarjeta Nueva
                </button>
                <button type="button" onClick={() => setIsExisting(true)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isExisting ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                  Con Deuda Actual
                </button>
              </div>

              <div>
                <label className={labelCls}><span className="flex items-center gap-1.5"><CreditCard size={13} /> Nombre *</span></label>
                <input type="text" required placeholder="Ej. Nu, Hey Banco" value={form.name} onChange={set('name')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}><span className="flex items-center gap-1.5"><DollarSign size={13} /> Línea de Crédito *</span></label>
                <input type="number" required min="1" step="0.01" placeholder="0.00" value={form.creditLimit} onChange={set('creditLimit')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}><span className="flex items-center gap-1.5"><Calendar size={13} /> Día de Corte (1–31) *</span></label>
                <input type="number" required min="1" max="31" step="1" placeholder="Ej. 15" value={form.cutoffDay} onChange={set('cutoffDay')} className={inputCls} />
                <p className="text-xs text-slate-500 mt-1">La fecha límite de pago se calcula automáticamente (+20 días)</p>
              </div>
              {isExisting && (
                <div className="pt-1">
                  <label className={labelCls}><span className="flex items-center gap-1.5"><DollarSign size={13} /> Saldo actual al corte anterior *</span></label>
                  <input type="number" required min="0" step="0.01" placeholder="0.00" value={form.initialDebt} onChange={set('initialDebt')}
                    className="w-full bg-slate-900 border border-emerald-500/40 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600" />
                </div>
              )}
              <div>
                <label className={labelCls}>Color de tarjeta</label>
                <div className="flex gap-2">
                  {PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, color: c }))}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: form.color === c ? `3px solid white` : 'none', outlineOffset: '2px' }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); setForm(EMPTY_FORM); setIsExisting(false); }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl transition-all font-medium">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <><RefreshCw size={15} className="animate-spin" /> Guardando...</> : 'Guardar Tarjeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Tarjeta ── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Pencil className="text-sky-400" size={18} />
                Editar Tarjeta
              </h2>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={e => void handleEdit(e)} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Nombre</label>
                <input type="text" value={editForm.name} onChange={setEdit('name')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Línea de Crédito</label>
                <input type="number" min="1" step="0.01" value={editForm.creditLimit} onChange={setEdit('creditLimit')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Día de Corte (1–31)</label>
                <input type="number" min="1" max="31" step="1" value={editForm.cutoffDay} onChange={setEdit('cutoffDay')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Color de tarjeta</label>
                <div className="flex gap-2">
                  {PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, color: c }))}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: editForm.color === c ? `3px solid white` : 'none', outlineOffset: '2px' }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={isEditing}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isEditing ? <><RefreshCw size={15} className="animate-spin" /> Guardando...</> : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
