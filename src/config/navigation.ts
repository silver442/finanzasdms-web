import type React from 'react';
import {
  Activity, LayoutDashboard, CreditCard, CalendarClock, Landmark, PieChart, Bitcoin, TrendingUp,
  ChartLine, Calculator, HandCoins, Wallet, GraduationCap,
} from 'lucide-react';

// ─── Flags de módulos (localStorage.user) ─────────────────────────────────────

export type UserFlags = {
  hasCreditCardsModule: boolean;
  hasLoansModule: boolean;
  hasCryptoModule: boolean;
  hasStockMarketModule: boolean;
  hasCompoundInterestModule: boolean;
  hasSubscriptionsModule: boolean;
  hasMakeMoneyModule: boolean;
  hasExternalDebtModule: boolean;
  hasBudgetModule: boolean;
  hasFinanceAcademyModule: boolean;
};

function defaultFlags(): UserFlags {
  return { hasCreditCardsModule: false, hasLoansModule: true, hasCryptoModule: false, hasStockMarketModule: false, hasCompoundInterestModule: false, hasSubscriptionsModule: false, hasMakeMoneyModule: true, hasExternalDebtModule: false, hasBudgetModule: false, hasFinanceAcademyModule: false };
}

export function getUserFlags(): UserFlags {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return defaultFlags();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      hasCreditCardsModule:      parsed.hasCreditCardsModule     === true,
      hasLoansModule:            parsed.hasLoansModule           !== false,
      hasCryptoModule:           parsed.hasCryptoModule          === true,
      hasStockMarketModule:      parsed.hasStockMarketModule     === true,
      hasCompoundInterestModule: parsed.hasCompoundInterestModule === true,
      hasSubscriptionsModule:    parsed.hasSubscriptionsModule    === true,
      hasMakeMoneyModule:        parsed.hasMakeMoneyModule        !== false,
      hasExternalDebtModule:     parsed.hasExternalDebtModule     === true,
      hasBudgetModule:           parsed.hasBudgetModule           === true,
      hasFinanceAcademyModule:   parsed.hasFinanceAcademyModule   === true,
    };
  } catch { return defaultFlags(); }
}

// ─── Módulos de usuario (compartidos por Sidebar y BottomNav) ─────────────────

export type UserModule = {
  name: string;
  shortName: string;
  path: string;
  icon: React.ElementType;
  requiredFlag?: keyof UserFlags;
};

export const userModules: UserModule[] = [
  { name: 'Resumen Financiero',  shortName: 'Resumen',     path: '/dashboard',       icon: LayoutDashboard },
  { name: 'Tarjetas de Crédito', shortName: 'Tarjetas',    path: '/credit-cards',    icon: CreditCard,    requiredFlag: 'hasCreditCardsModule'     },
  { name: 'Suscripciones',       shortName: 'Suscrip.',    path: '/subscriptions',   icon: CalendarClock, requiredFlag: 'hasSubscriptionsModule'   },
  { name: 'Préstamos',           shortName: 'Préstamos',   path: '/loans',           icon: Landmark,      requiredFlag: 'hasLoansModule'           },
  { name: 'Portafolio',          shortName: 'Portafolio',  path: '/portfolio',       icon: PieChart                                                },
  { name: 'Monitor de Cuentas',  shortName: 'Monitor',     path: '/monitor-cuentas', icon: Activity                                                },
  { name: 'Inversiones Cripto',  shortName: 'Cripto',      path: '/crypto',          icon: Bitcoin,       requiredFlag: 'hasCryptoModule'          },
  { name: 'Gana Dinero',         shortName: 'Gana Dinero', path: '/investments',     icon: TrendingUp,    requiredFlag: 'hasMakeMoneyModule'       },
  { name: 'Bolsa de Valores',    shortName: 'Bolsa',       path: '/stocks',            icon: ChartLine,     requiredFlag: 'hasStockMarketModule'      },
  { name: 'Interés Compuesto',   shortName: 'Interés',     path: '/compound-interest', icon: Calculator,    requiredFlag: 'hasCompoundInterestModule' },
  { name: 'Deuda Externa',       shortName: 'Deuda',       path: '/external-debt',     icon: HandCoins,     requiredFlag: 'hasExternalDebtModule'     },
  { name: 'Presupuesto',         shortName: 'Presupuesto', path: '/budget',            icon: Wallet,        requiredFlag: 'hasBudgetModule'           },
  { name: 'Academia de Finanzas', shortName: 'Academia',   path: '/academy',           icon: GraduationCap, requiredFlag: 'hasFinanceAcademyModule'   },
];
