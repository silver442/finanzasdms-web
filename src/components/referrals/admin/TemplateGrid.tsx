import { Copy, Info, Layers, Pencil } from 'lucide-react';
import { CATEGORY_META, SECTION_META, resolveSections, type ReferralTemplate } from '../referralTypes';

interface Props {
  templates: ReferralTemplate[];
  selectedId: string | null;
  onEdit: (t: ReferralTemplate) => void;
  onDuplicate: (t: ReferralTemplate) => void;
  onHelp: () => void;
}

export default function TemplateGrid({ templates, selectedId, onEdit, onDuplicate, onHelp }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2.5">
          <Layers size={22} className="text-brand-violet-light" /> Plantillas disponibles
        </h2>
        <button type="button" onClick={onHelp} className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 transition-colors">
          <Info size={15} /> ¿Cómo funcionan las plantillas?
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="text-text-muted text-sm py-6 text-center">No hay plantillas. Crea la primera con "Nueva Plantilla".</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
          {templates.map((t) => {
            const meta = CATEGORY_META[t.category];
            const Icon = meta.icon;
            const selected = t.id === selectedId;
            return (
              <article
                key={t.id}
                className={`bg-surface-card/60 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 shadow-card border transition-colors ${
                  selected ? 'border-brand-green-light shadow-green' : 'border-white/5'
                } ${t.isActive ? '' : 'opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-surface-elevated border border-white/5 flex items-center justify-center shrink-0">
                    <Icon size={20} className={meta.illustrationCls} />
                  </span>
                  <h3 className="flex-1 min-w-0 font-bold text-text-primary leading-tight">{t.name}</h3>
                  <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${
                    t.isActive ? 'bg-brand-green/15 text-brand-green-light border-brand-green/30' : 'bg-surface-elevated text-text-muted border-white/10'
                  }`}>
                    {t.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <p className="text-xs text-text-secondary -mt-1">{t.description}</p>

                <ul className="space-y-1">
                  {resolveSections({ template: t }).map(({ key, enabled }) => {
                    const SIcon = SECTION_META[key].icon;
                    return (
                      <li
                        key={key}
                        className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 bg-surface-base/50 ${
                          enabled ? 'text-text-primary' : 'text-text-muted line-through'
                        }`}
                      >
                        <SIcon size={14} className="shrink-0 text-text-secondary" />
                        {SECTION_META[key].label}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(t)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 whitespace-nowrap bg-brand-violet/10 hover:bg-brand-violet/20 border border-brand-violet/30 text-violet-200 text-xs font-semibold rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <Pencil size={14} /> Editar plantilla
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(t)}
                    title="Duplicar"
                    aria-label="Duplicar plantilla"
                    className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap border border-white/10 hover:border-white/20 text-text-secondary hover:text-text-primary text-xs font-semibold rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <Copy size={14} /> <span className="2xl:hidden">Duplicar</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
