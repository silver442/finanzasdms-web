import axios from 'axios';
import { todayMx } from '../../../utils/dates';

export const API = import.meta.env.VITE_API_URL;

export function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

export function apiMessage(e: unknown): string | undefined {
  return axios.isAxiosError<{ message?: string }>(e) ? e.response?.data?.message : undefined;
}

export function fmt(v: number | string) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));
}

export const FREQ_LABEL: Record<string, string> = {
  MONTHLY: 'Mensual',
  BIMONTHLY: 'Bimestral',
  YEARLY: 'Anual',
};

// ─── Tipos de la API ─────────────────────────────────────────────────────────

export type MemberStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface SharedMember {
  id: string;
  email: string;
  status: MemberStatus;
  hasPaid: boolean;
  paidAt?: string | null;
  user: { name: string | null; email: string } | null;
}

export interface Sub {
  id: string;
  name: string;
  amount: number | string;
  frequency: 'MONTHLY' | 'BIMONTHLY' | 'YEARLY';
  chargeDay: number;
  creditCard?: { name: string; color?: string };
  creditCardId?: string;
  sharedSubscription?: { id: string; members: SharedMember[]; costPerMember: number } | null;
}

// GET /shared-subscriptions/mine
export interface SharedByMe {
  id: string;
  scheduledExpenseId: string;
  scheduledExpense: Pick<Sub, 'id' | 'name' | 'amount' | 'frequency' | 'chargeDay'>;
  members: SharedMember[];
  costPerMember: number;
}

// GET /shared-subscriptions/invited
export interface SharedWithMe {
  id: string;
  status: MemberStatus;
  hasPaid: boolean;
  costPerMember: number;
  sharedSubscription: {
    id: string;
    scheduledExpense: Pick<Sub, 'id' | 'name' | 'amount' | 'frequency' | 'chargeDay'>;
    owner: { name: string | null; email: string };
  };
}

// Usuario verificado por GET /shared-subscriptions/lookup-member
export interface PickedMember { name: string | null; email: string; }

// ─── Formulario ──────────────────────────────────────────────────────────────

export interface SubFormValues {
  name: string;
  amount: string;
  frequency: string;
  chargeDay: string;
  creditCardId: string;
}

export const EMPTY_FORM: SubFormValues = { name: '', amount: '', frequency: 'MONTHLY', chargeDay: '', creditCardId: '' };

// Sugerencias del buscador del formulario
export const POPULAR_SERVICES = [
  'Netflix', 'Spotify', 'Prime Video', 'YouTube Premium', 'Disney+', 'Max',
  'Apple Music', 'iCloud+', 'Google One', 'Xbox Game Pass', 'PlayStation Plus',
  'ChatGPT Plus', 'Gimnasio', 'Internet', 'Telefonía móvil',
];

// Próximo cobro mensual a partir del día de cobro (si el mes es corto, el último día del mes)
export function nextMonthlyCharge(chargeDay: number): Date {
  const [y, m, d] = todayMx().split('-').map(Number);
  const clamp = (year: number, month: number) =>
    new Date(year, month, Math.min(chargeDay, new Date(year, month + 1, 0).getDate()));
  const thisMonth = clamp(y, m - 1);
  return thisMonth.getDate() >= d ? thisMonth : clamp(y, m);
}

// Sin fecha de alta no se conoce el mes de cobro de bimestrales/anuales: solo se muestra el día
export function nextPaymentLabel(frequency: string, chargeDay: number): string {
  return frequency === 'MONTHLY'
    ? nextMonthlyCharge(chargeDay).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : `Día ${chargeDay}`;
}
