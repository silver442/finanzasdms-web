export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

// SUPER_ADMIN hereda todos los permisos de ADMIN.
export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

// Sección "Inversionista" del Sidebar: quienes fondean préstamos desde su cartera
export const INVESTOR_AREA_ROLES = ['INVESTOR', 'ADMIN', 'SUPER_ADMIN'];

export function isInvestorAreaRole(role: string | null | undefined): boolean {
  return !!role && INVESTOR_AREA_ROLES.includes(role);
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === 'SUPER_ADMIN';
}
