import { ALL_TAB_ICON, CATEGORIES, CATEGORY_META, type ReferralCategory } from './referralTypes';

interface Props {
  value: ReferralCategory | 'ALL';
  onChange: (value: ReferralCategory | 'ALL') => void;
}

const TABS: { key: ReferralCategory | 'ALL'; label: string; icon: typeof ALL_TAB_ICON }[] = [
  { key: 'ALL', label: 'Todas', icon: ALL_TAB_ICON },
  ...CATEGORIES.map((c) => ({ key: c, label: CATEGORY_META[c].plural, icon: CATEGORY_META[c].tabIcon })),
];

// Filtro de promociones por categoría; en móvil se desplaza horizontalmente
export default function CategoryTabs({ value, onChange }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {TABS.map(({ key, label, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex-1 min-w-32 inline-flex items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 border font-semibold transition-colors ${
              active
                ? 'bg-brand-green/15 border-brand-green-light text-text-primary shadow-inner'
                : 'bg-surface-card/60 border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20'
            }`}
          >
            <Icon size={20} className={active ? 'text-brand-green-light' : ''} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
