import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Clock, Copy, CreditCard, EllipsisVertical, Eye, FileText, Pencil, Power, Rocket, Search, Trash2,
} from 'lucide-react';
import {
  CATEGORY_META, STATUS_META, fmtDateTime,
  type ReferralCard, type ReferralCardStatus, type ReferralTemplate,
} from '../referralTypes';

interface Props {
  cards: ReferralCard[];
  templates: ReferralTemplate[];
  onEdit: (card: ReferralCard) => void;
  onPreview: (card: ReferralCard) => void;
  onStatus: (card: ReferralCard, status: ReferralCardStatus) => void;
  onDelete: (card: ReferralCard) => void;
}

function copyCode(code: string) {
  void navigator.clipboard.writeText(code);
  toast.success('Código copiado');
}

const smallBtn = 'inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5 border transition-colors whitespace-nowrap';

export default function ReferralCardsTable({ cards, templates, onEdit, onPreview, onStatus, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('ALL');
  // El menú es fixed para que el overflow de la tabla no lo recorte
  const [menu, setMenu] = useState<{ card: ReferralCard; top: number; right: number } | null>(null);

  const templateName = (card: ReferralCard) =>
    card.template?.name ?? templates.find((t) => t.id === card.templateId)?.name ?? 'Sin plantilla';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (templateFilter === 'NONE' && c.templateId) return false;
      if (templateFilter !== 'ALL' && templateFilter !== 'NONE' && c.templateId !== templateFilter) return false;
      if (!q) return true;
      return [c.brand, c.code ?? '', c.template?.name ?? ''].some((v) => v.toLowerCase().includes(q));
    });
  }, [cards, search, templateFilter]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2.5 flex-1">
          <CreditCard size={22} className="text-brand-green-light" /> Tarjetas creadas desde plantilla
        </h2>
        <div className="relative lg:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por marca, código o plantilla..."
            className="w-full bg-surface-card/60 border border-white/10 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-green placeholder:text-text-muted"
          />
        </div>
        <select
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          className="bg-surface-card/60 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
        >
          <option value="ALL">Todas las plantillas</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          <option value="NONE">Sin plantilla</option>
        </select>
      </div>

      <div className="bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-white/5">
              <th className="px-4 py-3 font-semibold">Tarjeta</th>
              <th className="px-4 py-3 font-semibold">Plantilla usada</th>
              <th className="px-4 py-3 font-semibold">Beneficio</th>
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Última actualización</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                  {cards.length === 0 ? 'No hay tarjetas. Crea la primera con "Nueva Tarjeta".' : 'Sin resultados.'}
                </td>
              </tr>
            )}
            {filtered.map((card) => {
              const meta = CATEGORY_META[card.category];
              const CatIcon = meta.icon;
              const st = STATUS_META[card.status];
              const isVisible = card.status === 'PUBLISHED' || card.status === 'COMING_SOON';
              return (
                <tr key={card.id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-40">
                      <span className="w-10 h-10 rounded-lg bg-surface-elevated border border-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {card.logoUrl
                          ? <img src={card.logoUrl} alt={card.brand} className="w-full h-full object-contain p-1" />
                          : <CatIcon size={18} className="text-brand-green-light" />}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-text-primary truncate">{card.brand}</p>
                        <p className="text-xs text-text-secondary">{card.categoryLabel || meta.label}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 bg-surface-elevated border border-white/10 rounded-lg px-2.5 py-1 text-xs text-text-primary whitespace-nowrap">
                      <CatIcon size={14} className={meta.illustrationCls} /> {templateName(card)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-primary min-w-28">{card.title}</td>
                  <td className="px-4 py-3">
                    {card.code ? (
                      <button
                        type="button"
                        onClick={() => copyCode(card.code!)}
                        className="inline-flex items-center gap-1.5 bg-surface-base/60 border border-white/10 rounded-lg px-2 py-1 font-mono font-bold text-xs text-brand-green-light hover:border-brand-green/40"
                      >
                        {card.code} <Copy size={12} className="text-text-secondary" />
                      </button>
                    ) : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${st.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{fmtDateTime(card.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => onEdit(card)} className={`${smallBtn} border-brand-violet/30 text-violet-200 hover:bg-brand-violet/15`}>
                        <Pencil size={12} /> Editar
                      </button>
                      <button type="button" onClick={() => onPreview(card)} className={`${smallBtn} border-white/10 text-text-primary hover:border-white/20`}>
                        <Eye size={12} /> Vista previa
                      </button>
                      {isVisible ? (
                        <button type="button" onClick={() => onStatus(card, 'INACTIVE')} className={`${smallBtn} border-red-500/30 text-red-300 hover:bg-red-500/10`}>
                          <Power size={12} /> Desactivar
                        </button>
                      ) : (
                        <button type="button" onClick={() => onStatus(card, 'PUBLISHED')} className={`${smallBtn} border-brand-green/30 text-brand-green-light hover:bg-brand-green/10`}>
                          <Rocket size={12} /> Publicar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          setMenu(menu?.card.id === card.id ? null : { card, top: r.bottom + 4, right: window.innerWidth - r.right });
                        }}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5"
                        aria-label="Más acciones"
                      >
                        <EllipsisVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 w-52 bg-surface-elevated border border-white/10 rounded-xl shadow-card py-1"
            style={{ top: menu.top, right: menu.right }}
          >
            {menu.card.status !== 'COMING_SOON' && (
              <button type="button" onClick={() => { setMenu(null); onStatus(menu.card, 'COMING_SOON'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-white/5">
                <Clock size={14} /> Marcar Próximamente
              </button>
            )}
            {menu.card.status !== 'DRAFT' && (
              <button type="button" onClick={() => { setMenu(null); onStatus(menu.card, 'DRAFT'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-white/5">
                <FileText size={14} /> Pasar a borrador
              </button>
            )}
            <button type="button" onClick={() => { setMenu(null); onDelete(menu.card); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </>
      )}
    </section>
  );
}
