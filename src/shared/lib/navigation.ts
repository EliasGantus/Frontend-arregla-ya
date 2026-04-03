import type { UserRole } from '@/shared/types/api';

export interface NavItem {
  label: string;
  to: string;
  roles?: UserRole[];
}

export const navItems: NavItem[] = [
  { label: 'Panel', to: '/app' },
  { label: 'Perfil', to: '/app/perfil' },
  { label: 'Solicitudes', to: '/app/solicitudes' },
  { label: 'Cotizaciones', to: '/app/cotizaciones', roles: ['profesional', 'admin'] },
  { label: 'Administración', to: '/app/admin', roles: ['admin'] },
];

export const canAccess = (role: UserRole | undefined, roles?: UserRole[]) =>
  !roles || (role ? roles.includes(role) : false);
