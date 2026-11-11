/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { AlertTriangle, X, Zap } from 'lucide-react';

export interface SuperEditableLoan {
  id: string;
  concept: string;
  amount: string | number;
  interestRate: string | number;
  termQuantity: number;
  termUnit: string;
  paymentFrequency?: string;
  startDate: string;
  status: string;
  disbursementAccount?: string;
}

interface SuperEditLoanModalProps {
  loan: SuperEditableLoan;
  onClose: () => void;
  onSaved: () => void;
}

const API = import.meta.env.VITE_API_URL;
function authHeaders() { return { Authorization: `Bearer ${localStorage.getItem('token')}` }; }

const LOAN_STATUSES = [
  'REQUESTED', 'ESPERANDO_CONFIRMACION', 'PENDIENTE_TRANSFERIR', 'ACTIVE', 'PAID',
  'REJECTED', 'CANCELADO', 'CANCELADO_POR_ADMIN', 'DEFAULTED',
];

const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors';
const labelCls = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1';

function toForm(loan: SuperEditableLoan) {
  return {
    concept: loan.concept,
    amount: String(Number(loan.amount)),
    interestRate: String(Number(loan.interestRate)),
    termQuantity: String(loan.termQuantity),
    termUnit: loan.termUnit,
    paymentFrequency: loan.paymentFrequency ?? 'MENSUAL',
    startDate: loan.startDate.slice(0, 10),
    status: loan.status,
    disbursementAccount: loan.disbursementAccount ?? '',
  };
}

// [SUPER_ADMIN] Reescribe cualquier campo del préstamo vía PATCH /loans/:id/super-edit.
export default function SuperEditLoanModal({ loan, onClose, onSaved }: SuperEditLoanModalProps) {
  const initial = toForm(loan);
  const [form, setForm] = useState(initial);
  const [regenerate, setRegenerate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    const payload: Record<string, unknown> = {};
    if (form.concept !== initial.concept) payload.concept = form.concept.trim();
    if (form.amount !== initial.amount) payload.amount = Number(form.amount);
    if (form.interestRate !== initial.interestRate) payload.interestRate = Number(form.interestRate);
    if (form.termQuantity !== initial.termQuantity) payload.termQuantity = parseInt(form.termQuantity, 10);
    if (form.termUnit !== initial.termUnit) payload.termUnit = form.termUnit;
    if (form.paymentFrequency !== initial.paymentFrequency) payload.paymentFrequency = form.paymentFrequency;
    if (form.startDate !== initial.startDate) payload.startDate = new Date(`${form.startDate}T12:00:00`).toISOString();
    if (form.status !== initial.status) payload.status = form.status;
    if (form.disbursementAccount !== initial.disbursementAccount) payload.disbursementAccount = form.disbursementAccount;
    if (regenerate) payload.regenerateInstallments = true;

    if (Object.keys(payload).length === 0) { toast.info('No hay cambios que guardar'); return; }

    setIsSaving(true);
    try {
      await axios.patch(`${API}/loans/${loan.id}/super-edit`, payload, { headers: authHeaders() });
      toast.success(regenerate ? 'Préstamo reescrito y tabla regenerada' : 'Préstamo actualizado');
      onSaved();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(Array.isArray(msg) ? (msg as string[])[0] : (msg as string | undefined) ?? 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-surface-border">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap size={18} className="text-amber-400" /> Modo Dios: Editar Préstamo
          </h3>
          <button onClick={onClose} className="text-text-secondary hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className={labelCls}>Concepto</label>
            <input type="text" value={form.concept} onChange={set('concept')} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Monto (MXN)</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tasa anual (%)</label>
              <input type="number" min="0" step="0.01" value={form.interestRate} onChange={set('interestRate')} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Plazo</label>
              <input type="number" min="1" step="1" value={form.termQuantity} onChange={set('termQuantity')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Unidad</label>
              <select value={form.termUnit} onChange={set('termUnit')} className={inputCls}>
                <option value="MESES">Meses</option>
                <option value="SEMANAS">Semanas</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Frecuencia</label>
              <select value={form.paymentFrequency} onChange={set('paymentFrequency')} className={inputCls}>
                <option value="MENSUAL">Mensual</option>
                <option value="QUINCENAL">Quincenal</option>
                <option value="SEMANAL">Semanal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha de inicio</label>
              <input type="date" value={form.startDate} onChange={set('startDate')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {LOAN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Cuenta de depósito</label>
            <input type="text" value={form.disbursementAccount} onChange={set('disbursementAccount')} className={inputCls} />
          </div>

          <label className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={regenerate}
              onChange={e => setRegenerate(e.target.checked)}
              className="mt-0.5 accent-red-500"
            />
            <span className="text-sm">
              <span className="text-white font-semibold">Regenerar tabla de amortización</span>
              <span className="flex items-center gap-1 text-red-400 text-xs mt-0.5">
                <AlertTriangle size={12} /> Borra todas las cuotas y pagos registrados.
              </span>
            </span>
          </label>
        </div>

        <div className="flex gap-3 p-5 border-t border-surface-border justify-end">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 rounded-lg text-text-primary hover:text-white transition-colors text-sm disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="bg-brand-green hover:bg-brand-green-light text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 text-sm shadow-lg shadow-brand-green/20"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
