import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { canAccess, navItems } from '@/shared/lib/navigation';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

const roleCopy = {
  cliente: 'Cliente',
  profesional: 'Profesional',
  admin: 'Administrador',
};

const mobileLabelByPath: Record<string, string> = {
  '/app': 'Inicio',
  '/app/perfil': 'Perfil',
  '/app/solicitudes': 'Solicitudes',
  '/app/cotizaciones': 'Cotizaciones',
};

const mobileIconByPath: Record<string, string> = {
  '/app': 'H',
  '/app/perfil': 'P',
  '/app/solicitudes': 'S',
  '/app/cotizaciones': 'C',
};

const getInitials = (name: string | undefined) =>
  (name ?? 'AY')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export const AppShell = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const availableItems = navItems.filter((item) =>
    canAccess(user?.role, item.roles),
  );
  const mobileItems = availableItems.filter((item) =>
    ['/app', '/app/perfil', '/app/solicitudes', '/app/cotizaciones'].includes(
      item.to,
    ),
  );
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
  const visibleMobileItems =
    activeItem &&
    !mobileItems.slice(0, 3).some((item) => item.to === activeItem.to)
      ? [...mobileItems.slice(0, 2), activeItem]
      : mobileItems.slice(0, 3);

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
                  {mobileLabelByPath[activeItem?.to ?? '/app'] ??
                    activeItem?.label ??
                    'Inicio'}
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

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 pb-24 pt-4 sm:px-4 md:flex-row md:gap-6 md:px-6 md:py-4">
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

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pb-3 pt-2 shadow-2xl shadow-slate-900/15 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {visibleMobileItems.map((item) => (
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
              <span className="text-lg leading-none">
                {mobileIconByPath[item.to] ?? '.'}
              </span>
              <span className="mt-1">
                {mobileLabelByPath[item.to] ?? item.label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
