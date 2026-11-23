import type { ReferenceMode } from '../types';

// Inicio del periodo de referencia en hora local: hoy 00:00 (Day) o lunes 00:00 (Swing)
export function getPeriodStart(mode: ReferenceMode, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (mode === 'SWING') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}
