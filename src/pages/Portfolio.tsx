/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

interface PortfolioItem {
  id: string;
  name: string;
  category: string;
  type: 'CASH' | 'FIXED_INCOME' | 'VARIABLE_INCOME';
  deposited: number;
  realValue: number;
  color: string;
}

interface AccountSnapshot {
  id: string;
  accountId: string;
  date: string;
  deposited: number;
  realValue: number;
}

const TYPE_TO_ENUM: Record<string, 'CASH' | 'FIXED_INCOME' | 'VARIABLE_INCOME'> = {
  'Cuenta corriente': 'CASH',
  'Renta fija': 'FIXED_INCOME',
  'Renta Variable': 'VARIABLE_INCOME',
};

const ENUM_TO_LABEL: Record<string, string> = {
  CASH: 'Cuenta corriente',
  FIXED_INCOME: 'Renta fija',
  VARIABLE_INCOME: 'Renta Variable',
};

const CATEGORIES_BY_TYPE: Record<string, string[]> = {
  'Cuenta corriente': ['Débito', 'Ahorro', 'Nómina', 'Otro...'],
  'Renta fija': ['Sofipo', 'Fintec', 'Cetes', 'Otro...'],
  'Renta Variable': ['Acciones', 'ETFs', 'Fibras', 'Criptomonedas', 'Otro...'],
};

const EMPTY_ACCOUNT_FORM = {
  investmentType: 'Renta fija',
  category: 'Sofipo',
  customCategory: '',
  accountName: '',
  deposited: '',
  realValue: '',
  color: '#10B981',
};

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
const formatPercent = (percent: number) =>
  new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 2 }).format(percent);

