import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { adminService } from '@/features/admin/services/admin-service';
import { useAuth } from '@/features/auth/context/auth-context';
import { bookingsService } from '@/features/bookings/services/bookings-service';
import { quotesService } from '@/features/quotes/services/quotes-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';
import { ApiError } from '@/shared/api/api-error';
import type { Booking, Quote, ServiceRequest, UserRole } from '@/shared/types/api';
import { Card } from '@/shared/ui/card';
import { StatusPanel } from '@/shared/ui/status-panel';

type DashboardMetric = {
  label: string;
  value: string;
};

const activeRequestStatuses: ServiceRequest['status'][] = ['open', 'quoted', 'assigned'];
const activeBookingStatuses: Booking['status'][] = ['pending', 'confirmed'];

const formatCount = (value: number) => String(value).padStart(2, '0');

const percentage = (count: number, total: number) =>
  total > 0 ? `${Math.round((count / total) * 100)}%` : '0%';

const metricsForClient = (
  requests: ServiceRequest[],
  bookings: Booking[],
): DashboardMetric[] => [
  {
    label: 'Solicitudes activas',
    value: formatCount(
      requests.filter((request) => activeRequestStatuses.includes(request.status)).length,
    ),
  },
  {
    label: 'Cotizadas',
    value: formatCount(requests.filter((request) => request.status === 'quoted').length),
  },
  {
    label: 'Reservas activas',
    value: formatCount(
      bookings.filter((booking) => activeBookingStatuses.includes(booking.status)).length,
    ),
  },
];

const metricsForProfessional = (
  quotes: Quote[],
  bookings: Booking[],
): DashboardMetric[] => [
  { label: 'Cotizaciones enviadas', value: formatCount(quotes.length) },
  {
    label: 'Trabajos asignados',
    value: formatCount(
      bookings.filter((booking) => activeBookingStatuses.includes(booking.status)).length,
    ),
  },
  {
    label: 'Tasa de exito',
    value: percentage(
      quotes.filter((quote) => quote.status === 'accepted').length,
      quotes.length,
    ),
  },
];

const metricsForAdmin = (
  usersCount: number,
  requests: ServiceRequest[],
): DashboardMetric[] => [
  { label: 'Usuarios activos', value: formatCount(usersCount) },
  {
    label: 'Solicitudes abiertas',
    value: formatCount(
      requests.filter((request) => activeRequestStatuses.includes(request.status)).length,
    ),
  },
  {
    label: 'Completadas',
    value: formatCount(requests.filter((request) => request.status === 'completed').length),
  },
];

const actionByRole: Record<string, { title: string; description: string; path: string }[]> = {
  cliente: [
    {
      title: 'Nueva solicitud',
      description: 'Publica lo que necesitas',
      path: '/app/solicitudes',
    },
  ],
  profesional: [
    {
      title: 'Buscar trabajos',
      description: 'Explora solicitudes abiertas',
      path: '/app/solicitudes',
    },
    {
      title: 'Mis cotizaciones',
      description: 'Seguimiento de propuestas',
      path: '/app/cotizaciones',
    },
  ],
  admin: [
    {
      title: 'Administrar plataforma',
      description: 'Revisa usuarios y solicitudes',
      path: '/app/admin',
    },
  ],
};

const introByRole = {
  cliente:
    'Revisa tus solicitudes, compara profesionales y avanza con el servicio que necesitas.',
  profesional:
    'Encuentra nuevas oportunidades de trabajo y envia cotizaciones a clientes activos.',
  admin:
    'Supervisa usuarios, solicitudes y actividad operativa desde el panel central.',
};

const getFirstName = (name: string | undefined) =>
  name?.split(' ').filter(Boolean)[0] ?? 'usuario';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? 'cliente';
  const serviceRequestsQuery = useQuery({
    queryKey: ['dashboard', 'service-requests', role],
    queryFn: () => serviceRequestsService.list(),
    enabled: role === 'cliente',
  });
  const bookingsQuery = useQuery({
    queryKey: ['dashboard', 'bookings', role],
    queryFn: () => bookingsService.list(),
    enabled: role === 'cliente' || role === 'profesional',
  });
  const quotesQuery = useQuery({
    queryKey: ['dashboard', 'quotes', role],
    queryFn: () => quotesService.listMine(),
    enabled: role === 'profesional',
  });
  const adminUsersQuery = useQuery({
    queryKey: ['dashboard', 'admin', 'users'],
    queryFn: () => adminService.users(),
    enabled: role === 'admin',
  });
  const adminRequestsQuery = useQuery({
    queryKey: ['dashboard', 'admin', 'service-requests'],
    queryFn: () => adminService.serviceRequests(),
    enabled: role === 'admin',
  });
  const metricsByRole: Record<UserRole, DashboardMetric[]> = {
    cliente: metricsForClient(serviceRequestsQuery.data ?? [], bookingsQuery.data ?? []),
    profesional: metricsForProfessional(quotesQuery.data ?? [], bookingsQuery.data ?? []),
    admin: metricsForAdmin(adminUsersQuery.data?.length ?? 0, adminRequestsQuery.data ?? []),
  };
  const metricError =
    serviceRequestsQuery.error ||
    bookingsQuery.error ||
    quotesQuery.error ||
    adminUsersQuery.error ||
    adminRequestsQuery.error;
  const metrics = metricsByRole[role];
  const actions = actionByRole[role];

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="md:hidden">
        <Card className="!bg-[#07152a] text-white shadow-lg shadow-slate-900/20">
          <p className="text-2xl font-black">
            Hola, {getFirstName(user?.fullName)}
          </p>
          <p className="mt-2 text-sm text-slate-300">{introByRole[role]}</p>
        </Card>
      </div>

      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Panel base"
          title="Arquitectura lista para crecer"
          description="Este panel actua como home privada. Desde aqui cuelgan rutas protegidas, sesion persistente y navegacion por rol."
        />
      </div>

      {metricError instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">
            No pudimos cargar metricas actualizadas
          </p>
          <p className="mt-2 text-sm text-amber-700">{metricError.message}</p>
        </Card>
      ) : null}

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="rounded-2xl p-4 text-center md:rounded-3xl md:text-left"
          >
            <p className="text-xs font-semibold text-slate-400 md:text-sm md:text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:mt-3 md:text-4xl">
              {metric.value}
            </p>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Acciones rapidas
        </p>
        {actions.map((action) => (
          <button
            key={action.path}
            className="flex min-h-20 w-full items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 text-left shadow-xl shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-2xl"
            onClick={() => void navigate(action.path)}
            type="button"
          >
            <span>
              <span className="block font-bold text-slate-950">
                {action.title}
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {action.description}
              </span>
            </span>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-accent-200 bg-accent-50 text-accent-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        ))}
      </section>
    </div>
  );
};
