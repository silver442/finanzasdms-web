import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  AlertTriangle, CheckCircle2, Landmark, MessageSquareText, Phone, UserCheck, Wallet, X, XCircle,
} from 'lucide-react';
import {
  API, apiError, authHeaders, fmt, fmtDate,
  type ApplicationStatus, type InvestorApplication,
} from '../../components/investor/investorTypes';

interface ApplicationRow extends InvestorApplication {
  user: { id: string; email: string; name: string | null; role: string; level: string; points: number; isBlocked: boolean; createdAt: string };
  reviewedBy: { id: string; email: string; name: string | null } | null;
  loanHistory: { total: number; active: number; paid: number; defaulted: number; hasOverdue: boolean };
}

const TABS: { value: ApplicationStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
];

const inputCls = 'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted';

// [SUPER_ADMIN] Solicitudes de clientes para volverse INVESTOR
export default function AdminInvestorApplications() {
  const [tab, setTab] = useState<ApplicationStatus>('PENDING');
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approveTarget, setApproveTarget] = useState<ApplicationRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApplicationRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRows = useCallback(async (status: ApplicationStatus) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get<ApplicationRow[]>(`${API}/investor-applications`, { params: { status }, headers: authHeaders() });
      setRows(data);
    } catch {
      toast.error('No se pudieron cargar las solicitudes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRows(tab); }, [fetchRows, tab]);

  const review = async (action: 'approve' | 'reject') => {
    const target = action === 'approve' ? approveTarget : rejectTarget;
    if (!target) return;
    setIsSubmitting(true);
    try {
      await axios.patch(
        `${API}/investor-applications/${target.id}/${action}`,
        action === 'reject' ? { reason: rejectReason.trim() || undefined } : {},
        { headers: authHeaders() },
      );
      toast.success(action === 'approve' ? `@${target.investorAlias} ya es inversionista` : 'Solicitud rechazada');
      setRows((prev) => prev.filter((r) => r.id !== target.id));
      setApproveTarget(null);
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      toast.error(apiError(err, 'No se pudo revisar la solicitud'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 text-white font-sans max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary flex items-center gap-3">
          <UserCheck size={30} className="text-brand-green-light" />
          Solicitudes de Inversionistas
        </h1>
        <p className="text-text-secondary mt-2">
          Al aprobar, el usuario pasa a INVESTOR con su alias y su cuenta de rendimientos. Se respeta el cupo y el switch de Configuración de Plataforma.
        </p>
      </div>

      <div className="flex gap-1 bg-surface-base rounded-xl p-1 mb-6 self-start w-fit" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value} role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.value ? 'bg-brand-green/10 text-brand-green-light' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-text-secondary">Cargando solicitudes...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <UserCheck size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay solicitudes {TABS.find((t) => t.value === tab)?.label.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rows.map((r) => (
            <article key={r.id} className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card overflow-hidden flex flex-col">
              <header className="p-5 border-b border-surface-border bg-surface-base/40 flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold text-text-primary truncate">{r.fullName}</h2>
                  <p className="text-brand-green-light text-sm font-semibold">@{r.investorAlias}</p>
                  <p className="text-text-secondary text-xs truncate">{r.user.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-text-primary font-bold">{r.age} años</p>
                  <p className="text-text-muted text-xs">{fmtDate(r.createdAt)}</p>
                </div>
              </header>

              <div className="p-5 space-y-4 flex-1 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-base rounded-lg p-3">
                    <p className="text-text-muted text-xs flex items-center gap-1"><Wallet size={12} /> Planea invertir</p>
                    <p className="text-text-primary font-bold">{fmt(r.estimatedAmount)}</p>
                  </div>
                  <div className="bg-surface-base rounded-lg p-3">
                    <p className="text-text-muted text-xs flex items-center gap-1"><Phone size={12} /> Teléfono</p>
                    <p className="text-text-primary">{r.phone}</p>
                  </div>
                </div>

                <div>
                  <p className="text-text-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <MessageSquareText size={12} /> Por qué le interesa
                  </p>
                  <p className="text-text-secondary whitespace-pre-line break-words">{r.reason}</p>
                </div>

                <div>
                  <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Historial en Cashi</p>
                  <p className="text-text-secondary">
                    Nivel {r.user.level.replace('_', ' ')} · {r.user.points} pts · miembro desde {fmtDate(r.user.createdAt)}
                  </p>
                  <p className="text-text-secondary">
                    {r.loanHistory.total} préstamos · {r.loanHistory.active} activos · {r.loanHistory.paid} liquidados
                  </p>
                  {(r.loanHistory.hasOverdue || r.loanHistory.defaulted > 0 || r.user.isBlocked) && (
                    <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                      <AlertTriangle size={12} />
                      {r.user.isBlocked ? 'Cuenta bloqueada' : r.loanHistory.hasOverdue ? 'Tiene cuotas vencidas' : 'Tiene préstamos en incumplimiento'}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2 bg-surface-base rounded-lg px-3 py-2">
                  <Landmark size={15} className="text-text-secondary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-text-primary font-semibold">{r.payoutBankName} · {r.payoutAccountHolder}</p>
                    <p className="font-mono text-text-secondary tracking-wider break-all">{r.payoutClabe}</p>
                  </div>
                </div>

                {r.status !== 'PENDING' && (
                  <p className="text-text-muted text-xs">
                    {r.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                    {r.reviewedAt && ` el ${fmtDate(r.reviewedAt)}`}
                    {r.reviewedBy && ` por ${r.reviewedBy.name ?? r.reviewedBy.email}`}
                    {r.rejectionReason && ` · Motivo: ${r.rejectionReason}`}
                  </p>
                )}
              </div>

              {r.status === 'PENDING' && (
                <div className="p-5 border-t border-surface-border flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setRejectTarget(r)}
                    className="sm:flex-1 flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white hover:border-red-500 px-4 py-2.5 rounded-xl font-bold transition-all"
                  >
                    <XCircle size={18} /> Rechazar
                  </button>
                  <button
                    onClick={() => setApproveTarget(r)}
                    className="sm:flex-1 flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-light text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20"
                  >
                    <CheckCircle2 size={18} /> Aprobar
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {(approveTarget || rejectTarget) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div role="alertdialog" aria-modal="true" className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-card w-full max-w-md max-h-[90dvh] overflow-y-auto p-5 sm:p-6">
            <div className="flex justify-between items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                {approveTarget
                  ? <><CheckCircle2 size={20} className="text-brand-green-light" /> ¿Aprobar inversionista?</>
                  : <><XCircle size={20} className="text-red-400" /> ¿Rechazar solicitud?</>}
              </h2>
              <button
                onClick={() => { setApproveTarget(null); setRejectTarget(null); setRejectReason(''); }}
                disabled={isSubmitting} className="p-1 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar"
              >
                <X size={22} />
              </button>
            </div>

            {approveTarget ? (
              <p className="text-text-secondary text-sm">
                <strong className="text-text-primary">{approveTarget.fullName}</strong> pasará a INVESTOR como{' '}
                <strong className="text-brand-green-light">@{approveTarget.investorAlias}</strong> y se registrará su cuenta de rendimientos
                ({approveTarget.payoutBankName}). Podrá fondear préstamos desde Inversiones.
              </p>
            ) : rejectTarget && (
              <>
                <p className="text-text-secondary text-sm mb-3">
                  Se le avisará a <strong className="text-text-primary">{rejectTarget.fullName}</strong>. Podrá volver a solicitar más adelante.
                </p>
                <label htmlFor="reject-reason" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Motivo (opcional, lo verá el usuario)</label>
                <textarea id="reject-reason" rows={3} maxLength={500} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className={`${inputCls} resize-y`} />
              </>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-surface-border">
              <button
                onClick={() => { setApproveTarget(null); setRejectTarget(null); setRejectReason(''); }}
                disabled={isSubmitting} className="flex-1 bg-surface-elevated text-text-primary py-2.5 rounded-xl transition-all font-medium"
              >
                Cancelar
              </button>
              {approveTarget ? (
                <button onClick={() => void review('approve')} disabled={isSubmitting}
                  className="flex-1 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl py-2.5 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-40">
                  {isSubmitting ? 'Aprobando...' : 'Aprobar'}
                </button>
              ) : (
                <button onClick={() => void review('reject')} disabled={isSubmitting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl py-2.5 transition-all disabled:opacity-40">
                  {isSubmitting ? 'Rechazando...' : 'Rechazar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
