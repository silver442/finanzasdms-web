export const CARD = 'bg-surface-card/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-card';

// Validada (skill dataviz) contra surface-card #162032: ahorrador, interés simple, compuesto/inversión.
// Verde↔ámbar queda en el piso CVD (7.9): siempre acompañar con leyenda y línea punteada para el ahorrador.
export const SERIES_COLORS = { saver: '#3B82F6', simple: '#D97706', compound: '#059669' } as const;

export const AXIS_PROPS = { stroke: '#64748B', tick: { fill: '#94A3B8', fontSize: 12 }, tickLine: false, axisLine: false } as const;
export const GRID_STROKE = 'rgba(255,255,255,0.06)';

// Encabezado fijo al hacer scroll y primera columna fija en móvil
export const TH = 'sticky top-0 z-10 bg-surface-elevated px-3 md:px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted text-right whitespace-nowrap first:text-left first:left-0 first:z-20';
export const TD = 'px-3 md:px-4 py-2 text-right whitespace-nowrap text-text-primary first:text-left first:sticky first:left-0 first:bg-surface-card first:text-text-secondary first:font-semibold';
export const TR = 'border-t border-white/5 hover:bg-surface-elevated/40';
