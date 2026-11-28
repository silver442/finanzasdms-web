import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ChevronDown, ChevronUp, Eye, GripVertical, Pencil, Save, Trash2, X,
} from 'lucide-react';
import ReferralCardView from '../ReferralCardView';
import Toggle from './Toggle';
import { sampleCard } from './sampleCard';
import {
  API, CATEGORIES, CATEGORY_META, DEFAULT_CTA_LABEL, DEFAULT_SECTIONS, SECTION_META,
  apiError, authHeaders, resolveSections,
  type ReferralCard, type ReferralCategory, type ReferralTemplate, type TemplateSection,
} from '../referralTypes';

interface Props {
  /** null = nueva plantilla */
  template: ReferralTemplate | null;
  /** Tarjeta real que usa la plantilla, para la vista previa */
  previewCard?: ReferralCard;
  onClose: () => void;
  onSaved: (t: ReferralTemplate) => void;
  onDeleted: (id: string) => void;
}

const SECTION_HELP: Record<TemplateSection['key'], string> = {
  GENERAL: 'Logo, marca, chip de categoría y badge "Disponible".',
  BENEFIT: 'Texto corto (ej. "Bono de bienvenida de hasta") y monto destacado en verde.',
  STEPS: 'Lista "¿Cómo obtener tu recompensa?" con hasta 6 pasos.',
  CODE: 'Caja con el código de referido y botón Copiar.',
  CTA: 'Botón verde que abre el enlace de registro.',
  LEGAL: 'Enlace "Consultar términos y condiciones" (si la tarjeta tiene URL de términos).',
};

const inputCls =
  'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted';

export default function TemplateEditorPanel({ template, previewCard, onClose, onSaved, onDeleted }: Props) {
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [category, setCategory] = useState<ReferralCategory>(template?.category ?? 'FINTECH');
  const [ctaLabel, setCtaLabel] = useState(template?.ctaLabel ?? DEFAULT_CTA_LABEL);
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [sections, setSections] = useState<TemplateSection[]>(
    template ? resolveSections({ template }) : DEFAULT_SECTIONS,
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const meta = CATEGORY_META[category];
  const CatIcon = meta.icon;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length || from === to) return;
    setSections((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const toggle = (key: string, enabled: boolean) =>
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, enabled } : s)));

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Ponle nombre a la plantilla');
      return;
    }
    if (!sections.some((s) => s.enabled)) {
      toast.error('Activa al menos una sección');
      return;
    }
    setIsSaving(true);
    const payload = {
      name: name.trim(), description: description.trim(), category,
      ctaLabel: ctaLabel.trim() || DEFAULT_CTA_LABEL, isActive, sections,
    };
    try {
      const { data } = template
        ? await axios.patch<ReferralTemplate>(`${API}/referral-templates/${template.id}`, payload, { headers: authHeaders() })
        : await axios.post<ReferralTemplate>(`${API}/referral-templates`, payload, { headers: authHeaders() });
      toast.success(template ? 'Plantilla guardada' : 'Plantilla creada');
      onSaved(data);
    } catch (err) {
      toast.error(apiError(err, 'Error al guardar la plantilla'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    try {
      await axios.delete(`${API}/referral-templates/${template.id}`, { headers: authHeaders() });
      toast.success('Plantilla eliminada');
      onDeleted(template.id);
    } catch (err) {
      toast.error(apiError(err, 'Error al eliminar la plantilla'));
    }
  };

  const preview: ReferralCard = previewCard
    ? { ...previewCard, template: { sections, ctaLabel } }
    : sampleCard(category, ctaLabel);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Pencil size={20} className="text-brand-violet-light" />
            {template ? 'Editor de plantilla' : 'Nueva plantilla'}
          </h2>
          <p className="text-sm text-text-secondary">Personaliza la estructura reutilizable de tus tarjetas.</p>
        </div>
        <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar editor">
          <X size={20} />
        </button>
      </div>

      {/* Estructura base */}
      <div className="bg-surface-elevated/70 border border-white/8 rounded-xl p-3 space-y-3">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-surface-base border border-white/5 flex items-center justify-center shrink-0">
            <CatIcon size={20} className={meta.illustrationCls} />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-text-primary text-sm">Estructura base: {name || 'Sin nombre'}</p>
            <p className="text-xs text-text-secondary">Campos variables: marca, monto, condiciones, código, URL</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className={`${inputCls} col-span-2`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej. Broker / Exchange)" maxLength={60} />
          <input className={`${inputCls} col-span-2`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción corta" maxLength={200} />
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as ReferralCategory)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
          </select>
          <label className="flex items-center justify-between gap-2 text-sm text-text-secondary bg-surface-base border border-surface-border rounded-lg px-3">
            Activa <Toggle checked={isActive} onChange={setIsActive} label="Plantilla activa" />
          </label>
        </div>
      </div>

      {/* Secciones */}
      <ul className="space-y-2">
        {sections.map((s, i) => {
          const sm = SECTION_META[s.key];
          const SIcon = sm.icon;
          const open = expanded === s.key;
          return (
            <li
              key={s.key}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIndex !== null) move(dragIndex, i); setDragIndex(null); }}
              onDragEnd={() => setDragIndex(null)}
              className={`bg-surface-card/60 border rounded-xl transition-colors ${dragIndex === i ? 'border-brand-green/50 opacity-60' : 'border-white/5'}`}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <GripVertical size={16} className="text-text-muted cursor-grab shrink-0" />
                <SIcon size={18} className="text-text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${s.enabled ? 'text-text-primary' : 'text-text-muted'}`}>{sm.title}</p>
                  <p className="text-xs text-text-muted truncate">{sm.subtitle}</p>
                </div>
                <Toggle checked={s.enabled} onChange={(v) => toggle(s.key, v)} label={sm.title} />
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : s.key)}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                  aria-label={open ? 'Contraer' : 'Expandir'}
                >
                  <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {open && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-white/5">
                  <p className="text-xs text-text-secondary">{SECTION_HELP[s.key]}</p>
                  {s.key === 'CTA' && (
                    <input className={inputCls} value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder={DEFAULT_CTA_LABEL} maxLength={40} />
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30">
                      <ChevronUp size={14} /> Subir
                    </button>
                    <button type="button" onClick={() => move(i, i + 1)} disabled={i === sections.length - 1} className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30">
                      <ChevronDown size={14} /> Bajar
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Vista previa */}
      <div className="space-y-2">
        <div>
          <p className="font-bold text-text-primary flex items-center gap-2">
            <Eye size={18} className="text-brand-green-light" /> Vista previa en Gana Dinero
          </p>
          <p className="text-xs text-text-secondary">Así se verá la tarjeta pública con esta plantilla.</p>
        </div>
        <ReferralCardView card={preview} sections={sections} />
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl px-4 py-3 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-50"
      >
        <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar plantilla'}
      </button>

      {template && (
        confirmDelete ? (
          <div className="flex items-center justify-between gap-2 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            <span className="text-red-300">
              ¿Eliminar? {template._count?.cards ? `${template._count.cards} tarjeta(s) quedarán sin plantilla.` : ''}
            </span>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-text-secondary hover:text-text-primary">Cancelar</button>
              <button type="button" onClick={() => void handleDelete()} className="font-bold text-red-400 hover:text-red-300">Eliminar</button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center justify-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 size={14} /> Eliminar plantilla
          </button>
        )
      )}
    </div>
  );
}
