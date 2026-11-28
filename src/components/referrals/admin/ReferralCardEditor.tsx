import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Eye, Plus, Trash2, Upload, X } from 'lucide-react';
import ReferralCardView from '../ReferralCardView';
import {
  API, CATEGORIES, CATEGORY_META, DEFAULT_CTA_LABEL, STATUS_META, apiError, authHeaders,
  type ReferralCard, type ReferralCardStatus, type ReferralCategory, type ReferralTemplate,
} from '../referralTypes';

interface Props {
  /** null = nueva tarjeta */
  card: ReferralCard | null;
  templates: ReferralTemplate[];
  defaultTemplateId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const MAX_STEPS = 6;
const MAX_FEATURES = 4;
const STATUSES: ReferralCardStatus[] = ['DRAFT', 'PUBLISHED', 'COMING_SOON', 'INACTIVE'];

const inputCls =
  'w-full bg-surface-base border border-surface-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors placeholder:text-text-muted';
const labelCls = 'block text-xs text-text-secondary font-semibold mb-1';

function Field({ label, required, children, className = '' }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className={labelCls}>{label} {required && <span className="text-red-400">*</span>}</label>
      {children}
    </div>
  );
}

// Lista editable de textos (pasos o características)
function ListEditor({ items, max, placeholder, onChange }: { items: string[]; max: number; placeholder: string; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={inputCls}
            value={item}
            onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))}
            placeholder={placeholder}
            maxLength={120}
          />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-text-muted hover:text-red-400 px-1" aria-label="Quitar">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, ''])} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green-light hover:text-brand-green">
          <Plus size={14} /> Agregar
        </button>
      )}
    </div>
  );
}

const orNull = (v: string) => (v.trim() ? v.trim() : null);

