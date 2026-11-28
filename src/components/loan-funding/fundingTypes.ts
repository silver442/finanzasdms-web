export interface LoanFunding {
  id: string;
  investorId: string;
  amount: number;
  percentage: number;
  createdAt: string;
  // En /funding/opportunities solo llegan id, role e investorAlias
  investor: { id: string; role: string; email?: string; name?: string | null; investorAlias?: string | null };
}

// Alias de inversionista (@usuario) si lo tiene; si no, nombre o correo
export function investorLabel(investor: LoanFunding['investor']): string {
  if (investor.investorAlias) return `@${investor.investorAlias}`;
  return investor.name ?? investor.email ?? 'Fondeador';
}

export interface FundingProgress {
  loanAmount: number;
  fundedAmount: number;
  remainingAmount: number;
  fundedPercentage: number;
  isFullyFunded: boolean;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

// Espejo de getFundingSummary (backend): tolerancia de medio centavo por redondeo.
export function summarizeFunding(loanAmount: number, fundings: LoanFunding[] = []): FundingProgress {
  const fundedAmount = round2(fundings.reduce((s, f) => s + Number(f.amount), 0));
  const remainingAmount = round2(Math.max(loanAmount - fundedAmount, 0));
  return {
    loanAmount,
    fundedAmount,
    remainingAmount,
    fundedPercentage: loanAmount > 0 ? (fundedAmount / loanAmount) * 100 : 0,
    isFullyFunded: loanAmount > 0 && remainingAmount < 0.005,
  };
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  INVESTOR: 'Inversionista',
};
