import { CreditCard, Landmark } from 'lucide-react';

// Cuenta para recibir rendimientos: CLABE interbancaria o tarjeta de débito; el largo exacto lo marca el tipo
export type PayoutType = 'CLABE' | 'CARD';

export const PAYOUT_TYPES: Record<PayoutType, { label: string; short: string; digits: number; Icon: typeof Landmark; placeholder: string }> = {
  CLABE: { label: 'CLABE interbancaria', short: 'CLABE', digits: 18, Icon: Landmark, placeholder: '18 dígitos' },
  CARD:  { label: 'Tarjeta de débito', short: 'tarjeta', digits: 16, Icon: CreditCard, placeholder: '16 dígitos' },
};

// El backend guarda ambos en el mismo campo; el tipo se deduce por el largo
export const payoutTypeOf = (number: string | null | undefined): PayoutType => (number?.length === 16 ? 'CARD' : 'CLABE');

export const onlyDigits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

export const PHONE_DIGITS = 10;
