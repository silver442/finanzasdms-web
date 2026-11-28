export type PaymentFrequency = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';

// GET /loan-levels (Decimal llega como string)
export interface LoanLevel {
  id: string;
  level: string;
  name: string;
  minPoints: number;
  maxAmount: string | number;
  interestRate: string | number;
  term: number;
  frequencies: PaymentFrequency[];
  order: number;
  autoPromote: boolean;
  isActive: boolean;
}

export const FREQUENCIES: { value: PaymentFrequency; label: string }[] = [
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINCENAL', label: 'Quincenal' },
  { value: 'MENSUAL', label: 'Mensual' },
];

// Valores del enum UserLevel con su nombre sugerido (cada uno admite una sola fila)
export const USER_LEVELS: { value: string; label: string }[] = [
  { value: 'NOVATO_1', label: 'Novato I' },
  { value: 'NOVATO_2', label: 'Novato II' },
  { value: 'NOVATO_3', label: 'Novato III' },
  { value: 'CUMPLIDOR_1', label: 'Cumplidor I' },
  { value: 'CUMPLIDOR_2', label: 'Cumplidor II' },
  { value: 'CUMPLIDOR_3', label: 'Cumplidor III' },
  { value: 'SOCIO_1', label: 'Socio I' },
  { value: 'SOCIO_2', label: 'Socio II' },
  { value: 'ELITE', label: 'Élite' },
];

export const API = import.meta.env.VITE_API_URL;

export function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

export const fmt = (v: number | string) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(v));
