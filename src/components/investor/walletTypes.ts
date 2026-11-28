// Tipos de la cartera del inversionista, marketplace y calendario (src/wallet, loan-funding/investor-marketplace)

export type WalletTxType = 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_FUNDING' | 'PAYOUT_RECEIVED' | 'REFUND';
export type WalletTxStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTxType;
  amount: number;
  status: WalletTxStatus;
  referenceId: string | null;
  notes: string | null;
  proofUrl: string | null;
  createdAt: string;
  processedAt: string | null;
}

// GET /wallet/me
export interface WalletSummary {
  id: string;
  availableBalance: number;
  investedBalance: number;
  totalAccountValue: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  updatedAt: string;
  transactions: WalletTransaction[];
}

export interface BankAccountInfo {
  id: string;
  bankName: string;
  clabe: string;
  accountHolder: string;
}

// GET /loans/marketplace
export interface MarketplaceLoan {
  id: string;
  rating: string;
  level: string;
  points: number;
  interestRate: number;
  rateIsEstimated: boolean;
  purpose: string;
  termQuantity: number;
  termUnit: 'SEMANAS' | 'MESES';
  paymentFrequency: string;
  status: string;
  amount: number;
  fundedAmount: number;
  remainingAmount: number;
  fundedPercentage: number;
  investorsCount: number;
  myContribution: number;
  requestedAt: string;
  fundingDeadline: string;
  daysRemaining: number;
}

// GET /loans/marketplace/:id
export interface MarketplaceDetail {
  loan: {
    id: string;
    purpose: string;
    status: string;
    amount: number;
    interestRate: number;
    rateIsEstimated: boolean;
    termQuantity: number;
    termUnit: 'SEMANAS' | 'MESES';
    paymentFrequency: string;
    totalInterest: number;
    totalToRepay: number;
    fundedAmount: number;
    remainingAmount: number;
    fundedPercentage: number;
    requestedAt: string;
    fundingDeadline: string;
    daysRemaining: number;
  };
  borrower: {
    rating: string;
    level: string;
    points: number;
    memberSince: string;
    state: string | null;
    country: string | null;
    housingStatus: string | null;
    monthlyIncome: number | null;
    monthlyExpenses: number | null;
    expenseToIncomeRatio: number | null;
    history: {
      totalLoans: number;
      activeLoans: number;
      paidLoans: number;
      defaultedLoans: number;
      totalBorrowed: number;
      installmentsPaid: number;
      installmentsPaidOnTime: number;
      onTimeRate: number | null;
      hasOverdue: boolean;
    };
  };
  fundings: { investorAlias: string | null; amount: number; percentage: number; isMine: boolean; createdAt: string }[];
  platformFeePercent: number;
  amortization: { number: number; dueDate: string; amountDue: number; principal: number; interest: number; remainingPrincipal: number }[];
}

// GET /investor/my-loans
export interface InvestorLoan {
  fundingId: string;
  loanId: string;
  purpose: string;
  status: string;
  rating: string;
  level: string;
  loanAmount: number;
  interestRate: number;
  rateIsEstimated: boolean;
  termQuantity: number;
  termUnit: 'SEMANAS' | 'MESES';
  paymentFrequency: string;
  contributedAmount: number;
  percentage: number;
  fromWalletAmount: number;
  refundedAt: string | null;
  capitalRecovered: number;
  outstandingCapital: number;
  interestEarned: number;
  platformFeesPaid: number;
  totalReceived: number;
  expectedNetInterest: number;
  nextPayment: { dueDate: string; installmentStatus: string; principal: number; netInterest: number } | null;
  fundedAt: string;
}

// GET /investor/calendar
export interface CalendarPayment {
  loanId: string;
  purpose: string;
  rating: string;
  level: string;
  installmentId: string;
  installmentNumber: number;
  installmentStatus: string;
  dueDate: string;
  principal: number;
  netInterest: number;
  total: number;
  receivedAmount: number;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD (hora de México)
  payments: CalendarPayment[];
  totalPrincipal: number;
  totalNetInterest: number;
  total: number;
}

export interface InvestorCalendar {
  month: number;
  year: number;
  days: CalendarDay[];
  monthTotal: { principal: number; netInterest: number; total: number; received: number; pending: number; paymentsCount: number };
}

export const WALLET_TX_LABELS: Record<WalletTxType, string> = {
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Retiro',
  LOAN_FUNDING: 'Fondeo de préstamo',
  PAYOUT_RECEIVED: 'Pago recibido',
  REFUND: 'Reembolso',
};

// Movimientos que suman al disponible (el resto lo restan)
export const WALLET_TX_INCOMING: Record<WalletTxType, boolean> = {
  DEPOSIT: true,
  WITHDRAWAL: false,
  LOAN_FUNDING: false,
  PAYOUT_RECEIVED: true,
  REFUND: true,
};

export const WALLET_STATUS_STYLES: Record<WalletTxStatus, { label: string; cls: string }> = {
  PENDING: { label: 'Pendiente', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  APPROVED: { label: 'Aprobado', cls: 'bg-brand-green/15 text-brand-green-light border-brand-green/25' },
  REJECTED: { label: 'Rechazado', cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
};

export const termLabel = (quantity: number, unit: 'SEMANAS' | 'MESES') =>
  `${quantity} ${unit === 'SEMANAS' ? (quantity === 1 ? 'semana' : 'semanas') : quantity === 1 ? 'mes' : 'meses'}`;

export const shortId = (id: string) => id.slice(0, 8).toUpperCase();

export const LEVEL_LABELS: Record<string, string> = {
  NOVATO_1: 'Novato I', NOVATO_2: 'Novato II', NOVATO_3: 'Novato III',
  CUMPLIDOR_1: 'Cumplidor I', CUMPLIDOR_2: 'Cumplidor II', CUMPLIDOR_3: 'Cumplidor III',
  SOCIO_1: 'Socio I', SOCIO_2: 'Socio II', ELITE: 'Élite',
};

// Avisa a la barra lateral y a las vistas abiertas que cambió el saldo
export const WALLET_UPDATED_EVENT = 'wallet-updated';
export const notifyWalletUpdated = () => window.dispatchEvent(new Event(WALLET_UPDATED_EVENT));
