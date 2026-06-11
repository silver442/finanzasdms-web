import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Activity, AlertTriangle, ChevronDown, Settings, Plus, X, TrendingUp, ShoppingBag } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const MXN = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

interface DailyEntry {
  date: string;
  closingBalance: number;
  transactions: { id: string; amount: number; type: string; description: string }[];
}

interface MonitorItem {
  id: string;
  name: string;
  type: 'CASH' | 'FIXED_INCOME' | 'VARIABLE_INCOME';
  periodStartDay: number;
  periodStart: string;
  periodEnd: string;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  currentBalance: number;
  currentAverageBalance: number;
  minAverageBalance: number;
  currentSpend: number;
  minMonthlySpend: number;
  requiredDailyBalance: number | null;
  dailyBalances: DailyEntry[];
}

interface RulesForm {
  periodStartDay: string;
  minAverageBalance: string;
  minMonthlySpend: string;
}

interface MovForm {
  type: 'DEPOSIT' | 'WITHDRAW' | 'EXPENSE';
  amount: string;
  description: string;
  date: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const EMPTY_RULES: RulesForm = { periodStartDay: '1', minAverageBalance: '0', minMonthlySpend: '0' };
const EMPTY_MOV: MovForm = { type: 'EXPENSE', amount: '', description: '', date: todayISO() };

function progressColor(ratio: number) {
  if (ratio >= 0.85) return { bar: 'bg-brand-green', text: 'text-brand-green-light' };
  if (ratio >= 0.5) return { bar: 'bg-brand-violet', text: 'text-brand-violet' };
  return { bar: 'bg-red-500', text: 'text-red-400' };
}

function ProgressBar({ current, min, label }: { current: number; min: number; label: string }) {
  const ratio = min > 0 ? Math.min(current / min, 1) : 0;
  const pct = Math.round(ratio * 100);
  const { bar, text } = progressColor(min > 0 ? current / min : 1);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className={`text-xs font-bold ${text}`}>{pct}%</span>
      </div>
      <div className="w-full bg-surface-elevated rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-text-muted">{MXN(current)}</span>
        <span className="text-xs text-text-muted">Meta: {MXN(min)}</span>
      </div>
    </div>
  );
}

