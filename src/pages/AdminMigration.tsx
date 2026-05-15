/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { DatabaseZap, UserSearch, Send, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

interface UserOption {
  id: string;
  email: string;
  name?: string;
  creditLimit: string | number;
  currentRate: string | number;
}

interface ProjectedInstallment {
  number: number;
  dueDate: Date;
  amountDue: number;
  paid: boolean;
}

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function fmt(v: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

const EMPTY_FORM = {
  userId: '',
  concept: '',
  amount: '',
  interestRate: '',
  termMonths: '',
  startDate: '',
  referralCode: '',
  paidInstallmentsCount: '',
};

export default function AdminMigration() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await axios.get<UserOption[]>(`${API}/users`, { headers: authHeaders() });
      setUsers(data);
    } catch {
      toast.error('No se pudo cargar la lista de usuarios');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  const set = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  // ── Valores derivados ──────────────────────────────────────────
  const amount      = parseFloat(form.amount) || 0;
  const rate        = parseFloat(form.interestRate) || 0;
  const months      = parseInt(form.termMonths) || 0;
  const paidCount   = Math.min(parseInt(form.paidInstallmentsCount) || 0, months);
  const hasTable    = amount > 0 && months > 0 && form.startDate !== '';

  const totalDebt   = amount + amount * (rate / 100);
  const monthly     = months > 0 ? totalDebt / months : 0;
  const paidAmount  = monthly * paidCount;
  const pending     = totalDebt - paidAmount;

  const selectedUser = users.find(u => u.id === form.userId);

  // ── Tabla de proyección ────────────────────────────────────────
  const projection = useMemo<ProjectedInstallment[]>(() => {
    if (!hasTable) return [];
    const installments: ProjectedInstallment[] = [];
    let current = new Date(form.startDate + 'T12:00:00');
    for (let i = 1; i <= months; i++) {
      current = new Date(current);
      current.setMonth(current.getMonth() + 1);
      installments.push({
        number: i,
        dueDate: new Date(current),
        amountDue: monthly,
        paid: i <= paidCount,
      });
    }
    return installments;
  }, [hasTable, form.startDate, months, monthly, paidCount]);

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId)    { toast.error('Selecciona un usuario'); return; }
    if (!form.startDate) { toast.error('Ingresa la fecha de inicio'); return; }
    if (paidCount > months) { toast.error('Las cuotas pagadas no pueden superar el plazo'); return; }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${API}/loans/migrate`,
        {
          userId: form.userId,
          concept: form.concept,
          amount,
          interestRate: rate,
          termMonths: months,
          startDate: new Date(form.startDate + 'T12:00:00').toISOString(),
          ...(form.referralCode ? { referralCode: form.referralCode } : {}),
          ...(paidCount > 0 ? { paidInstallmentsCount: paidCount } : {}),
        },
        { headers: authHeaders() },
      );
      toast.success('Préstamo migrado exitosamente');
      setForm(EMPTY_FORM);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al migrar el préstamo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = 'w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-violet-500 transition-colors placeholder:text-slate-600';
  const labelCls = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="p-8 text-white font-sans max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-violet-400 flex items-center gap-3">
          <DatabaseZap size={32} />
          Migración de Datos
        </h1>
        <p className="text-slate-400 mt-2">
          Importa préstamos existentes desde registros externos (Excel / hojas de cálculo)
        </p>
      </div>

      <form onSubmit={e => void handleSubmit(e)} className="space-y-6">

        {/* ── Sección 1: Usuario ── */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-5">
            <UserSearch size={16} className="text-violet-400" />
            Selección de Usuario
          </h2>

          <div>
            <label className={labelCls}>Usuario</label>
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm py-2.5">
                <RefreshCw size={14} className="animate-spin" /> Cargando usuarios...
              </div>
            ) : (
              <select value={form.userId} onChange={set('userId')} className={inputCls} required>
                <option value="">— Selecciona un usuario —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name ? `${u.name} (${u.email})` : u.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedUser && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-slate-900 rounded-lg p-3 text-sm">
                <p className="text-slate-500 text-xs mb-0.5">Límite de Crédito</p>
                <p className="text-white font-bold">{fmt(Number(selectedUser.creditLimit))}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 text-sm">
                <p className="text-slate-500 text-xs mb-0.5">Tasa Personalizada</p>
                <p className="text-white font-bold">{Number(selectedUser.currentRate).toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Sección 2: Datos del préstamo ── */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-5">
            <DatabaseZap size={16} className="text-violet-400" />
            Datos del Préstamo
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={labelCls}>Concepto / Descripción</label>
              <input type="text" value={form.concept} onChange={set('concept')}
                placeholder="Ej. Préstamo personal enero 2024"
                className={inputCls} required />
            </div>

            <div>
              <label className={labelCls}>Monto Original (Capital)</label>
              <input type="number" value={form.amount} onChange={set('amount')}
                placeholder="0.00" min="0.01" step="0.01" className={inputCls} required />
            </div>

            <div>
              <label className={labelCls}>Tasa de Interés Total (%)</label>
              <input type="number" value={form.interestRate} onChange={set('interestRate')}
                placeholder="50" min="0" step="0.5" className={inputCls} required />
            </div>

            <div>
              <label className={labelCls}>Plazo (Meses)</label>
              <input type="number" value={form.termMonths} onChange={set('termMonths')}
                placeholder="12" min="1" step="1" className={inputCls} required />
            </div>

            <div>
              <label className={labelCls}>Fecha de Inicio Real</label>
              <input type="date" value={form.startDate} onChange={set('startDate')}
                className={inputCls} required />
              <p className="text-xs text-slate-600 mt-1">Puede ser una fecha en el pasado</p>
            </div>

            <div>
              <label className={labelCls}>
                Mensualidades ya pagadas
                <span className="text-slate-600 normal-case font-normal ml-1">(opcional)</span>
              </label>
              <input type="number" value={form.paidInstallmentsCount} onChange={set('paidInstallmentsCount')}
                placeholder="0" min="0" max={months || 999} step="1" className={inputCls} />
              {paidCount > 0 && months > 0 && (
                <p className="text-xs text-emerald-500 mt-1">
                  {paidCount} de {months} cuotas se marcarán como PAGADAS
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>
                Código de Referencia
                <span className="text-slate-600 normal-case font-normal ml-1">(opcional)</span>
              </label>
              <input type="text" value={form.referralCode} onChange={set('referralCode')}
                placeholder="Ej. REF-2024-001" className={inputCls} />
            </div>
          </div>
        </div>

        {/* ── Resumen Dinámico ── */}
        {hasTable && (
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Total a Pagar</p>
                <p className="text-violet-300 font-bold text-lg">{fmt(totalDebt)}</p>
                <p className="text-slate-600 text-xs mt-0.5">Capital: {fmt(amount)} · Interés: {fmt(totalDebt - amount)}</p>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Ya Liquidado</p>
                <p className="text-emerald-400 font-bold text-lg">{fmt(paidAmount)}</p>
                <p className="text-slate-600 text-xs mt-0.5">{paidCount} cuota{paidCount !== 1 ? 's' : ''} pagada{paidCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Saldo Pendiente</p>
                <p className={`font-bold text-lg ${pending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{fmt(pending)}</p>
                <p className="text-slate-600 text-xs mt-0.5">{months - paidCount} cuota{(months - paidCount) !== 1 ? 's' : ''} por cobrar</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Se creará un préstamo de{' '}
              <span className="text-violet-300 font-semibold">{fmt(totalDebt)}</span>
              {paidCount > 0 && (
                <>, con <span className="text-emerald-400 font-semibold">{paidCount} cuota{paidCount !== 1 ? 's' : ''} ya liquidada{paidCount !== 1 ? 's' : ''}</span> y un saldo pendiente de <span className="text-amber-400 font-semibold">{fmt(pending)}</span></>
              )}
            </p>
          </div>
        )}

        {/* ── Tabla de Proyección ── */}
        {projection.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-300">Tabla de Amortización</h2>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-400" /> Pagada
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" /> Pendiente
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-6 py-3 w-16">#</th>
                    <th className="text-left px-6 py-3">Fecha de Vencimiento</th>
                    <th className="text-right px-6 py-3">Monto</th>
                    <th className="text-center px-6 py-3 w-28">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.map(inst => (
                    <tr
                      key={inst.number}
                      className={`border-b border-slate-700/50 transition-colors ${
                        inst.paid
                          ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                          : 'hover:bg-slate-700/30'
                      }`}
                    >
                      <td className="px-6 py-3 font-mono text-slate-400 text-xs">
                        {String(inst.number).padStart(2, '0')}
                      </td>
                      <td className={`px-6 py-3 ${inst.paid ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {fmtDate(inst.dueDate)}
                      </td>
                      <td className={`px-6 py-3 text-right font-semibold tabular-nums ${inst.paid ? 'text-slate-500' : 'text-white'}`}>
                        {fmt(inst.amountDue)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {inst.paid ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                            <CheckCircle2 size={10} /> Pagada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-700/50 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-600/40 font-semibold">
                            <Clock size={10} /> Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/40 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Total cuotas</p>
                <p className="text-white font-bold">{months}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Cuota mensual</p>
                <p className="text-white font-bold">{fmt(monthly)}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-xs mb-0.5">Total a pagar</p>
                <p className="text-violet-300 font-bold">{fmt(totalDebt)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Botón enviar ── */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !hasTable || !form.userId}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-500/20"
          >
            {isSubmitting
              ? <><RefreshCw size={16} className="animate-spin" /> Migrando...</>
              : <><Send size={16} /> Migrar Préstamo</>
            }
          </button>
        </div>

      </form>
    </div>
  );
}
