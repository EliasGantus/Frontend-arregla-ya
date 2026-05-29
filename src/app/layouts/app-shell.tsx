import { NavLink, Outlet } from 'react-router-dom';

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

export const AppShell = () => {
  const { logout, user } = useAuth();
  const availableItems = navItems.filter((item) =>
    canAccess(user?.role, item.roles),
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-gradient-to-b from-mist via-white to-slate-100 text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 md:flex-row md:gap-6 md:px-6">
        <Card className="md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-80 md:shrink-0 md:self-start">
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
          <header className="rounded-3xl bg-slate-950 px-4 py-6 text-white shadow-glow sm:px-6 sm:py-8">
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
    </div>
  );
};