// Cron corre el día 1: snapshot con month=M representa el estado al inicio del mes M
const computeMTD = (realValue: number, snaps: AccountSnapshot[], deposited: number): number | null => {
  const now = new Date();
  const base = snaps.find((s) => {
    const d = new Date(s.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const baseValue = (base && Number(base.realValue) !== 0) ? Number(base.realValue) : deposited;
  if (baseValue === 0) return 0;
  return (realValue - baseValue) / baseValue;
};

const computeYTD = (realValue: number, snaps: AccountSnapshot[], deposited: number): number | null => {
  const now = new Date();
  const base = snaps.find((s) => {
    const d = new Date(s.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === 0;
  });
  const baseValue = (base && Number(base.realValue) !== 0) ? Number(base.realValue) : deposited;
  if (baseValue === 0) return 0;
  return (realValue - baseValue) / baseValue;
};

export default function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snapshotMap, setSnapshotMap] = useState<Record<string, AccountSnapshot[]>>({});

  // Modal crear
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [accountStatus, setAccountStatus] = useState<'new' | 'existing'>('new');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [newAccount, setNewAccount] = useState(EMPTY_ACCOUNT_FORM);

  // Modal editar
  const [editingAccount, setEditingAccount] = useState<PortfolioItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', customCategory: '', investmentType: '', color: '' });
  const [isEditCustomCategory, setIsEditCustomCategory] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/financial-accounts`, authHeaders());
      const accounts: PortfolioItem[] = res.data;
      setItems(accounts);

      // Carga snapshots de todas las cuentas en paralelo
      if (accounts.length > 0) {
        const results = await Promise.all(
          accounts.map((acc) =>
            axios
              .get(`${API}/financial-accounts/${acc.id}/snapshots`, authHeaders())
              .then((r) => ({ id: acc.id, snaps: r.data as AccountSnapshot[] }))
              .catch(() => ({ id: acc.id, snaps: [] })),
          ),
        );
        const map: Record<string, AccountSnapshot[]> = {};
        results.forEach(({ id, snaps }) => { map[id] = snaps; });
        setSnapshotMap(map);
      }
    } catch {
      toast.error('Error al cargar el portafolio');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const totalDeposited = items.reduce((acc, item) => acc + Number(item.deposited), 0);
  const totalRealValue = items.reduce((acc, item) => acc + Number(item.realValue), 0);
  const totalGain = totalRealValue - totalDeposited;
  const totalYield = totalDeposited > 0 ? totalGain / totalDeposited : 0;

  const badgeStyle = (color: string) => ({
    backgroundColor: color + '33',
    color,
    borderColor: color + '66',
  });

  const currentCategories = (type: string) => CATEGORIES_BY_TYPE[type] ?? ['Otro...'];

  // ── CREAR CUENTA ──
  const handleTypeChange = (type: string) => {
    const cats = currentCategories(type);
    setNewAccount({ ...newAccount, investmentType: type, category: cats[0] === 'Otro...' ? '' : cats[0], customCategory: '' });
    setIsCustomCategory(false);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setIsCustomCategory(value === 'Otro...');
    setNewAccount({ ...newAccount, category: value, customCategory: '' });
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? newAccount.customCategory : newAccount.category;
    const isCashType = newAccount.investmentType === 'Cuenta corriente';
    const finalDeposited = accountStatus === 'existing' ? parseFloat(newAccount.deposited) || 0 : 0;
    const finalRealValue = accountStatus === 'existing' && !isCashType ? parseFloat(newAccount.realValue) || 0 : 0;

    const payload = {
      name: newAccount.accountName,
      category: finalCategory,
      type: TYPE_TO_ENUM[newAccount.investmentType],
      color: newAccount.color,
      ...(accountStatus === 'existing' && { deposited: finalDeposited, realValue: finalRealValue }),
    };

    try {
      await axios.post(`${API}/financial-accounts`, payload, authHeaders());
      await fetchAccounts();
      setIsNewAccountModalOpen(false);
      setNewAccount(EMPTY_ACCOUNT_FORM);
      setIsCustomCategory(false);
      setAccountStatus('new');
      toast.success('Cuenta registrada correctamente');
    } catch {
      toast.error('Error al guardar la cuenta');
    }
  };

  // ── EDITAR CUENTA ──
  const openEdit = (item: PortfolioItem) => {
    const label = ENUM_TO_LABEL[item.type] ?? 'Renta fija';
    setEditForm({ name: item.name, category: item.category, customCategory: '', investmentType: label, color: item.color });
    setIsEditCustomCategory(false);
    setEditingAccount(item);
  };

  const handleEditTypeChange = (type: string) => {
    const cats = currentCategories(type);
    setEditForm({ ...editForm, investmentType: type, category: cats[0] === 'Otro...' ? '' : cats[0], customCategory: '' });
    setIsEditCustomCategory(false);
  };

  const handleEditCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setIsEditCustomCategory(value === 'Otro...');
    setEditForm({ ...editForm, category: value, customCategory: '' });
  };

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    const finalCategory = isEditCustomCategory ? editForm.customCategory : editForm.category;

    const payload = {
      name: editForm.name,
      category: finalCategory,
      type: TYPE_TO_ENUM[editForm.investmentType],
      color: editForm.color,
    };

    try {
      await axios.patch(`${API}/financial-accounts/${editingAccount.id}`, payload, authHeaders());
      await fetchAccounts();
      setEditingAccount(null);
      toast.success('Cuenta actualizada');
    } catch {
      toast.error('Error al actualizar la cuenta');
    }
  };

  // ── ELIMINAR CUENTA ──
  const handleDelete = async (item: PortfolioItem) => {
    if (!window.confirm(`¿Eliminar la cuenta "${item.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await axios.delete(`${API}/financial-accounts/${item.id}`, authHeaders());
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success('Cuenta eliminada');
    } catch {
      toast.error('Error al eliminar la cuenta');
    }
  };

  const renderRend = (value: number | null, isCash: boolean) => {
    if (isCash) return <span className="text-slate-500 text-xs">—</span>;
    if (value === null) return <span className="text-slate-500 text-xs">—</span>;
    const isPos = value >= 0;
    return (
      <span className={`font-bold text-xs ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPos ? '+' : ''}{formatPercent(value)}
      </span>
    );
  };

  // ── JSX del formulario de cuenta (compartido crear/editar) ──
  const renderAccountForm = (
    mode: 'create' | 'edit',
    form: typeof newAccount | typeof editForm,
    onTypeChange: (t: string) => void,
    onCatChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    isCustomCat: boolean,
    onSubmit: (e: React.FormEvent) => void,
    onClose: () => void,
  ) => {
    const isEdit = mode === 'edit';
    const isCashForm = form.investmentType === 'Cuenta corriente';
    const setForm = isEdit
      ? (v: Partial<typeof editForm>) => setEditForm((p) => ({ ...p, ...v }))
      : (v: Partial<typeof newAccount>) => setNewAccount((p) => ({ ...p, ...v }));

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md p-6">
          <h2 className="text-2xl font-bold text-white mb-6">{isEdit ? 'Editar Cuenta' : 'Agregar Nueva Cuenta'}</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            {!isEdit && (
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                {(['new', 'existing'] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setAccountStatus(s)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${accountStatus === s ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                    {s === 'new' ? 'Cuenta Nueva (En ceros)' : 'Ya tengo saldo'}
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">Tipo de Inversión</label>
              <select value={form.investmentType} onChange={(e) => onTypeChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500">
                {Object.keys(TYPE_TO_ENUM).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Categoría</label>
                <select value={form.category} onChange={onCatChange}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500">
                  {currentCategories(form.investmentType).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {isCustomCat && (
                  <input type="text" placeholder="Escribe la categoría..." required
                    value={isEdit ? (editForm as typeof editForm).customCategory : (newAccount).customCategory}
                    onChange={(e) => setForm({ customCategory: e.target.value } as never)}
                    className="w-full mt-2 bg-slate-900 border border-emerald-500/50 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500" />
                )}
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Nombre</label>
                <input type="text" placeholder="Ej. BBVA Débito" required
                  value={isEdit ? editForm.name : newAccount.accountName}
                  onChange={(e) => isEdit ? setEditForm((p) => ({ ...p, name: e.target.value })) : setNewAccount((p) => ({ ...p, accountName: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-slate-400 text-sm font-medium mb-1">Color del badge</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.color}
                    onChange={(e) => isEdit ? setEditForm((p) => ({ ...p, color: e.target.value })) : setNewAccount((p) => ({ ...p, color: e.target.value }))}
                    className="h-9 w-14 rounded cursor-pointer bg-slate-900 border border-slate-600 p-0.5" />
                  <span className="px-3 py-1 rounded-full text-xs font-bold border" style={badgeStyle(form.color)}>
                    {ENUM_TO_LABEL[TYPE_TO_ENUM[form.investmentType]] ?? form.investmentType}
                  </span>
                </div>
              </div>
            </div>

            {!isEdit && accountStatus === 'existing' && (
              <div className={`pt-2 border-t border-slate-700 mt-2 ${isCashForm ? '' : 'grid grid-cols-2 gap-4'}`}>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1">Depositado Inicial</label>
                  <input type="number" step="0.01" required value={newAccount.deposited}
                    onChange={(e) => setNewAccount((p) => ({ ...p, deposited: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
                {!isCashForm && (
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-1">Valor Real Actual</label>
                    <input type="number" step="0.01" required value={newAccount.realValue}
                      onChange={(e) => setNewAccount((p) => ({ ...p, realValue: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500" />
                  </div>
                )}
                {isCashForm && (
                  <p className="text-xs text-slate-500 mt-1">El Valor Real siempre es igual al Depositado en cuentas corrientes.</p>
                )}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button type="button" onClick={onClose}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors font-medium">Cancelar</button>
              <button type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors font-bold">
                {isEdit ? 'Guardar Cambios' : 'Guardar Cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 text-white font-sans max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-400">Portafolio de Inversiones</h1>
          <p className="text-slate-400 mt-2">Resumen global y valor real</p>
        </div>
        <button onClick={() => setIsNewAccountModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg w-full md:w-auto">
          + Nueva Cuenta
        </button>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Cargando portafolio...</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900/80 text-slate-300 uppercase tracking-wider border-b border-slate-700">
                  <th className="p-4 font-semibold">Tipo</th>
                  <th className="p-4 font-semibold">Categoría</th>
                  <th className="p-4 font-semibold">Cuenta</th>
                  <th className="p-4 font-semibold text-right">Depositado</th>
                  <th className="p-4 font-semibold text-right">Valor Real</th>
                  <th className="p-4 font-semibold text-right">Ganancia</th>
                  <th className="p-4 font-semibold text-right">Rend. Mes</th>
                  <th className="p-4 font-semibold text-right">Rend. Año</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Sin cuentas registradas. Agrega tu primera cuenta.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isCash = item.type === 'CASH';
                    const deposited = Number(item.deposited);
                    const realValue = Number(item.realValue);
                    const gain = isCash ? 0 : realValue - deposited;
                    const yieldPercent = isCash ? 0 : (deposited > 0 ? gain / deposited : 0);
                    const isPositive = gain >= 0;
                    const label = ENUM_TO_LABEL[item.type] ?? item.type;
                    const color = item.color ?? '#10B981';
                    const snaps = snapshotMap[item.id] ?? [];
                    const mtd = isCash ? null : computeMTD(realValue, snaps, deposited);
                    const ytd = isCash ? null : computeYTD(realValue, snaps, deposited);

                    return (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold border" style={badgeStyle(color)}>
                            {label}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">{item.category}</td>
                        <td className="p-4">
                          <Link to={`/portfolio/${item.id}`}
                            className="font-bold text-white hover:text-emerald-400 transition-colors">
                            {item.name}
                          </Link>
                        </td>
                        <td className="p-4 text-right text-slate-300">{formatCurrency(deposited)}</td>
                        <td className="p-4 text-right font-bold text-white">{formatCurrency(realValue)}</td>
                        <td className={`p-4 text-right font-medium ${isCash ? 'text-slate-500' : isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isCash ? '—' : `${isPositive ? '+' : ''}${formatCurrency(gain)}`}
                        </td>
                        <td className="p-4 text-right">{renderRend(mtd, isCash)}</td>
                        <td className="p-4 text-right">{renderRend(ytd, isCash)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEdit(item)} title="Editar"
                              className="text-slate-400 hover:text-emerald-400 transition-colors p-1 rounded hover:bg-emerald-500/10">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleDelete(item)} title="Eliminar"
                              className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900/90 border-t-2 border-slate-600">
                    <td colSpan={3} className="p-4 text-right font-bold text-slate-300 uppercase tracking-wider">Totales:</td>
                    <td className="p-4 text-right font-bold text-slate-300">{formatCurrency(totalDeposited)}</td>
                    <td className="p-4 text-right font-extrabold text-white text-lg">{formatCurrency(totalRealValue)}</td>
                    <td className={`p-4 text-right font-extrabold text-lg ${totalGain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* MODAL CREAR */}
      {isNewAccountModalOpen && renderAccountForm(
        'create', newAccount,
        handleTypeChange, handleCategoryChange, isCustomCategory,
        handleAddAccount, () => { setIsNewAccountModalOpen(false); setNewAccount(EMPTY_ACCOUNT_FORM); setIsCustomCategory(false); setAccountStatus('new'); },
      )}

      {/* MODAL EDITAR */}
      {editingAccount && renderAccountForm(
        'edit', editForm,
        handleEditTypeChange, handleEditCategoryChange, isEditCustomCategory,
        handleEditAccount, () => setEditingAccount(null),
      )}
    </div>
  );
}
