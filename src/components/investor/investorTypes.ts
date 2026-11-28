export const API = import.meta.env.VITE_API_URL;

export function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

export const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiError(err: any, fallback: string): string {
  const msg = err?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg ?? fallback;
}

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface InvestorApplication {
  id: string;
  fullName: string;
  investorAlias: string;
  age: number;
  phone: string;
  estimatedAmount: number;
  reason: string;
  payoutBankName: string;
  payoutClabe: string;
  payoutAccountHolder: string;
  status: ApplicationStatus;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

// GET /investor-applications/me
export interface MyInvestorStatus {
  role: string;
  investorAlias: string | null;
  acceptingInvestors: boolean;
  hasCapacity: boolean;
  canApply: boolean;
  application: InvestorApplication | null;
}

export const FREQUENCY_LABELS: Record<string, string> = {
  MENSUAL: 'Mensual',
  QUINCENAL: 'Quincenal',
  SEMANAL: 'Semanal',
};

export const LOAN_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'En revisión',
  ESPERANDO_CONFIRMACION: 'Esperando al cliente',
  PENDIENTE_TRANSFERIR: 'Por desembolsar',
  ACTIVE: 'Activo',
  PAID: 'Liquidado',
  REJECTED: 'Rechazado',
  CANCELADO: 'Cancelado',
  CANCELADO_POR_ADMIN: 'Cancelado',
  DEFAULTED: 'En incumplimiento',
};
