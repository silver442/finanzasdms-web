/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Pencil, X } from 'lucide-react';

export interface SuperEditableInstallment {
  id: string;
  number: number;
  dueDate: string;
  amountDue: string | number;
  amountPaid: string | number;
  lateFeeAmount?: string | number;
  status: string;
}

interface SuperEditInstallmentModalProps {
  installment: SuperEditableInstallment;
  onClose: () => void;
  onSaved: () => void;
}

const API = import.meta.env.VITE_API_URL;
function authHeaders() { return { Authorization: `Bearer ${localStorage.getItem('token')}` }; }

const STATUSES: { value: string; label: string }[] = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'PAID', label: 'Pagada' },
  { value: 'OVERDUE', label: 'Vencida' },
];

const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors';
const labelCls = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1';

const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

function toForm(inst: SuperEditableInstallment) {
  return {
    dueDate: inst.dueDate.slice(0, 10),
    amountDue: String(Number(inst.amountDue)),
    amountPaid: String(Number(inst.amountPaid)),
    lateFeeAmount: String(Number(inst.lateFeeAmount ?? 0)),
    status: inst.status,
  };
}

// [SUPER_ADMIN] Cobranza fina: edita una cuota vía PATCH /loans/installments/:id/super-edit.
export default function SuperEditInstallmentModal({ installment, onClose, onSaved }: SuperEditInstallmentModalProps) {
  const initial = toForm(installment);
  const [form, setForm] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const currentFee = Number(initial.lateFeeAmount);

  const handleSave = async () => {
    const payload: Record<string, unknown> = {};
    if (form.dueDate !== initial.dueDate) payload.dueDate = new Date(`${form.dueDate}T12:00:00`).toISOString();
    if (form.amountDue !== initial.amountDue) payload.amountDue = Number(form.amountDue);
    if (form.amountPaid !== initial.amountPaid) payload.amountPaid = Number(form.amountPaid);
    if (form.lateFeeAmount !== initial.lateFeeAmount) payload.lateFeeAmount = Number(form.lateFeeAmount);
    if (form.status !== initial.status) payload.status = form.status;

    if (Object.keys(payload).length === 0) { toast.info('No hay cambios que guardar'); return; }

    setIsSaving(true);
    try {
      await axios.patch(`${API}/loans/installments/${installment.id}/super-edit`, payload, { headers: authHeaders() });
      toast.success(`Cuota #${installment.number} actualizada`);
      onSaved();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(Array.isArray(msg) ? (msg as string[])[0] : (msg as string | undefined) ?? 'Error al guardar la cuota');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-surface-border">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Pencil size={16} className="text-amber-400" /> Editar Cuota #{installment.number}
          </h3>
          <button onClick={onClose} className="text-text-secondary hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Vencimiento</label>
              <input type="date" value={form.dueDate} onChange={set('dueDate')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>A pagar (MXN)</label>
              <input type="number" min="0" step="0.01" value={form.amountDue} onChange={set('amountDue')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Abonado (MXN)</label>
              <input type="number" min="0" step="0.01" value={form.amountPaid} onChange={set('amountPaid')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Interés moratorio (MXN)</label>
            <div className="flex gap-2">
              <input type="number" min="0" step="0.01" value={form.lateFeeAmount} onChange={set('lateFeeAmount')} className={inputCls} />
              {currentFee > 0 && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, lateFeeAmount: '0' }))}
                  className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold bg-brand-green/10 hover:bg-brand-green/20 text-brand-green-light border border-brand-green/20 transition-colors"
                >
                  Condonar
                </button>
              )}
            </div>
            {currentFee > 0 && (
              <p className="text-xs text-text-muted mt-1">Mora actual: {fmt(currentFee)}</p>
            )}
          </div>

          <p className="text-xs text-text-muted">
            La cuota se guarda tal cual: no redistribuye saldo a otras cuotas ni cambia el estado del préstamo.
          </p>
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
