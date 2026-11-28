import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Layers, Plus, Trash2, TrendingUp, X } from 'lucide-react';
import ReferralCardView from '../../components/referrals/ReferralCardView';
import TemplateGrid from '../../components/referrals/admin/TemplateGrid';
import TemplateEditorPanel from '../../components/referrals/admin/TemplateEditorPanel';
import ReferralCardsTable from '../../components/referrals/admin/ReferralCardsTable';
import ReferralCardEditor from '../../components/referrals/admin/ReferralCardEditor';
import {
  API, apiError, authHeaders,
  type ReferralCard, type ReferralCardStatus, type ReferralTemplate,
} from '../../components/referrals/referralTypes';

// null = sin editor; 'new' = nueva plantilla; string = id de la plantilla en edición
type EditorTarget = string | 'new' | null;

export default function AdminReferrals() {
  const [cards, setCards] = useState<ReferralCard[]>([]);
  const [templates, setTemplates] = useState<ReferralTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editor, setEditor] = useState<EditorTarget>(null);
  // En pantallas < xl el editor es un panel superpuesto que se abre a demanda
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Vista interna para crear/editar tarjeta: reemplaza el listado sin cambiar de ruta
  const [cardEditor, setCardEditor] = useState<{ card: ReferralCard | null } | null>(null);
  const [previewTarget, setPreviewTarget] = useState<ReferralCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReferralCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [c, t] = await Promise.all([
        axios.get<ReferralCard[]>(`${API}/referral-cards/manage`, { headers: authHeaders() }),
        axios.get<ReferralTemplate[]>(`${API}/referral-templates`, { headers: authHeaders() }),
      ]);
      setCards(c.data);
      setTemplates(t.data);
      setEditor((prev) => prev ?? t.data[0]?.id ?? null);
    } catch {
      toast.error('No se pudieron cargar las tarjetas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con la API al montar
  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const editingTemplate = editor && editor !== 'new' ? templates.find((t) => t.id === editor) ?? null : null;

  const openEditor = (target: string | 'new') => {
    setEditor(target);
    setDrawerOpen(true);
  };

  const closeEditor = () => {
    setEditor(null);
    setDrawerOpen(false);
  };

  const handleDuplicate = async (t: ReferralTemplate) => {
    try {
      const { data } = await axios.post<ReferralTemplate>(`${API}/referral-templates/${t.id}/duplicate`, {}, { headers: authHeaders() });
      toast.success('Plantilla duplicada');
      await fetchAll();
      openEditor(data.id);
    } catch (err) {
      toast.error(apiError(err, 'Error al duplicar la plantilla'));
    }
  };

  const handleStatus = async (card: ReferralCard, status: ReferralCardStatus) => {
    try {
      await axios.patch(`${API}/referral-cards/${card.id}`, { status }, { headers: authHeaders() });
      toast.success(status === 'PUBLISHED' ? 'Tarjeta publicada' : status === 'INACTIVE' ? 'Tarjeta desactivada' : 'Estado actualizado');
      void fetchAll();
    } catch (err) {
      toast.error(apiError(err, 'Error al cambiar el estado'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API}/referral-cards/${deleteTarget.id}`, { headers: authHeaders() });
      toast.success('Tarjeta eliminada');
      setDeleteTarget(null);
      void fetchAll();
    } catch {
      toast.error('Error al eliminar la tarjeta');
    } finally {
      setIsDeleting(false);
    }
  };

  if (cardEditor) {
    return (
      <div className="p-4 sm:p-8 text-white font-sans max-w-7xl mx-auto">
        <ReferralCardEditor
          card={cardEditor.card}
          templates={templates}
          defaultTemplateId={editingTemplate?.id}
          onClose={() => setCardEditor(null)}
          onSaved={() => { setCardEditor(null); void fetchAll(); }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 text-white font-sans xl:flex xl:gap-6 xl:items-start">
      <div className="flex-1 min-w-0 space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-violet-light flex items-center gap-3">
              <TrendingUp size={30} />
              Tarjetas de Referidos
            </h1>
            <p className="text-text-secondary mt-1">Crea, organiza y publica tarjetas desde plantillas reutilizables.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => openEditor('new')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-text-primary px-4 py-2.5 rounded-xl font-semibold transition-colors"
            >
              <Plus size={18} /> Nueva Plantilla
            </button>
            <button
              type="button"
              onClick={() => setCardEditor({ card: null })}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-light text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20"
            >
              <Plus size={18} /> Nueva Tarjeta
            </button>
          </div>
        </div>

        {/* ── Banner ── */}
        <div className="flex items-center gap-4 bg-brand-green/10 border border-brand-green/30 rounded-2xl px-5 py-4">
          <span className="w-11 h-11 rounded-xl bg-brand-green/20 flex items-center justify-center shrink-0">
            <Layers size={22} className="text-brand-green-light" />
          </span>
          <div>
            <p className="font-bold text-text-primary">Plantillas editables para crear más rápido</p>
            <p className="text-sm text-text-secondary">
              Define una estructura base para Bancos, SOFIPOs, Brokers y Fintechs. Luego solo actualiza la información variable de cada tarjeta.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20 text-text-secondary">Cargando tarjetas...</div>
        ) : (
          <>
            <ReferralCardsTable
              cards={cards}
              templates={templates}
              onEdit={(card) => setCardEditor({ card })}
              onPreview={setPreviewTarget}
              onStatus={(card, status) => void handleStatus(card, status)}
              onDelete={setDeleteTarget}
            />
            <div className="border-t border-white/5" />
            <TemplateGrid
              templates={templates}
              selectedId={editor !== 'new' ? editor : null}
              onEdit={(t) => openEditor(t.id)}
              onDuplicate={(t) => void handleDuplicate(t)}
              onHelp={() => setShowHelp(true)}
            />
          </>
        )}
      </div>

      {/* ── Editor de plantilla: columna lateral en xl, panel superpuesto en móvil ── */}
      {editor && (editor === 'new' || editingTemplate) && (
        <aside
          className={`${drawerOpen ? 'fixed' : 'hidden'} inset-0 z-40 overflow-y-auto bg-surface-base p-4 sm:p-6
            xl:block xl:z-auto xl:w-96 xl:shrink-0 xl:p-5 xl:bg-surface-card/60 xl:backdrop-blur-md xl:border xl:border-white/5 xl:rounded-2xl xl:shadow-card xl:sticky xl:top-4 xl:max-h-screen`}
        >
          <TemplateEditorPanel
            key={editor}
            template={editingTemplate}
            previewCard={editingTemplate ? cards.find((c) => c.templateId === editingTemplate.id) : undefined}
            onClose={closeEditor}
            onSaved={(t) => { setEditor(t.id); void fetchAll(); }}
            onDeleted={() => { closeEditor(); void fetchAll(); }}
          />
        </aside>
      )}

      {/* ── Modal: Vista previa ── */}
      {previewTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPreviewTarget(null)}>
          <div className="w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-text-primary">Vista previa en Gana Dinero</p>
              <button type="button" onClick={() => setPreviewTarget(null)} className="text-text-secondary hover:text-text-primary" aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <ReferralCardView card={previewTarget} />
          </div>
        </div>
      )}

      {/* ── Modal: ¿Cómo funcionan las plantillas? ── */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-surface-card/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 w-full max-w-lg shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">¿Cómo funcionan las plantillas?</h3>
              <button type="button" onClick={() => setShowHelp(false)} className="text-text-secondary hover:text-text-primary" aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary list-disc pl-5">
              <li>Una plantilla define qué secciones muestra la tarjeta y en qué orden (arrastra las filas o usa Subir/Bajar).</li>
              <li>Cada tarjeta se crea desde una plantilla y solo captura los datos variables: marca, monto, pasos, código y URL.</li>
              <li>Los cambios en una plantilla se reflejan al instante en todas las tarjetas que la usan.</li>
              <li>Solo las tarjetas <strong className="text-text-primary">Publicadas</strong> y <strong className="text-text-primary">Próximamente</strong> se ven en Gana Dinero.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar eliminación ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Eliminar tarjeta</h3>
            <p className="text-text-secondary text-sm mb-6">
              ¿Seguro que deseas eliminar la tarjeta de{' '}
              <strong className="text-white">{deleteTarget.brand}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-text-primary hover:text-white transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
