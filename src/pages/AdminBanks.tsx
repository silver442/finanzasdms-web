/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Landmark, Plus, Pencil, Trash2, X, Check, RefreshCw } from 'lucide-react';

interface AdminBank {
  id: string;
  bankName: string;
  clabe: string;
  accountHolder: string;
}

const EMPTY = { bankName: '', clabe: '', accountHolder: '' };
const API = 'http://localhost:3000';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

export default function AdminBanks() {
  const [banks, setBanks] = useState<AdminBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY);
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<AdminBank | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBanks = useCallback(async () => {
    try {
      const { data } = await axios.get<AdminBank[]>(`${API}/admin-banks`);
      setBanks(data);
    } catch {
      toast.error('No se pudieron cargar los bancos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchBanks(); }, [fetchBanks]);

  const handleCreate = async () => {
    if (!createForm.bankName || !createForm.clabe || !createForm.accountHolder) {
      toast.error('Completa todos los campos');
      return;
    }
    setIsCreating(true);
    try {
      await axios.post(`${API}/admin-banks`, createForm, { headers: authHeaders() });
      toast.success('Banco agregado');
      setCreateForm(EMPTY);
      setShowCreate(false);
      await fetchBanks();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al agregar banco');
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (bank: AdminBank) => {
    setEditId(bank.id);
    setEditForm({ bankName: bank.bankName, clabe: bank.clabe, accountHolder: bank.accountHolder });
  };

  const handleSave = async () => {
    if (!editId) return;
    setIsSaving(true);
    try {
      await axios.patch(`${API}/admin-banks/${editId}`, editForm, { headers: authHeaders() });
      toast.success('Banco actualizado');
      setEditId(null);
      await fetchBanks();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API}/admin-banks/${deleteTarget.id}`, { headers: authHeaders() });
      toast.success('Banco eliminado');
      setDeleteTarget(null);
      await fetchBanks();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const inputCls = 'bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full placeholder:text-slate-600';

  return (
    <div className="p-8 text-white font-sans max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 flex items-center gap-3">
            <Landmark size={32} />
            Bancos del Administrador
          </h1>
          <p className="text-slate-400 mt-2">Cuentas bancarias mostradas a los usuarios en el modal de pago</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} />
          Agregar Banco
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-400">Cargando bancos...</div>
      ) : banks.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Landmark size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay bancos registrados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banks.map(bank => (
            <div key={bank.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              {editId === bank.id ? (
                /* Edit mode */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">Banco</label>
                    <input value={editForm.bankName} onChange={e => setEditForm(f => ({ ...f, bankName: e.target.value }))} className={inputCls} placeholder="Santander" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">CLABE</label>
                    <input value={editForm.clabe} onChange={e => setEditForm(f => ({ ...f, clabe: e.target.value }))} className={inputCls} placeholder="18 dígitos" maxLength={18} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">Titular</label>
                    <input value={editForm.accountHolder} onChange={e => setEditForm(f => ({ ...f, accountHolder: e.target.value }))} className={inputCls} placeholder="Tu nombre" />
                  </div>
                  <div className="sm:col-span-3 flex gap-2 justify-end">
                    <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white text-sm transition-colors">
                      Cancelar
                    </button>
                    <button onClick={() => void handleSave()} disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-50 transition-colors">
                      {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-center justify-between gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-0.5">Banco</p>
                      <p className="text-white font-bold">{bank.bankName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-0.5">CLABE</p>
                      <p className="text-white font-mono tracking-wider text-sm">{bank.clabe}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-0.5">Titular</p>
                      <p className="text-white">{bank.accountHolder}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(bank)}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteTarget(bank)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-emerald-400" /> Agregar Banco
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-1">Nombre del Banco</label>
                <input value={createForm.bankName} onChange={e => setCreateForm(f => ({ ...f, bankName: e.target.value }))} className={inputCls} placeholder="Ej. Santander" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-1">CLABE Interbancaria (18 dígitos)</label>
                <input value={createForm.clabe} onChange={e => setCreateForm(f => ({ ...f, clabe: e.target.value }))} className={inputCls} placeholder="014180000000000000" maxLength={18} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-1">Titular de la Cuenta</label>
                <input value={createForm.accountHolder} onChange={e => setCreateForm(f => ({ ...f, accountHolder: e.target.value }))} className={inputCls} placeholder="Tu nombre completo" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors">Cancelar</button>
              <button onClick={() => void handleCreate()} disabled={isCreating}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50">
                {isCreating ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 size={36} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar banco?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Se eliminará <strong className="text-white">{deleteTarget.bankName}</strong> ({deleteTarget.accountHolder})
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={() => void handleDelete()} disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50">
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
