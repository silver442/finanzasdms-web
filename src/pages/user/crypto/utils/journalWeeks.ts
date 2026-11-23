export interface JournalDay {
  iso: string;
  day: number;
  inMonth: boolean;
}

export interface DayWeek {
  weekNumber: number;
  days: JournalDay[];
}

export interface SwingWeek {
  weekNumber: number;
  mondayIso: string;
  monday: Date;
  sunday: Date;
}

export const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Fechas como YYYY-MM-DD en hora local: coinciden con la columna @db.Date sin desfase de zona horaria
export function toIsoDate(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Semanas (lunes a domingo) que contienen al menos un día del mes; month es 1-12. */
export function getDayWeeks(year: number, month: number): DayWeek[] {
  const first = new Date(year, month - 1, 1);
  const cursor = new Date(first);
  cursor.setDate(1 - ((first.getDay() + 6) % 7));

  const weeks: DayWeek[] = [];
  while (cursor.getMonth() === month - 1 || weeks.length === 0) {
    const days: JournalDay[] = [];
    for (let i = 0; i < 7; i++) {
      days.push({ iso: toIsoDate(cursor), day: cursor.getDate(), inMonth: cursor.getMonth() === month - 1 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({ weekNumber: weeks.length + 1, days });
  }
  return weeks;
}

/** Semanas cuyo lunes cae dentro del mes (4 o 5); la entrada de Swing se guarda en ese lunes. */
export function getSwingWeeks(year: number, month: number): SwingWeek[] {
  const first = new Date(year, month - 1, 1);
  const monday = new Date(year, month - 1, 1 + ((8 - first.getDay()) % 7));

  const weeks: SwingWeek[] = [];
  while (monday.getMonth() === month - 1) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    weeks.push({ weekNumber: weeks.length + 1, mondayIso: toIsoDate(monday), monday: new Date(monday), sunday });
    monday.setDate(monday.getDate() + 7);
  }
  return weeks;
}
