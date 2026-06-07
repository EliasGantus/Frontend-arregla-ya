import { useQuery } from '@tanstack/react-query';

import { adminService } from '@/features/admin/services/admin-service';
import { ApiError } from '@/shared/api/api-error';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { StatusPanel } from '@/shared/ui/status-panel';

const adminCards = [
  {
    label: 'Usuarios',
    description: 'Listado, moderacion, bloqueos y validacion de profesionales.',
  },
  {
    label: 'Solicitudes',
    description: 'Supervision global del marketplace y soporte operativo.',
  },
  {
    label: 'Observabilidad',
    description:
      'Lugar natural para metricas, alertas y estados del backend futuro.',
  },
];

export const AdminPage = () => <AdminContent />;

const AdminContent = () => {
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.users(),
  });
  const serviceRequestsQuery = useQuery({
    queryKey: ['admin', 'service-requests'],
    queryFn: () => adminService.serviceRequests(),
  });
  const users = usersQuery.data ?? [];
  const serviceRequests = serviceRequestsQuery.data ?? [];
  const openRequests = serviceRequests.filter(
    (request) => request.status === 'open' || request.status === 'quoted',
  ).length;
  const adminState =
    usersQuery.isFetching || serviceRequestsQuery.isFetching
      ? 'Cargando'
      : users.length || serviceRequests.length
        ? 'Activo'
        : 'Sin datos';

  return (
    <div className="space-y-5 pb-24 md:space-y-6 md:pb-0">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Admin"
          title="Zona reservada para administracion"
          description="La ruta ya esta protegida por rol. Solo administradores pueden navegar este modulo en la base actual."
        />
      </div>

      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300/50 md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">
              Admin
            </p>
            <h1 className="mt-3 text-3xl font-black leading-none">Operacion</h1>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Supervisa usuarios, solicitudes y estado general del marketplace.
            </p>
          </div>
          <Badge className="shrink-0 bg-white/10 text-white">
            {adminState}
          </Badge>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-3">
            <p className="text-2xl font-black leading-none">{users.length}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Usuarios
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-3">
            <p className="text-2xl font-black leading-none">
              {serviceRequests.length}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Solicitudes
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-3">
            <p className="text-2xl font-black leading-none">{openRequests}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Activas
            </p>
          </div>
        </div>
      </section>

      {usersQuery.error instanceof ApiError ||
      serviceRequestsQuery.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50 shadow-amber-100/70">
          <p className="text-sm font-semibold text-amber-800">
            Panel en modo desacoplado
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {(usersQuery.error instanceof ApiError &&
              usersQuery.error.message) ||
              (serviceRequestsQuery.error instanceof ApiError &&
                serviceRequestsQuery.error.message)}
          </p>
        </Card>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3 md:gap-4">
        {adminCards.map((card) => (
          <Card className="p-4 sm:p-6" key={card.label}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-black leading-tight text-slate-950 md:font-bold">
                  {card.label}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
              </div>
              <Badge className="shrink-0">
                {card.label === 'Usuarios'
                  ? users.length
                  : card.label === 'Solicitudes'
                    ? serviceRequests.length
                    : adminState}
              </Badge>
            </div>
            <p className="mt-4 text-sm font-semibold text-brand-700">
              {card.label === 'Usuarios' && usersQuery.data
                ? `${users.length} usuarios listos para administrar.`
                : card.label === 'Solicitudes' && serviceRequestsQuery.data
                  ? `${serviceRequests.length} solicitudes visibles.`
                  : 'Esperando datos reales.'}
            </p>
          </Card>
        ))}
      </section>

      <Card className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 md:hidden">
              Directorio
            </p>
            <h2 className="mt-1 text-xl font-black leading-tight text-slate-950 md:mt-0 md:font-bold">
              Usuarios
            </h2>
          </div>
          <Badge className="shrink-0">{users.length} total</Badge>
        </div>
        <div className="mt-4 grid gap-3">
          {users.map((user) => (
            <div
              className="min-w-0 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3"
              key={user.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">
                    {user.fullName}
                  </p>
                  <p className="break-all text-sm leading-6 text-slate-500">
                    {user.email}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase text-brand-700">
                  {user.role}
                </span>
              </div>
            </div>
          ))}
          {!users.length && !usersQuery.isFetching ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Todavia no hay usuarios disponibles para administrar.
            </p>
          ) : null}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 md:hidden">
              Marketplace
            </p>
            <h2 className="mt-1 text-xl font-black leading-tight text-slate-950 md:mt-0 md:font-bold">
              Solicitudes globales
            </h2>
          </div>
          <Badge className="shrink-0">{serviceRequests.length} total</Badge>
        </div>
        <div className="mt-4 grid gap-3">
          {serviceRequests.map((request) => (
            <div
              className="min-w-0 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3"
              key={request.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">
                    {request.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {request.category.name} - {request.city} / {request.zone}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                  {request.status}
                </span>
              </div>
            </div>
          ))}
          {!serviceRequests.length && !serviceRequestsQuery.isFetching ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Todavia no hay solicitudes globales visibles.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
};
