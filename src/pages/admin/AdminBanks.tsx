/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Landmark, Plus, Pencil, Trash2, X, Check, RefreshCw, Lock } from 'lucide-react';
import { isSuperAdminRole } from '../../utils/roles';

interface AdminBank {
  id: string;
  bankName: string;
  clabe: string;
  accountHolder: string;
  userId?: string;
  // Uso de las cuentas del SUPER_ADMIN (en las de rendimientos ambos son false)
  forClientPayments: boolean;
  forInvestorFunding: boolean;
  // Solo para SUPER_ADMIN (GET /admin-banks/manage)
  owner?: { id: string; email: string; name: string | null; role: string } | null;
}

const EMPTY = { bankName: '', clabe: '', accountHolder: '', forClientPayments: true, forInvestorFunding: false };
type BankForm = typeof EMPTY;

const PURPOSES = [
  { key: 'forClientPayments', label: 'Pagos de clientes', hint: 'Aparece en el modal de pago SPEI de los clientes' },
  { key: 'forInvestorFunding', label: 'Aportaciones de inversionistas', hint: 'Aparece al aportar a un préstamo, como destino de la transferencia' },
] as const;

// Checkboxes de uso (solo cuentas propias del SUPER_ADMIN)
function PurposeFields({ form, onChange }: { form: BankForm; onChange: (patch: Partial<BankForm>) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="block text-xs text-text-secondary mb-1 font-semibold uppercase">¿Quién la ve?</legend>
      {PURPOSES.map(p => (
        <label key={p.key} className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form[p.key]} onChange={e => onChange({ [p.key]: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-brand-green" />
          <span className="text-sm">
            <span className="text-text-primary font-medium">{p.label}</span>
            <span className="block text-xs text-text-muted">{p.hint}</span>
          </span>
        </label>
      ))}
      {!form.forClientPayments && !form.forInvestorFunding && (
        <p className="text-red-400 text-xs">Elige al menos un uso.</p>
      )}
    </fieldset>
  );
}

// Etiquetas "La ven: …" en cuentas del SUPER_ADMIN
function PurposeBadges({ bank }: { bank: AdminBank }) {
  if (!bank.forClientPayments && !bank.forInvestorFunding) {
    return <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-1 rounded-full">Nadie la ve</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-text-muted">La ven:</span>
      {bank.forClientPayments && <span className="bg-brand-green/20 text-brand-green-light text-xs font-bold px-2 py-1 rounded-full">Clientes</span>}
      {bank.forInvestorFunding && <span className="bg-sky-500/20 text-sky-300 text-xs font-bold px-2 py-1 rounded-full">Inversionistas</span>}
    </div>
  );
}
const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function getCurrentRole(): string | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? ((JSON.parse(raw) as { role?: string }).role ?? null) : null;
  } catch {
    return null;
  }
}

