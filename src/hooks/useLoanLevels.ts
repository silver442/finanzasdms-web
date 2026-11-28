import { useEffect, useState } from 'react';
import axios from 'axios';

export type PaymentFrequency = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';

export interface LoanLevelInfo {
  level: string;
  name: string;
  minPoints: number;
  maxAmount: number;
  interestRate: number;
  term: number; // plazo máximo en meses
  frequencies: PaymentFrequency[];
  autoPromote: boolean;
}

export const FREQUENCY_LABEL: Record<PaymentFrequency, 'Semanal' | 'Quincenal' | 'Mensual'> = {
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
};

const FREQUENCY_ORDER: PaymentFrequency[] = ['SEMANAL', 'QUINCENAL', 'MENSUAL'];

// Respaldo mientras carga o si falla la petición (mismos valores por defecto que el backend)
const FALLBACK_LEVELS: LoanLevelInfo[] = [
  { level: 'NOVATO_1',    name: 'Novato I',      minPoints: 0,    maxAmount: 500,   interestRate: 50, term: 6,  frequencies: ['SEMANAL'],                         autoPromote: true  },
  { level: 'NOVATO_2',    name: 'Novato II',     minPoints: 100,  maxAmount: 1000,  interestRate: 50, term: 6,  frequencies: ['SEMANAL', 'QUINCENAL'],            autoPromote: true  },
  { level: 'NOVATO_3',    name: 'Novato III',    minPoints: 200,  maxAmount: 1500,  interestRate: 48, term: 9,  frequencies: ['SEMANAL', 'QUINCENAL'],            autoPromote: true  },
  { level: 'CUMPLIDOR_1', name: 'Cumplidor I',   minPoints: 300,  maxAmount: 2000,  interestRate: 45, term: 12, frequencies: FREQUENCY_ORDER,                    autoPromote: true  },
  { level: 'CUMPLIDOR_2', name: 'Cumplidor II',  minPoints: 500,  maxAmount: 3000,  interestRate: 42, term: 12, frequencies: FREQUENCY_ORDER,                    autoPromote: true  },
  { level: 'CUMPLIDOR_3', name: 'Cumplidor III', minPoints: 750,  maxAmount: 4000,  interestRate: 40, term: 18, frequencies: FREQUENCY_ORDER,                    autoPromote: true  },
  { level: 'SOCIO_1',     name: 'Socio I',       minPoints: 1000, maxAmount: 7000,  interestRate: 35, term: 18, frequencies: FREQUENCY_ORDER,                    autoPromote: true  },
  { level: 'SOCIO_2',     name: 'Socio II',      minPoints: 1500, maxAmount: 10000, interestRate: 30, term: 24, frequencies: FREQUENCY_ORDER,                    autoPromote: true  },
  { level: 'ELITE',       name: 'Élite',         minPoints: 9999, maxAmount: 15000, interestRate: 25, term: 24, frequencies: FREQUENCY_ORDER,                    autoPromote: false },
];

interface ApiLoanLevel extends Omit<LoanLevelInfo, 'maxAmount' | 'interestRate'> {
  maxAmount: string | number;
  interestRate: string | number;
  order: number;
  isActive: boolean;
}

// Frecuencias en orden fijo (Semanal → Mensual), sin importar cómo vengan de la API
export function sortFrequencies(freqs: PaymentFrequency[]): PaymentFrequency[] {
  return FREQUENCY_ORDER.filter((f) => freqs.includes(f));
}

// Niveles de préstamo configurados por el SUPER_ADMIN (GET /loan-levels, solo activos para clientes).
// includeInactive: el SUPER_ADMIN también recibe los inactivos (para ver a usuarios que siguen en uno).
export function useLoanLevels(includeInactive = false): { levels: LoanLevelInfo[]; isLoading: boolean } {
  const [levels, setLevels] = useState<LoanLevelInfo[]>(FALLBACK_LEVELS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    axios.get<ApiLoanLevel[]>(`${import.meta.env.VITE_API_URL}/loan-levels`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(({ data }) => {
        if (cancelled || data.length === 0) return;
        setLevels(
          data
            .filter((l) => includeInactive || l.isActive)
            .sort((a, b) => a.order - b.order || a.minPoints - b.minPoints)
            .map((l) => ({
              level: l.level,
              name: l.name,
              minPoints: l.minPoints,
              maxAmount: Number(l.maxAmount),
              interestRate: Number(l.interestRate),
              term: l.term,
              frequencies: sortFrequencies(l.frequencies),
              autoPromote: l.autoPromote,
            })),
        );
      })
      .catch(() => { /* se queda con los valores por defecto */ })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [includeInactive]);

  return { levels, isLoading };
}
