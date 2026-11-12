import { useState } from 'react';
import { FileDiff, X } from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues: unknown;
  newValues: unknown;
  createdAt: string;
  admin: { id: string; email: string; name?: string | null; role: string };
}

interface AuditDetailsModalProps {
  log: AuditLogEntry;
  actionLabel: string;
  onClose: () => void;
}

type FieldDiff = { key: string; before: unknown; after: unknown; changed: boolean };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// Compara campo a campo cuando ambos lados son objetos; si no, no hay diff por campo.
function diffFields(oldValues: unknown, newValues: unknown): FieldDiff[] | null {
  const before = oldValues ?? {};
  const after = newValues ?? {};
  if (!isPlainObject(before) || !isPlainObject(after)) return null;

  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
  return keys.map(key => ({
    key,
    before: before[key],
    after: after[key],
    changed: JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  }));
}

function formatValue(v: unknown): string {
  if (v === undefined) return '—';
  if (v === null) return 'null';
  if (typeof v === 'string') return v;
  return JSON.stringify(v, null, 2);
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

const preCls = 'text-xs font-mono whitespace-pre-wrap break-all';

export default function AuditDetailsModal({ log, actionLabel, onClose }: AuditDetailsModalProps) {
  const [view, setView] = useState<'diff' | 'raw'>('diff');
  const [showAll, setShowAll] = useState(false);

  const fields = diffFields(log.oldValues, log.newValues);
  const changedCount = fields?.filter(f => f.changed).length ?? 0;
  const visible = fields?.filter(f => showAll || f.changed) ?? [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex justify-between items-start gap-4 p-5 border-b border-surface-border">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileDiff size={16} className="text-brand-green-light" /> {actionLabel}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              {fmtDateTime(log.createdAt)} · {log.admin.name ?? log.admin.email}
            </p>
            <p className="text-xs text-text-muted mt-0.5 font-mono break-all">
              {log.entity} · {log.entityId}
            </p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-white shrink-0" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
          <div className="inline-flex bg-surface-base/60 border border-surface-border rounded-xl p-1">
            {([['diff', 'Cambios'], ['raw', 'JSON completo']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setView(value)}
                disabled={value === 'diff' && !fields}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${view === value
                  ? 'bg-brand-green/10 text-brand-green-light border border-brand-green/20'
                  : 'text-text-secondary hover:text-white border border-transparent'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {view === 'diff' && fields && (
            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none">
              <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="accent-brand-green" />
              Mostrar campos sin cambios
            </label>
          )}
        </div>

        {/* Contenido */}
        <div className="p-5 overflow-y-auto">
          {view === 'diff' && fields ? (
            <>
              <p className="text-xs text-text-muted mb-3">
                {changedCount} {changedCount === 1 ? 'campo modificado' : 'campos modificados'} de {fields.length}
              </p>
              {visible.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">Sin diferencias entre los valores anterior y nuevo.</p>
              ) : (
                <div className="border border-surface-border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[minmax(8rem,auto)_1fr_1fr] text-xs font-semibold text-text-secondary bg-surface-base/40 border-b border-surface-border">
                    <div className="px-3 py-2">Campo</div>
                    <div className="px-3 py-2">Antes</div>
                    <div className="px-3 py-2">Después</div>
                  </div>
                  <div className="divide-y divide-slate-700/50">
                    {visible.map(f => (
                      <div key={f.key} className={`grid grid-cols-[minmax(8rem,auto)_1fr_1fr] ${f.changed ? '' : 'opacity-50'}`}>
                        <div className="px-3 py-2 text-xs font-mono font-semibold text-text-primary break-all">{f.key}</div>
                        <div className={`px-3 py-2 ${f.changed ? 'bg-red-500/5 text-red-300' : 'text-text-secondary'}`}>
                          <pre className={preCls}>{formatValue(f.before)}</pre>
                        </div>
                        <div className={`px-3 py-2 ${f.changed ? 'bg-brand-green/5 text-brand-green-light' : 'text-text-secondary'}`}>
                          <pre className={preCls}>{formatValue(f.after)}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([['oldValues', log.oldValues], ['newValues', log.newValues]] as const).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">{label}</p>
                  <pre className={`${preCls} bg-surface-base/60 border border-surface-border rounded-xl p-3 text-text-primary max-h-[60vh] overflow-auto`}>
                    {value === null || value === undefined ? 'null' : JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
