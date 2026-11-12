export interface CardStatement {
  periodStart: string;
  cutoffDate: string;
  dueDate: string;
  debt: number;
  isPaid: boolean;
}

export interface CreditCardItem {
  id: string;
  name: string;
  color?: string;
  bank?: string | null;
  lastFour?: string | null;
  creditLimit: number | string;
  cutoffDay: number;
  paymentDueDay?: number | null;
  currentBalance: number | string;
  nextCutoffDate: string;
  paymentDeadline: string;
  statement: CardStatement;
  usedBalance: number;
  availableCredit: number;
  utilizationPct: number;
  createdAt: string;
}

export interface CardTransaction {
  id: string;
  amount: number | string;
  description: string;
  type: 'ORDINARY' | 'MSI';
  months: number;
  date: string;
  isMSI: boolean;
  totalMonths: number;
  /** Mensualidades MSI ya facturadas en cortes cerrados */
  billedMonths: number;
  /** Mensualidad MSI que se acumula en el periodo en curso */
  currentMonth: number;
  monthlyPayment: number;
}

export interface CardPayment {
  id: string;
  amount: number | string;
  paymentDate: string;
  reference?: string | null;
  notes?: string | null;
}

export interface CreditCardDetailItem extends CreditCardItem {
  transactions: CardTransaction[];
}

export const DEFAULT_CARD_COLOR = '#10B981';

export function fmt(v: number | string) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));
}

/** "26 de octubre" */
export function fmtDayMonth(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
}

// Palabras clave del nombre → archivo en public/banks/{slug}.png
const BANK_KEYWORDS: [slug: string, keywords: string[]][] = [
  ['mercadopago', ['mercado pago', 'mercadopago']],
  ['santander', ['santander']],
  ['amex', ['amex', 'american express']],
  ['hey', ['hey']],
  ['uala', ['uala']],
  ['plata', ['plata']],
  ['didi', ['didi']],
  ['klar', ['klar']],
  ['bbva', ['bbva', 'bancomer']],
  ['banamex', ['banamex', 'citi']],
  ['banorte', ['banorte']],
  ['hsbc', ['hsbc']],
  ['scotiabank', ['scotia']],
  ['rappi', ['rappi']],
  ['stori', ['stori']],
  ['liverpool', ['liverpool']],
  ['invex', ['invex']],
  ['banregio', ['banregio']],
  ['bancoppel', ['coppel']],
  ['nu', ['nu']],
];

export function inferBankSlug(name: string): string | null {
  const normalized = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const words = normalized.split(/[^a-z0-9]+/);
  for (const [slug, keywords] of BANK_KEYWORDS) {
    // "nu" debe ser palabra completa para no confundirse con "nueva", "numero", etc.
    if (keywords.some(k => (k.length <= 3 ? words.includes(k) : normalized.includes(k)))) return slug;
  }
  return null;
}

export const CARD_COLORS = ['#10B981', '#3B82F6', '#A855F7', '#EC4899', '#F97316', '#EAB308', '#06B6D4', '#64748B'];

// Espejo de fintech-core/api/src/credit-cards/card-statement.util.ts para previsualizar en formularios
function dayInMonth(year: number, month: number, day: number): Date {
  return new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()));
}

/** Próximo corte (hoy incluido) para un día de corte 1-31. */
export function nextCutoffDate(cutoffDay: number, now = new Date()): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = dayInMonth(today.getFullYear(), today.getMonth(), cutoffDay);
  return thisMonth >= today ? thisMonth : dayInMonth(today.getFullYear(), today.getMonth() + 1, cutoffDay);
}

/** Fecha límite de pago de un corte: siguiente `paymentDueDay` posterior al corte, o corte + 20 días. */
export function dueDateFor(cutoff: Date, paymentDueDay?: number | null): Date {
  if (!paymentDueDay) return new Date(cutoff.getFullYear(), cutoff.getMonth(), cutoff.getDate() + 20);
  const sameMonth = dayInMonth(cutoff.getFullYear(), cutoff.getMonth(), paymentDueDay);
  return sameMonth > cutoff ? sameMonth : dayInMonth(cutoff.getFullYear(), cutoff.getMonth() + 1, paymentDueDay);
}

/** Color semáforo según % de utilización de la línea. */
export function utilizationColor(pct: number) {
  if (pct < 30) return '#34D399';  // emerald-400
  if (pct <= 70) return '#FBBF24'; // amber-400
  return '#FB7185';                // rose-400
}
