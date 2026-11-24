import type { LucideIcon } from 'lucide-react';
import {
  Briefcase, Bus, Ellipsis, GraduationCap, Gamepad2, HeartPulse, Home, Laptop, PiggyBank, Repeat, Shirt, ShoppingCart, Sparkles, TrendingUp, Zap,
} from 'lucide-react';

export type BudgetType = 'INCOME' | 'EXPENSE';

export interface BudgetCategory {
  /** Nombre guardado en BD; debe coincidir con `BUDGET_CATEGORIES` del backend (`src/budget/budget.config.ts`) */
  id: string;
  /** Texto del chip (puede ser más descriptivo que el id) */
  label: string;
  icon: LucideIcon;
  /** Ejemplos para el placeholder de la nota */
  hint: string;
}

export const BUDGET_CATEGORIES: Record<BudgetType, BudgetCategory[]> = {
  INCOME: [
    { id: 'Sueldo', label: 'Sueldo', icon: Briefcase, hint: 'Quincena, aguinaldo' },
    { id: 'Negocio / Freelance', label: 'Negocio / Freelance', icon: Laptop, hint: 'Cliente, ventas' },
    { id: 'Inversiones', label: 'Inversiones', icon: TrendingUp, hint: 'Rendimientos, dividendos' },
    { id: 'Extras', label: 'Extras', icon: Sparkles, hint: 'Bono, regalo' },
    { id: 'Otros', label: 'Otros', icon: PiggyBank, hint: 'Préstamo, reembolso' },
  ],
  EXPENSE: [
    { id: 'Mandado', label: 'Mandado', icon: ShoppingCart, hint: 'Súper, mercado' },
    { id: 'Servicios', label: 'Servicios (Luz/Agua/Gas/Internet)', icon: Zap, hint: 'Luz CFE, Internet, Gas' },
    { id: 'Vivienda', label: 'Vivienda', icon: Home, hint: 'Renta, hipoteca' },
    { id: 'Transporte', label: 'Transporte', icon: Bus, hint: 'Gasolina, Uber' },
    { id: 'Suscripciones', label: 'Suscripciones', icon: Repeat, hint: 'Netflix, Spotify' },
    { id: 'Ropa', label: 'Ropa', icon: Shirt, hint: 'Zapatos, uniforme' },
    { id: 'Educación', label: 'Educación', icon: GraduationCap, hint: 'Colegiatura, curso' },
    { id: 'Juegos / Ocio', label: 'Juegos / Ocio', icon: Gamepad2, hint: 'Cine, videojuegos' },
    { id: 'Salud', label: 'Salud', icon: HeartPulse, hint: 'Farmacia, consulta' },
    { id: 'Otros', label: 'Otros', icon: Ellipsis, hint: 'Regalos, imprevistos' },
  ],
};

export const findCategory = (type: BudgetType, id: string) =>
  BUDGET_CATEGORIES[type].find((c) => c.id === id) ?? { id, label: id, icon: Ellipsis, hint: '' };

// Top 3 categorías de gasto + "Resto" en gris. Validada (skill dataviz) contra surface-card #162032.
export const BREAKDOWN_COLORS: readonly string[] = ['#E0603F', '#3B82F6', '#D97706'];
export const BREAKDOWN_REST_COLOR: string = '#475569';
