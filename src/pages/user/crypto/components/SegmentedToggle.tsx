interface SegmentedToggleProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function SegmentedToggle<T extends string>({ value, options, onChange, ariaLabel }: SegmentedToggleProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex bg-surface-card/60 rounded-xl p-1 border border-white/10">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all whitespace-nowrap ${value === o.value ? 'bg-brand-green/25 border-brand-green/60 text-white shadow-inner' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