// Vista interna de /admin/referrals (no cambia de ruta) para crear o editar una tarjeta
export default function ReferralCardEditor({ card, templates, defaultTemplateId, onClose, onSaved }: Props) {
  const initialTemplate = card ? card.templateId : (defaultTemplateId ?? templates.find((t) => t.isActive)?.id ?? null);
  const [templateId, setTemplateId] = useState<string | null>(initialTemplate);
  const [category, setCategory] = useState<ReferralCategory>(
    card?.category ?? templates.find((t) => t.id === initialTemplate)?.category ?? 'FINTECH',
  );
  const [status, setStatus] = useState<ReferralCardStatus>(card?.status ?? 'DRAFT');
  const [brand, setBrand] = useState(card?.brand ?? '');
  const [categoryLabel, setCategoryLabel] = useState(card?.categoryLabel ?? '');
  const [benefitLabel, setBenefitLabel] = useState(card?.benefitLabel ?? '');
  const [title, setTitle] = useState(card?.title ?? '');
  const [description, setDescription] = useState(card?.description ?? '');
  const [steps, setSteps] = useState<string[]>(card?.steps.length ? card.steps : ['']);
  const [features, setFeatures] = useState<string[]>(card?.features ?? []);
  const [code, setCode] = useState(card?.code ?? '');
  const [link, setLink] = useState(card?.link ?? '');
  const [ctaLabel, setCtaLabel] = useState(card?.ctaLabel ?? '');
  const [termsUrl, setTermsUrl] = useState(card?.termsUrl ?? '');
  const [order, setOrder] = useState(card?.order ?? 0);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(card?.logoUrl ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Al abrir la vista, sube al inicio del contenedor con scroll
  useEffect(() => { rootRef.current?.scrollIntoView({ block: 'start' }); }, []);

  const template = templates.find((t) => t.id === templateId) ?? null;
  const comingSoon = status === 'COMING_SOON';

  const onTemplateChange = (id: string) => {
    const t = templates.find((x) => x.id === id) ?? null;
    setTemplateId(t?.id ?? null);
    if (t) setCategory(t.category);
  };

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El logo debe pesar máximo 5MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const preview: ReferralCard = useMemo(() => ({
    id: card?.id ?? 'preview',
    templateId,
    category,
    categoryLabel: orNull(categoryLabel),
    brand: brand || 'Marca',
    logoUrl: logoPreview,
    benefitLabel: orNull(benefitLabel),
    title: title || '$0 MXN',
    description,
    steps: steps.filter((s) => s.trim()),
    features: features.filter((f) => f.trim()),
    code: orNull(code),
    link: orNull(link),
    ctaLabel: orNull(ctaLabel),
    termsUrl: orNull(termsUrl),
    status,
    order,
    updatedAt: new Date().toISOString(),
    template: template ? { sections: template.sections, ctaLabel: template.ctaLabel } : null,
  }), [card?.id, templateId, category, categoryLabel, brand, logoPreview, benefitLabel, title, description, steps, features, code, link, ctaLabel, termsUrl, status, order, template]);

  const handleSave = async () => {
    if (!brand.trim() || !title.trim()) {
      toast.error(comingSoon ? 'Completa la marca y el título' : 'Completa la marca y el beneficio destacado');
      return;
    }
    if (status === 'PUBLISHED' && (!code.trim() || !link.trim())) {
      toast.error('Para publicar agrega el código de referido y la URL');
      return;
    }
    const payload = {
      templateId,
      category,
      categoryLabel: orNull(categoryLabel),
      brand: brand.trim(),
      benefitLabel: orNull(benefitLabel),
      title: title.trim(),
      description: description.trim(),
      steps: steps.map((s) => s.trim()).filter(Boolean),
      features: features.map((f) => f.trim()).filter(Boolean),
      code: orNull(code),
      link: orNull(link),
      ctaLabel: orNull(ctaLabel),
      termsUrl: orNull(termsUrl),
      status,
      order,
    };
    setIsSaving(true);
    try {
      const { data } = card
        ? await axios.patch<ReferralCard>(`${API}/referral-cards/${card.id}`, payload, { headers: authHeaders() })
        : await axios.post<ReferralCard>(`${API}/referral-cards`, payload, { headers: authHeaders() });
      if (logoFile) {
        const form = new FormData();
        form.append('logo', logoFile);
        try {
          await axios.post(`${API}/referral-cards/${data.id}/logo`, form, { headers: authHeaders() });
        } catch (err) {
          toast.error(apiError(err, 'La tarjeta se guardó, pero no se pudo subir el logo'));
        }
      }
      toast.success(card ? 'Tarjeta actualizada' : 'Tarjeta creada');
      onSaved();
    } catch (err) {
      toast.error(apiError(err, 'Error al guardar la tarjeta'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div ref={rootRef} className="space-y-6 scroll-mt-4">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Regresar a Tarjetas de Referidos
      </button>

      <div className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card">
        <div className="flex justify-between items-center gap-3 px-6 py-4 border-b border-white/5">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary">{card ? `Editar ${card.brand}` : 'Nueva tarjeta de referido'}</h1>
            <p className="text-sm text-text-secondary">Captura la información variable; la plantilla define qué secciones se muestran.</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setShowPreview((v) => !v)} className="lg:hidden inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
              <Eye size={16} /> {showPreview ? 'Formulario' : 'Vista previa'}
            </button>
            <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors" aria-label="Cerrar">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 p-6">
          {/* Formulario */}
          <div className={`lg:col-span-3 space-y-4 ${showPreview ? 'hidden lg:block' : ''}`}>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Plantilla">
                <select className={inputCls} value={templateId ?? ''} onChange={(e) => onTemplateChange(e.target.value)}>
                  <option value="">Sin plantilla (todas las secciones)</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id} disabled={!t.isActive && t.id !== templateId}>
                      {t.name}{t.isActive ? '' : ' (inactiva)'}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Estado">
                <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as ReferralCardStatus)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Marca" required>
                <input className={inputCls} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej. BBVA, GBM, Bitso" maxLength={60} />
              </Field>
              <Field label="Categoría">
                <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as ReferralCategory)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
                </select>
              </Field>
              <Field label="Etiqueta (opcional)">
                <input className={inputCls} value={categoryLabel} onChange={(e) => setCategoryLabel(e.target.value)} placeholder={CATEGORY_META[category].label} maxLength={40} />
              </Field>
            </div>

            <Field label="Logo (JPG, PNG o WebP, máx. 5MB)">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-surface-elevated border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                    : <Upload size={18} className="text-text-muted" />}
                </span>
                <label className="inline-flex items-center gap-2 border border-white/10 hover:border-brand-green/50 text-sm text-text-primary rounded-lg px-3 py-2 cursor-pointer transition-colors">
                  <Upload size={15} /> {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
                </label>
              </div>
            </Field>

            {comingSoon ? (
              <>
                <Field label="Título" required>
                  <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Alertas de criptomonedas" maxLength={80} />
                </Field>
                <Field label="Descripción">
                  <textarea className={`${inputCls} resize-none h-20`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qué podrá hacer el usuario cuando esté disponible" maxLength={400} />
                </Field>
                <Field label={`Características (máx. ${MAX_FEATURES})`}>
                  <ListEditor items={features} max={MAX_FEATURES} placeholder="Ej. Alertas de precios" onChange={setFeatures} />
                </Field>
              </>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Texto del beneficio">
                    <input className={inputCls} value={benefitLabel} onChange={(e) => setBenefitLabel(e.target.value)} placeholder="Bono de bienvenida de hasta" maxLength={80} />
                  </Field>
                  <Field label="Beneficio destacado" required>
                    <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="$1,500 MXN" maxLength={80} />
                  </Field>
                </div>
                <Field label={`Pasos para obtener la recompensa (máx. ${MAX_STEPS})`}>
                  <ListEditor items={steps} max={MAX_STEPS} placeholder="Ej. Abre tu cuenta con nuestro enlace." onChange={setSteps} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Código de referido" required={status === 'PUBLISHED'}>
                    <input className={`${inputCls} font-mono`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="CASHI1500" maxLength={40} />
                  </Field>
                  <Field label="URL de registro" required={status === 'PUBLISHED'}>
                    <input type="url" className={inputCls} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
                  </Field>
                  <Field label="Texto del botón">
                    <input className={inputCls} value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder={template?.ctaLabel ?? DEFAULT_CTA_LABEL} maxLength={40} />
                  </Field>
                  <Field label="URL de términos y condiciones">
                    <input type="url" className={inputCls} value={termsUrl} onChange={(e) => setTermsUrl(e.target.value)} placeholder="https://..." />
                  </Field>
                </div>
              </>
            )}

            <Field label="Orden (menor aparece primero)" className="sm:w-48">
              <input type="number" min={0} className={inputCls} value={order} onChange={(e) => setOrder(Math.max(0, Number(e.target.value) || 0))} />
            </Field>
          </div>

          {/* Vista previa */}
          <div className={`lg:col-span-2 ${showPreview ? '' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-4 space-y-2">
              <p className="font-bold text-text-primary flex items-center gap-2">
                <Eye size={18} className="text-brand-green-light" /> Vista previa en Gana Dinero
              </p>
              <ReferralCardView card={preview} />
              {(status === 'DRAFT' || status === 'INACTIVE') && (
                <p className="text-xs text-text-muted">Con estado {STATUS_META[status].label} la tarjeta no se muestra a los usuarios.</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-text-primary hover:text-white transition-colors">
            <ArrowLeft size={16} /> Regresar
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="bg-brand-green hover:bg-brand-green-light text-white px-5 py-2 rounded-xl font-bold transition-all shadow-lg shadow-brand-green/20 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : card ? 'Guardar cambios' : 'Crear tarjeta'}
          </button>
        </div>
      </div>
    </div>
  );
}
