import type React from 'react';
import {
  Activity, LayoutDashboard, CreditCard, CalendarClock, Landmark, PieChart, Bitcoin, TrendingUp,
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
};

function defaultFlags(): UserFlags {
  return { hasCreditCardsModule: false, hasLoansModule: true, hasCryptoModule: false, hasStockMarketModule: false, hasCompoundInterestModule: false, hasSubscriptionsModule: false, hasMakeMoneyModule: true };
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
];
