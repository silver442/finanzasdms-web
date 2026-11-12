import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ScrollText, ChevronLeft, ChevronRight, Eye, RotateCcw } from 'lucide-react';
import AuditDetailsModal, { type AuditLogEntry } from '../../components/AuditDetailsModal';

interface AuditLogPage {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FilterOptions {
  actions: string[];
  entities: string[];
  admins: { id: string; email: string; name?: string | null }[];
}

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const PAGE_SIZE = 20;

const ACTION_META: Record<string, { label: string; cls: string }> = {
  SUPER_EDIT_LOAN:        { label: 'Modo Dios · Préstamo', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  SUPER_EDIT_INSTALLMENT: { label: 'Modo Dios · Cuota',    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  BLOCK_USER:             { label: 'Bloqueo de usuario',   cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
  UNBLOCK_USER:           { label: 'Desbloqueo de usuario', cls: 'bg-brand-green/10 text-brand-green-light border-brand-green/30' },
  PROMOTE_ADMIN:          { label: 'Promoción a admin',    cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  DEMOTE_ADMIN:           { label: 'Degradación de admin', cls: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
};

function actionMeta(action: string) {
  return ACTION_META[action] ?? { label: action, cls: 'bg-surface-elevated/50 text-text-primary border-surface-border' };
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const selectCls = 'bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors';

export default function AdminAuditLogs() {
  const [result, setResult] = useState<AuditLogPage | null>(null);
  const [options, setOptions] = useState<FilterOptions>({ actions: [], entities: [], admins: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [adminId, setAdminId] = useState('');
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    axios.get<FilterOptions>(`${API}/audit-logs/filters`, { headers: authHeaders() })
      .then(res => setOptions(res.data))
      .catch(() => { /* los filtros son opcionales: la tabla funciona sin ellos */ });
  }, []);

  // isLoading se enciende en los handlers que cambian la consulta (no aquí) y se apaga al responder.
  useEffect(() => {
    let cancelled = false;
    const params = {
      page,
      limit: PAGE_SIZE,
      ...(action && { action }),
      ...(entity && { entity }),
      ...(adminId && { adminId }),
    };
    axios.get<AuditLogPage>(`${API}/audit-logs`, { headers: authHeaders(), params })
      .then(res => { if (!cancelled) setResult(res.data); })
      .catch((e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!cancelled) toast.error(e?.response?.data?.message ?? 'Error al cargar la bitácora');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page, action, entity, adminId]);

  const goToPage = (p: number) => { setIsLoading(true); setPage(p); };

  // Cambiar un filtro regresa a la primera página
  const onFilter = (setter: (v: string) => void) => (e: { target: { value: string } }) => {
    setter(e.target.value);
    goToPage(1);
  };

  const hasFilters = !!(action || entity || adminId);
  const clearFilters = () => { setAction(''); setEntity(''); setAdminId(''); goToPage(1); };

  const logs = result?.data ?? [];

  return (
    <div className="p-4 sm:p-8 text-white font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-text-primary flex items-center gap-3">
          <ScrollText size={32} className="text-brand-green-light" />
          Bitácora de Auditoría
        </h1>
        <p className="text-text-secondary mt-2">Registro de acciones críticas ejecutadas por administradores</p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <select value={action} onChange={onFilter(setAction)} className={selectCls}>
          <option value="">Todas las acciones</option>
          {options.actions.map(a => <option key={a} value={a}>{actionMeta(a).label}</option>)}
        </select>
        <select value={entity} onChange={onFilter(setEntity)} className={selectCls}>
          <option value="">Todas las entidades</option>
          {options.entities.map(en => <option key={en} value={en}>{en}</option>)}
        </select>
        <select value={adminId} onChange={onFilter(setAdminId)} className={selectCls}>
          <option value="">Todos los administradores</option>
          {options.admins.map(a => <option key={a.id} value={a.id}>{a.name ? `${a.name} (${a.email})` : a.email}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-white transition-colors self-start sm:self-auto"
          >
            <RotateCcw size={14} /> Limpiar filtros
          </button>
        )}
      </div>

      {isLoading && !result ? (
        <div className="flex justify-center py-20 text-text-secondary">Cargando bitácora...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <ScrollText size={48} className="mx-auto mb-4 opacity-30" />
          <p>{hasFilters ? 'Ningún registro coincide con los filtros.' : 'Aún no hay acciones auditadas.'}</p>
        </div>
      ) : (
        <div className={`bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card overflow-hidden transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-base/40">
                  <th className="text-left px-5 py-3 text-text-secondary font-semibold whitespace-nowrap">Fecha / Hora</th>
                  <th className="text-left px-5 py-3 text-text-secondary font-semibold">Administrador</th>
                  <th className="text-left px-5 py-3 text-text-secondary font-semibold">Acción</th>
                  <th className="text-left px-5 py-3 text-text-secondary font-semibold">Entidad</th>
                  <th className="text-left px-5 py-3 text-text-secondary font-semibold">ID de la Entidad</th>
                  <th className="text-center px-5 py-3 text-text-secondary font-semibold">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {logs.map(log => {
                  const meta = actionMeta(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-surface-elevated/20 transition-colors">
                      <td className="px-5 py-4 text-text-secondary whitespace-nowrap tabular-nums">{fmtDateTime(log.createdAt)}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{log.admin.name ?? '—'}</p>
                        <p className="text-text-secondary text-xs">{log.admin.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded border font-semibold whitespace-nowrap ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className="px-5 py-4 text-text-primary">{log.entity}</td>
                      <td className="px-5 py-4 font-mono text-xs text-text-secondary">
                        {log.entity === 'Loan' ? (
                          <Link to={`/admin/loans/${log.entityId}`} className="hover:text-brand-green-light underline-offset-2 hover:underline" title={log.entityId}>
                            {log.entityId.slice(0, 8)}…
                          </Link>
                        ) : (
                          <span title={log.entityId}>{log.entityId.slice(0, 8)}…</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelected(log)}
                          className="inline-flex items-center gap-1.5 bg-brand-green/10 hover:bg-brand-green text-brand-green-light hover:text-white border border-brand-green/30 hover:border-brand-green px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                          <Eye size={14} /> Detalles
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {result && (
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-surface-border text-xs text-text-secondary">
              <span>{result.total} {result.total === 1 ? 'registro' : 'registros'} · Página {result.page} de {result.totalPages}</span>
              <div className="inline-flex gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || isLoading}
                  className="p-1.5 rounded-lg border border-surface-border hover:bg-surface-elevated disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= result.totalPages || isLoading}
                  className="p-1.5 rounded-lg border border-surface-border hover:bg-surface-elevated disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selected && (
        <AuditDetailsModal log={selected} actionLabel={actionMeta(selected.action).label} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
