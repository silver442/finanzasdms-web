const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export const fmtMXN = (v: number) => MXN.format(v);

export const fmtPercent = (ratio: number) =>
  new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 0 }).format(ratio);