function getCurrentAdminId(): string | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export default function AdminBanks() {
  const [banks, setBanks] = useState<AdminBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdminId] = useState<string | null>(getCurrentAdminId);
  // SUPER_ADMIN: sus cuentas reciben los pagos SPEI de clientes. ADMIN: su cuenta recibe rendimientos.
  const [isSuperAdmin] = useState(() => isSuperAdminRole(getCurrentRole()));
  const ownBanks = isSuperAdmin ? banks.filter(b => b.userId === currentAdminId) : banks;
  const otherBanks = isSuperAdmin ? banks.filter(b => b.userId !== currentAdminId) : [];

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<BankForm>(EMPTY);
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BankForm>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<AdminBank | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBanks = useCallback(async () => {
    try {
      const { data } = await axios.get<AdminBank[]>(`${API}/admin-banks/manage`, { headers: authHeaders() });
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
    if (isSuperAdmin && !createForm.forClientPayments && !createForm.forInvestorFunding) {
      toast.error('Elige quién verá la cuenta');
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
    setEditForm({
      bankName: bank.bankName, clabe: bank.clabe, accountHolder: bank.accountHolder,
      forClientPayments: bank.forClientPayments, forInvestorFunding: bank.forInvestorFunding,
    });
  };

  const isOwnSuperAdminBank = (id: string) =>
    isSuperAdmin && banks.some(b => b.id === id && b.userId === currentAdminId);

  const handleSave = async () => {
    if (!editId) return;
    if (isOwnSuperAdminBank(editId) && !editForm.forClientPayments && !editForm.forInvestorFunding) {
      toast.error('Elige quién verá la cuenta');
      return;
    }
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

  const renderBank = (bank: AdminBank, showOwner: boolean) => (
    <div key={bank.id} className="bg-surface-card border border-surface-border rounded-2xl p-5">
      {editId === bank.id ? (
        /* Edit mode */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-text-secondary mb-1 font-semibold uppercase">Banco</label>
            <input value={editForm.bankName} onChange={e => setEditForm(f => ({ ...f, bankName: e.target.value }))} className={inputCls} placeholder="Santander" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1 font-semibold uppercase">CLABE</label>
            <input value={editForm.clabe} onChange={e => setEditForm(f => ({ ...f, clabe: e.target.value }))} className={inputCls} placeholder="18 dígitos" maxLength={18} />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1 font-semibold uppercase">Titular</label>
            <input value={editForm.accountHolder} onChange={e => setEditForm(f => ({ ...f, accountHolder: e.target.value }))} className={inputCls} placeholder="Tu nombre" />
          </div>
          {isOwnSuperAdminBank(bank.id) && (
            <div className="sm:col-span-3">
              <PurposeFields form={editForm} onChange={patch => setEditForm(f => ({ ...f, ...patch }))} />
            </div>
          )}
          <div className="sm:col-span-3 flex gap-2 justify-end">
            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-lg border border-surface-border text-text-primary hover:text-white text-sm transition-colors">
              Cancelar
            </button>
            <button onClick={() => void handleSave()} disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-green hover:bg-brand-green-light text-white text-sm font-bold disabled:opacity-50 transition-colors">
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Guardar
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-text-muted uppercase font-semibold mb-0.5">Banco</p>
              <p className="text-white font-bold">{bank.bankName}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-semibold mb-0.5">CLABE</p>
              <p className="text-white font-mono tracking-wider text-sm">{bank.clabe}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-semibold mb-0.5">Titular</p>
              <p className="text-white">{bank.accountHolder}</p>
              {showOwner && (
                <p className="text-text-muted text-xs mt-0.5">
                  Dueño: {bank.owner ? `${bank.owner.name ?? bank.owner.email} · ${bank.owner.role === 'INVESTOR' ? 'Inversionista' : bank.owner.role === 'ADMIN' ? 'Admin' : bank.owner.role}` : 'Sin dueño'}
                </p>
              )}
            </div>
          </div>
          {isOwnSuperAdminBank(bank.id) && <PurposeBadges bank={bank} />}
          </div>
          {(isSuperAdmin || bank.userId === currentAdminId) && (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => startEdit(bank)}
                className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-elevated text-text-primary hover:text-white transition-colors">
                <Pencil size={15} />
              </button>
              <button onClick={() => setDeleteTarget(bank)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const inputCls = 'bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors w-full placeholder:text-text-muted';

  return (
    <div className="p-4 sm:p-8 text-white font-sans max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-green-light flex items-center gap-3">
            <Landmark size={32} />
            {isSuperAdmin ? 'Cuentas para recibir pagos' : 'Mi cuenta para recibir rendimientos'}
          </h1>
          <p className="text-text-secondary mt-2">
            {isSuperAdmin
              ? 'Elige en cada cuenta si la ven los clientes (pago SPEI), los inversionistas (aportaciones) o ambos.'
              : 'Aquí recibes tu parte de los préstamos que fondeas. Los clientes nunca la ven.'}
          </p>
          {!isSuperAdmin && (
            <p className="flex items-center gap-1.5 text-text-muted text-xs mt-2">
              <Lock size={12} /> Solo visible para ti y el SuperAdmin
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-light text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20"
        >
          <Plus size={18} />
          {isSuperAdmin ? 'Agregar Banco' : 'Agregar cuenta'}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20 text-text-secondary">Cargando bancos...</div>
      ) : banks.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Landmark size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay bancos registrados.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-3">
            {isSuperAdmin && <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Mis cuentas · pagos y aportaciones</h2>}
            {ownBanks.length === 0
              ? <p className="text-text-muted text-sm">Aún no registras una cuenta propia.</p>
              : ownBanks.map(bank => renderBank(bank, false))}
          </div>
          {otherBanks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Cuentas de rendimientos · admins e inversionistas</h2>
              <p className="text-text-muted text-xs">No se muestran a los clientes; son el destino de los repartos a inversionistas.</p>
              {otherBanks.map(bank => renderBank(bank, true))}
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-surface-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-brand-green-light" /> Agregar Banco
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-text-secondary hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-text-primary font-medium mb-1">Nombre del Banco</label>
                <input value={createForm.bankName} onChange={e => setCreateForm(f => ({ ...f, bankName: e.target.value }))} className={inputCls} placeholder="Ej. Santander" />
              </div>
              <div>
                <label className="block text-sm text-text-primary font-medium mb-1">CLABE Interbancaria (18 dígitos)</label>
                <input value={createForm.clabe} onChange={e => setCreateForm(f => ({ ...f, clabe: e.target.value }))} className={inputCls} placeholder="014180000000000000" maxLength={18} />
              </div>
              <div>
                <label className="block text-sm text-text-primary font-medium mb-1">Titular de la Cuenta</label>
                <input value={createForm.accountHolder} onChange={e => setCreateForm(f => ({ ...f, accountHolder: e.target.value }))} className={inputCls} placeholder="Tu nombre completo" />
              </div>
              {isSuperAdmin && (
                <PurposeFields form={createForm} onChange={patch => setCreateForm(f => ({ ...f, ...patch }))} />
              )}
            </div>
            <div className="p-6 border-t border-surface-border flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-text-primary hover:text-white transition-colors">Cancelar</button>
              <button onClick={() => void handleCreate()} disabled={isCreating}
                className="bg-brand-green hover:bg-brand-green-light text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50">
                {isCreating ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 size={36} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar banco?</h3>
            <p className="text-text-secondary text-sm mb-6">
              Se eliminará <strong className="text-white">{deleteTarget.bankName}</strong> ({deleteTarget.accountHolder})
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg border border-surface-border text-text-primary hover:text-white transition-colors disabled:opacity-50">
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