export default function AccountMonitor() {
  const [items, setItems] = useState<MonitorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [rulesTarget, setRulesTarget] = useState<MonitorItem | null>(null);
  const [rulesForm, setRulesForm] = useState<RulesForm>(EMPTY_RULES);
  const [isSavingRules, setIsSavingRules] = useState(false);

  const [movTarget, setMovTarget] = useState<MonitorItem | null>(null);
  const [movForm, setMovForm] = useState<MovForm>(EMPTY_MOV);
  const [isSavingMov, setIsSavingMov] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get<MonitorItem[]>(
        `${API}/financial-accounts/monitoring/status`,
        authHeaders(),
      );
      setItems(data);
    } catch {
      toast.error('Error al cargar el monitor de cuentas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchStatus(); }, [fetchStatus]);

  const openRules = (item: MonitorItem) => {
    setRulesTarget(item);
    setRulesForm({
      periodStartDay: String(item.periodStartDay),
      minAverageBalance: String(item.minAverageBalance),
      minMonthlySpend: String(item.minMonthlySpend),
    });
  };

  const saveRules = async () => {
    if (!rulesTarget) return;
    setIsSavingRules(true);
    try {
      await axios.patch(
        `${API}/financial-accounts/${rulesTarget.id}`,
        {
          periodStartDay: parseInt(rulesForm.periodStartDay, 10),
          minAverageBalance: parseFloat(rulesForm.minAverageBalance) || 0,
          minMonthlySpend: parseFloat(rulesForm.minMonthlySpend) || 0,
        },
        authHeaders(),
      );
      toast.success('Reglas actualizadas');
      setRulesTarget(null);
      await fetchStatus();
    } catch {
      toast.error('Error al guardar las reglas');
    } finally {
      setIsSavingRules(false);
    }
  };

  const openMov = (item: MonitorItem) => {
    setMovTarget(item);
    setMovForm(EMPTY_MOV);
  };

  const saveMov = async () => {
    if (!movTarget) return;
    const amount = parseFloat(movForm.amount);
    if (!amount || amount <= 0) { toast.error('Ingresa un monto válido'); return; }
    setIsSavingMov(true);
    try {
      await axios.post(
        `${API}/financial-accounts/${movTarget.id}/transactions`,
        { type: movForm.type, amount, description: movForm.description || undefined, date: movForm.date },
        authHeaders(),
      );
      toast.success('Movimiento registrado');
      setMovTarget(null);
      await fetchStatus();
    } catch {
      toast.error('Error al registrar el movimiento');
    } finally {
      setIsSavingMov(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-400" />
      </div>
    );
  }

  const cashItems = items.filter((i) => i.type === 'CASH');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Activity size={28} className="text-brand-green-light" />
        <div>
          <h1 className="text-2xl font-extrabold text-white">Monitor de Cuentas</h1>
          <p className="text-text-secondary text-sm">Saldo promedio y gasto mínimo por periodo de corte</p>
        </div>
      </div>

      {cashItems.length === 0 && (
        <div className="text-center py-16 text-text-muted">No tienes cuentas corrientes registradas aún.</div>
      )}

      {cashItems.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">
            Cuentas Corrientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cashItems.map((item) => (
              <AccountCard
                key={item.id}
                item={item}
                onRules={openRules}
                onMov={openMov}
                isExpanded={expandedId === item.id}
                onToggle={() => toggleExpand(item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modal: Configurar Reglas */}
      {rulesTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Configurar Reglas</h3>
              <button onClick={() => setRulesTarget(null)} className="text-text-secondary hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-text-secondary text-sm mb-4">{rulesTarget.name}</p>

            <label className="block text-xs text-text-secondary mb-1">Día de corte (1–28)</label>
            <input
              type="number"
              min={1}
              max={28}
              value={rulesForm.periodStartDay}
              onChange={(e) => setRulesForm((f) => ({ ...f, periodStartDay: e.target.value }))}
              className="w-full bg-surface-base border border-surface-border focus:border-brand-green rounded-lg px-4 py-2 text-white mb-4 outline-none"
            />

            <label className="block text-xs text-text-secondary mb-1">Saldo promedio mínimo ($)</label>
            <input
              type="number"
              min={0}
              value={rulesForm.minAverageBalance}
              onChange={(e) => setRulesForm((f) => ({ ...f, minAverageBalance: e.target.value }))}
              className="w-full bg-surface-base border border-surface-border focus:border-brand-green rounded-lg px-4 py-2 text-white mb-4 outline-none"
            />

            <label className="block text-xs text-text-secondary mb-1">Gasto mínimo mensual ($)</label>
            <input
              type="number"
              min={0}
              value={rulesForm.minMonthlySpend}
              onChange={(e) => setRulesForm((f) => ({ ...f, minMonthlySpend: e.target.value }))}
              className="w-full bg-surface-base border border-surface-border focus:border-brand-green rounded-lg px-4 py-2 text-white mb-4 outline-none"
            />

            <button
              onClick={() => void saveRules()}
              disabled={isSavingRules}
              className="w-full bg-brand-green hover:bg-brand-green-light text-white px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isSavingRules ? 'Guardando...' : 'Guardar Reglas'}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Agregar Movimiento */}
      {movTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Agregar Movimiento</h3>
              <button onClick={() => setMovTarget(null)} className="text-text-secondary hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-text-secondary text-sm mb-4">{movTarget.name}</p>

            <label className="block text-xs text-text-secondary mb-1">Tipo</label>
            <select
              value={movForm.type}
              onChange={(e) => setMovForm((f) => ({ ...f, type: e.target.value as MovForm['type'] }))}
              className="w-full bg-surface-base border border-surface-border focus:border-brand-green rounded-lg px-4 py-2 text-white mb-4 outline-none"
            >
              <option value="DEPOSIT">Depósito</option>
              <option value="EXPENSE">Gasto</option>
              <option value="WITHDRAW">Retiro</option>
            </select>

            <label className="block text-xs text-text-secondary mb-1">Monto ($)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={movForm.amount}
              onChange={(e) => setMovForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full bg-surface-base border border-surface-border focus:border-brand-green rounded-lg px-4 py-2 text-white mb-4 outline-none"
            />

            <label className="block text-xs text-text-secondary mb-1">Descripción (opcional)</label>
            <input
              type="text"
              placeholder="ej. Compra supermercado"
              value={movForm.description}
              onChange={(e) => setMovForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-surface-base border border-surface-border focus:border-brand-green rounded-lg px-4 py-2 text-white mb-4 outline-none"
            />

            <label className="block text-xs text-text-secondary mb-1">Fecha</label>
            <input
              type="date"
              value={movForm.date}
              onChange={(e) => setMovForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full bg-surface-base border border-surface-border focus:border-brand-green rounded-lg px-4 py-2 text-white mb-4 outline-none"
            />

            <button
              onClick={() => void saveMov()}
              disabled={isSavingMov}
              className="w-full bg-brand-green hover:bg-brand-green-light text-white px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isSavingMov ? 'Registrando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountCard({
  item,
  onRules,
  onMov,
  isExpanded,
  onToggle,
}: {
  item: MonitorItem;
  onRules: (i: MonitorItem) => void;
  onMov: (i: MonitorItem) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isCash = item.type === 'CASH';
  const hasMeta = item.minAverageBalance > 0 || item.minMonthlySpend > 0;
  const showAlert = isCash && item.requiredDailyBalance !== null && item.requiredDailyBalance > 0;

  const periodLabel = (() => {
    const s = new Date(item.periodStart);
    const e = new Date(item.periodEnd);
    const fmt = (d: Date) => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    return `${fmt(s)} – ${fmt(e)}`;
  })();

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white font-bold">{item.name}</p>
          <p className="text-text-muted text-xs mt-0.5">{periodLabel} · {item.daysElapsed}/{item.totalDays} días</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isCash ? 'bg-blue-500/10 text-blue-400' : 'bg-brand-green/10 text-brand-green-light'}`}>
          {isCash ? 'CORRIENTE' : item.type === 'FIXED_INCOME' ? 'RENTA FIJA' : 'RENTA VAR.'}
        </span>
      </div>

      {/* Balance actual */}
      <div className="flex gap-4">
        <div className="flex-1 bg-surface-base rounded-xl p-3">
          <p className="text-text-secondary text-xs mb-1">Saldo actual</p>
          <p className="text-white font-bold">{MXN(item.currentBalance)}</p>
        </div>
        {isCash && (
          <div className="flex-1 bg-surface-base rounded-xl p-3">
            <p className="text-text-secondary text-xs mb-1">Promedio del mes</p>
            <p className="text-white font-bold">{MXN(item.currentAverageBalance)}</p>
          </div>
        )}
      </div>

      {/* Widgets de progreso */}
      {hasMeta && (
        <div>
          {isCash && item.minAverageBalance > 0 && (
            <ProgressBar
              current={item.currentAverageBalance}
              min={item.minAverageBalance}
              label="Saldo Promedio"
            />
          )}
          {item.minMonthlySpend > 0 && (
            <ProgressBar
              current={item.currentSpend}
              min={item.minMonthlySpend}
              label="Gasto Acumulado"
            />
          )}
        </div>
      )}

      {/* Alerta de proyección */}
      {showAlert && (
        <div className="bg-brand-violet/10 border border-brand-violet/30 rounded-xl p-3 flex gap-2">
          <AlertTriangle size={16} className="text-brand-violet shrink-0 mt-0.5" />
          <p className="text-brand-violet text-xs leading-relaxed">
            Faltan <span className="font-bold">{item.daysRemaining} días</span> de tu periodo.
            Debes mantener un saldo diario de{' '}
            <span className="font-bold">{MXN(item.requiredDailyBalance!)}</span>{' '}
            para alcanzar la meta de{' '}
            <span className="font-bold">{MXN(item.minAverageBalance)}</span> y evitar comisiones.
          </p>
        </div>
      )}

      {/* Sin metas configuradas */}
      {!hasMeta && (
        <p className="text-text-muted text-xs text-center py-1">Sin metas configuradas</p>
      )}

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onMov(item)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-surface-elevated hover:bg-surface-elevated text-text-primary hover:text-white text-xs font-bold px-3 py-2 rounded-lg transition-all"
        >
          <Plus size={14} />
          Movimiento
        </button>
        <button
          onClick={() => onRules(item)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-surface-elevated hover:bg-surface-elevated text-text-primary hover:text-white text-xs font-bold px-3 py-2 rounded-lg transition-all"
        >
          <Settings size={14} />
          Reglas
        </button>
      </div>

      {/* Info de gasto (sin meta) */}
      {item.minMonthlySpend === 0 && item.currentSpend > 0 && (
        <div className="flex items-center gap-2 bg-surface-base rounded-xl p-3">
          <ShoppingBag size={14} className="text-text-muted" />
          <span className="text-text-secondary text-xs">Gasto del periodo: <span className="text-white font-bold">{MXN(item.currentSpend)}</span></span>
        </div>
      )}

      {/* Tendencia del promedio vs balance actual */}
      {isCash && item.currentAverageBalance > 0 && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <TrendingUp size={13} />
          <span>
            Promedio {item.currentAverageBalance >= item.currentBalance ? 'mayor' : 'menor'} al saldo actual
          </span>
        </div>
      )}

      {/* Acordeón: desglose diario */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-text-primary pt-1 transition-colors"
      >
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
        {isExpanded ? 'Ocultar desglose' : 'Ver desglose diario'}
      </button>

      {isExpanded && (
        <div className="mt-1 rounded-xl overflow-hidden border border-surface-border">
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-surface-base sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-text-secondary font-semibold">Fecha</th>
                  <th className="px-3 py-2 text-left text-text-secondary font-semibold">Movimientos</th>
                  <th className="px-3 py-2 text-right text-text-secondary font-semibold">Saldo Cierre</th>
                </tr>
              </thead>
              <tbody>
                {[...item.dailyBalances].reverse().map((entry, i) => (
                  <tr key={i} className="border-t border-surface-border/50 hover:bg-surface-elevated/20">
                    <td className="px-3 py-2 text-text-primary whitespace-nowrap">
                      {new Date(entry.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {entry.transactions.length === 0 ? (
                        <span className="text-text-muted">—</span>
                      ) : (
                        entry.transactions.map((t) => (
                          <div key={t.id} className={t.type === 'DEPOSIT' ? 'text-brand-green-light' : 'text-red-400'}>
                            {t.type === 'DEPOSIT' ? '+' : '-'}{MXN(t.amount)}
                            <span className="text-text-muted ml-1 text-[10px] truncate block">{t.description}</span>
                          </div>
                        ))
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-white whitespace-nowrap">
                      {MXN(entry.closingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
