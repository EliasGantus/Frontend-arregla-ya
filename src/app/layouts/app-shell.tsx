import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { canAccess, navItems } from '@/shared/lib/navigation';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import type { UserRole } from '@/shared/types/api';

const roleCopy = {
  cliente: 'Cliente',
  profesional: 'Profesional',
  admin: 'Administrador',
};

const mobileLabelByPath: Record<string, string> = {
  '/app': 'Inicio',
  '/app/perfil': 'Perfil',
  '/app/solicitudes': 'Solicitudes',
  '/app/reservas': 'Reservas',
  '/app/cotizaciones': 'Cotizaciones',
  '/app/admin': 'Admin',
};

const NavIconHome = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
      strokeLinejoin="round"
    />
    <path d="M9 21V12h6v9" strokeLinejoin="round" />
  </svg>
);

const NavIconUser = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7" strokeLinecap="round" />
  </svg>
);

const NavIconFile = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
      strokeLinejoin="round"
    />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
  </svg>
);

const NavIconWallet = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <rect height="14" rx="2" width="20" x="2" y="5" />
    <path d="M2 10h20" strokeLinecap="round" />
    <circle cx="16" cy="15" fill="currentColor" r="1" stroke="none" />
  </svg>
);

const NavIconCalendar = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <rect height="18" rx="2" width="18" x="3" y="4" />
    <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" />
    <path
      d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"
      strokeLinecap="round"
    />
  </svg>
);

const NavIconShield = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      d="M12 3l7 3v5c0 4.5-2.8 8.6-7 10-4.2-1.4-7-5.5-7-10V6l7-3z"
      strokeLinejoin="round"
    />
    <path d="M9 12l2 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const mobileIconByPath: Record<string, ReactNode> = {
  '/app': <NavIconHome />,
  '/app/perfil': <NavIconUser />,
  '/app/solicitudes': <NavIconFile />,
  '/app/reservas': <NavIconCalendar />,
  '/app/cotizaciones': <NavIconWallet />,
  '/app/admin': <NavIconShield />,
};

const mobilePriorityByRole: Record<UserRole, string[]> = {
  cliente: ['/app', '/app/solicitudes', '/app/reservas', '/app/perfil'],
  profesional: ['/app', '/app/solicitudes', '/app/cotizaciones', '/app/perfil'],
  admin: ['/app', '/app/admin', '/app/solicitudes', '/app/perfil'],
};

const getInitials = (name: string | undefined) =>
  (name ?? 'AY')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const getMobileTitle = (pathname: string, fallback: string) => {
  const matchedPath = Object.keys(mobileLabelByPath)
    .filter((path) =>
      path === '/app'
        ? pathname === path
        : pathname === path || pathname.startsWith(`${path}/`),
    )
    .sort((current, next) => next.length - current.length)
    .at(0);

  return mobileLabelByPath[matchedPath ?? ''] ?? fallback;
};

export const AppShell = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const availableItems = navItems.filter((item) =>
    canAccess(user?.role, item.roles),
  );
  const mobilePriority =
    mobilePriorityByRole[user?.role ?? 'cliente'] ??
    mobilePriorityByRole.cliente;
  const mobileItems = mobilePriority
    .map((path) => availableItems.find((item) => item.to === path))
    .filter((item): item is (typeof availableItems)[number] => Boolean(item));
  const activeItem =
    availableItems
      .filter((item) =>
        item.to === '/app'
          ? location.pathname === item.to
          : location.pathname === item.to ||
            location.pathname.startsWith(`${item.to}/`),
      )
      .sort((current, next) => next.to.length - current.to.length)
      .at(0) ?? availableItems[0];
  return (
    <div className="min-h-screen overflow-x-clip bg-[#eef2f8] text-ink md:bg-gradient-to-b md:from-mist md:via-white md:to-slate-100">
      <div className="md:hidden">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07152a] px-4 py-3 text-white shadow-lg shadow-slate-950/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-500 text-sm font-black text-white">
                {getInitials(user?.fullName)}
              </div>
              <div className="min-w-0">
                <p className="text-base font-black leading-tight">
                  {getMobileTitle(
                    location.pathname,
                    activeItem?.label ?? 'Inicio',
                  )}
                </p>
                <p className="truncate text-xs text-slate-300">
                  {user?.fullName}
                </p>
              </div>
            </div>
            <Badge className="shrink-0 bg-accent-500/20 text-accent-200">
              {user ? roleCopy[user.role] : 'Invitado'}
            </Badge>
          </div>
        </header>
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 pb-28 pt-3 sm:px-4 md:flex-row md:gap-6 md:px-6 md:py-4">
        <Card className="hidden md:sticky md:top-6 md:block md:h-[calc(100vh-3rem)] md:w-80 md:shrink-0 md:self-start">
          <div className="rounded-3xl bg-slate-950 p-4 text-white sm:p-5">
            <p className="font-display text-2xl font-black tracking-tight sm:text-3xl">
              <span className="text-brand-300">Arregla</span>
              <span className="text-accent-400">Ya</span>
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Soluciones a tu alcance, listas para escalar con backend real.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400 sm:tracking-[0.3em]">
                Sesion
              </p>
              <p className="mt-1 break-words font-semibold text-slate-900">
                {user?.fullName}
              </p>
            </div>
            <Badge>{user ? roleCopy[user.role] : 'Invitado'}</Badge>
          </div>

          <nav className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-1">
            {availableItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) =>
                  [
                    'min-h-11 rounded-2xl px-3 py-3 text-center text-sm font-semibold leading-tight transition md:text-left',
                    isActive
                      ? 'bg-brand-600 text-white shadow-glow'
                      : 'bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-700',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-4">
            <p className="text-sm font-semibold text-brand-700">
              API desacoplada
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Configura <code>VITE_API_URL</code> cuando el repo backend
              publique los endpoints reales.
            </p>
          </div>

          <Button
            className="mt-6 w-full"
            variant="ghost"
            onClick={() => void logout()}
          >
            Cerrar sesion
          </Button>
        </Card>

        <main className="min-w-0 flex-1 space-y-4 sm:space-y-6">
          <header className="hidden rounded-3xl bg-slate-950 px-4 py-6 text-white shadow-glow sm:px-6 sm:py-8 md:block">
            <p className="text-xs uppercase leading-tight tracking-[0.22em] text-accent-300 sm:tracking-[0.35em]">
              Web app responsive
            </p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
                  Centro operativo de ArreglaYa
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Base frontend lista para autenticacion, rutas por rol y
                  conexion con backend Node/Postgres en repo separado.
                </p>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                Usuario actual:{' '}
                <span className="break-all font-semibold text-white">
                  {user?.email}
                </span>
              </div>
            </div>
          </header>

          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Navegacion principal mobile"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 shadow-2xl shadow-slate-900/15 backdrop-blur md:hidden"
      >
        <div
          className={`mx-auto grid max-w-md gap-2 ${
            mobileItems.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'
          }`}
        >
          {mobileItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              className={({ isActive }) =>
                [
                  'flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 text-xs font-semibold transition',
                  isActive
                    ? 'bg-accent-50 text-accent-600'
                    : 'text-slate-400 hover:text-slate-700',
                ].join(' ')
              }
            >
              <span className="flex items-center justify-center">
                {mobileIconByPath[item.to] ?? <NavIconFile />}
              </span>
              <span
                className={`mt-0.5 ${
                  mobileItems.length >= 4 ? 'text-[10px]' : 'text-xs'
                }`}
              >
                {mobileLabelByPath[item.to] ?? item.label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
