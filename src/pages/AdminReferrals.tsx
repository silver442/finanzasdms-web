import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { TrendingUp, Plus, Trash2, X, ExternalLink, Copy } from 'lucide-react';

interface ReferralCard {
  id: string;
  brand: string;
  title: string;
  description: string;
  code: string;
  link: string;
}

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const inputCls =
  'w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500';

const emptyForm = { brand: '', title: '', description: '', code: '', link: '' };

export default function AdminReferrals() {
  const [cards, setCards] = useState<ReferralCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ReferralCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      const { data } = await axios.get<ReferralCard[]>(`${API}/referral-cards`, { headers: authHeaders() });
      setCards(data);
    } catch {
      toast.error('No se pudieron cargar las tarjetas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchCards(); }, [fetchCards]);

  const handleCreate = async () => {
    const { brand, title, description, code, link } = createForm;
    if (!brand.trim() || !title.trim() || !description.trim() || !code.trim() || !link.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    setIsCreating(true);
    try {
      await axios.post(`${API}/referral-cards`, createForm, { headers: authHeaders() });
      toast.success('Tarjeta creada correctamente');
      setShowCreate(false);
      setCreateForm(emptyForm);
      void fetchCards();
    } catch {
      toast.error('Error al crear la tarjeta');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API}/referral-cards/${deleteTarget.id}`, { headers: authHeaders() });
      toast.success('Tarjeta eliminada');
      setDeleteTarget(null);
      void fetchCards();
    } catch {
      toast.error('Error al eliminar la tarjeta');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success('Código copiado');
  };

  return (
    <div className="p-8 text-white font-sans max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-amber-400 flex items-center gap-3">
            <TrendingUp size={30} />
            Tarjetas de Referidos
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Gestiona las tarjetas visibles en "Gana Dinero"</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateForm(emptyForm); }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} />
          Agregar Tarjeta
        </button>
      </div>

      {/* ── Lista ── */}
      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-400">Cargando tarjetas...</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay tarjetas de referidos. Crea la primera.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map(card => (
            <div key={card.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-start gap-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <span className="text-white font-extrabold text-base">{card.brand}</span>
                  <span className="text-slate-400 text-sm">{card.title}</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-3">{card.description}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => copyCode(card.code)}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span className="font-mono text-emerald-400 font-bold text-sm tracking-wider">{card.code}</span>
                    <Copy size={13} className="text-slate-400" />
                  </button>
                  <a
                    href={card.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 text-sm transition-colors truncate max-w-xs"
                  >
                    <ExternalLink size={13} />
                    <span className="truncate">{card.link}</span>
                  </a>
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(card)}
                className="shrink-0 flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 hover:border-red-500 px-3 py-2 rounded-lg font-semibold text-sm transition-all"
              >
                <Trash2 size={15} />
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Crear tarjeta ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" />
                Nueva Tarjeta de Referido
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-1.5">
                    Marca <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.brand}
                    onChange={e => setCreateForm(f => ({ ...f, brand: e.target.value }))}
                    className={inputCls}
                    placeholder="Ej: Bitso, Nu, Flink..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-1.5">
                    Título / Beneficio <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                    className={inputCls}
                    placeholder="Gana 8% APY en USDT"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 font-medium mb-1.5">
                  Descripción <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  className={`${inputCls} resize-none h-24`}
                  placeholder="Explica la ventaja para el usuario..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-1.5">
                    Código de Referido <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.code}
                    onChange={e => setCreateForm(f => ({ ...f, code: e.target.value }))}
                    className={inputCls}
                    placeholder="REFXXX123"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-1.5">
                    URL de la Plataforma <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={createForm.link}
                    onChange={e => setCreateForm(f => ({ ...f, link: e.target.value }))}
                    className={inputCls}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={isCreating}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Guardando...' : 'Crear Tarjeta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar eliminación ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Eliminar tarjeta</h3>
            <p className="text-slate-400 text-sm mb-6">
              ¿Seguro que deseas eliminar la tarjeta de{' '}
              <strong className="text-white">{deleteTarget.brand}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:text-white transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
