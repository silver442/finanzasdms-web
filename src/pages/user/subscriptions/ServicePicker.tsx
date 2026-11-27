import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, PenLine, Search } from 'lucide-react';
import ServiceLogo from '../../../components/ServiceLogo';
import {
  SERVICE_CATEGORIES, getServiceByName, searchServices, type SubscriptionService,
} from '../../../data/subscriptionServices';

interface ServicePickerProps {
  id?: string;
  value: string;
  onChange: (name: string) => void;
}

const OTHER_LABEL = 'Otro (personalizado)';

// Selector de servicio con buscador; "Otro" habilita un campo para escribir el nombre
export default function ServicePicker({ id, value, onChange }: ServicePickerProps) {
  const [custom, setCustom] = useState(() => value.trim() !== '' && !getServiceByName(value));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const customRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchServices(query), [query]);
  const otherIndex = results.length;
  const selected = custom ? undefined : getServiceByName(value);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const openPanel = () => {
    setQuery('');
    setActive(0);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const pick = (service: SubscriptionService) => {
    setCustom(false);
    onChange(service.name);
    close();
  };

  const pickOther = () => {
    // Lo que se buscó sirve de punto de partida para el nombre personalizado
    if (!custom) onChange(query.trim());
    setCustom(true);
    setOpen(false);
    requestAnimationFrame(() => customRef.current?.focus());
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, otherIndex)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (active === otherIndex) pickOther(); else pick(results[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  };

  const optionCls = (index: number) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
      index === active ? 'bg-brand-green/10 text-white' : 'text-text-primary hover:bg-surface-base/60'
    }`;

  return (
    <div ref={rootRef} className="relative flex flex-col gap-3">
      <button
        id={id} ref={triggerRef} type="button"
        aria-haspopup="listbox" aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={`w-full flex items-center gap-3 bg-surface-base/70 border text-left rounded-xl pl-2 pr-10 py-2 transition-colors focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 ${
          open ? 'border-brand-green' : 'border-surface-border'
        }`}
      >
        {selected ? (
          <>
            <ServiceLogo name={selected.name} size="sm" />
            <span className="text-white font-medium truncate">{selected.name}</span>
          </>
        ) : custom ? (
          <>
            <ServiceLogo name="" size="sm" />
            <span className="text-white font-medium truncate">{OTHER_LABEL}</span>
          </>
        ) : (
          <>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary shrink-0">
              <Search size={18} />
            </span>
            <span className="text-text-muted truncate">Busca Netflix, Spotify, Claude…</span>
          </>
        )}
        <ChevronDown size={18} className={`absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 top-full mt-2 bg-surface-elevated/95 backdrop-blur-lg border border-white/10 rounded-2xl shadow-card shadow-black/40 overflow-hidden">
          <div className="p-2 border-b border-surface-border">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                ref={searchRef} type="text" autoComplete="off"
                placeholder="Buscar servicio…" aria-label="Buscar servicio"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={handleSearchKey}
                className="w-full bg-surface-base/70 border border-surface-border text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-green placeholder:text-text-muted"
              />
            </div>
          </div>

          <div ref={listRef} role="listbox" aria-label="Servicios" className="max-h-72 overflow-y-auto p-1.5">
            {results.length === 0 && (
              <p className="px-3 py-4 text-sm text-text-secondary text-center">
                Sin coincidencias para “{query.trim()}”. Usa la opción personalizada.
              </p>
            )}
            {SERVICE_CATEGORIES.map((category) => {
              const items = results.filter((s) => s.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category}>
                  <p className="px-3 pt-2.5 pb-1 text-text-muted text-xs font-semibold uppercase tracking-wider">{category}</p>
                  {items.map((service) => {
                    const index = results.indexOf(service);
                    const isSelected = selected?.id === service.id;
                    return (
                      <button
                        key={service.id} type="button" role="option" aria-selected={isSelected}
                        data-index={index}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => pick(service)}
                        className={optionCls(index)}
                      >
                        <ServiceLogo name={service.name} size="sm" />
                        <span className="flex-1 truncate text-sm font-medium">{service.name}</span>
                        {isSelected && <Check size={16} className="text-brand-green-light shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="p-1.5 border-t border-surface-border">
            <button
              type="button" role="option" aria-selected={custom}
              data-index={otherIndex}
              onMouseEnter={() => setActive(otherIndex)}
              onClick={pickOther}
              className={optionCls(otherIndex)}
            >
              <ServiceLogo name="" size="sm" />
              <span className="flex-1 truncate text-sm font-medium">{OTHER_LABEL}</span>
              {custom && <Check size={16} className="text-brand-green-light shrink-0" />}
            </button>
          </div>
        </div>
      )}

      {custom && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
            <PenLine size={18} />
          </span>
          <input
            ref={customRef} type="text" required maxLength={80} autoComplete="off"
            aria-label="Nombre del servicio personalizado"
            placeholder="Escribe el nombre, ej. Gimnasio"
            value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full bg-surface-base/70 border border-surface-border text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-colors placeholder:text-text-muted"
          />
        </div>
      )}
    </div>
  );
}
