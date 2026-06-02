import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { categoriesService } from '@/features/service-requests/services/categories-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';
import { ApiError } from '@/shared/api/api-error';
import type { ServiceRequest, ServiceRequestStatus } from '@/shared/types/api';
import {
  serviceRequestSchema,
  type ServiceRequestFormValues,
} from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';
import { Textarea } from '@/shared/ui/textarea';

export const ServiceRequestsPage = () => <ServiceRequestsContent />;

export const ServiceRequestDetailPage = () => <ServiceRequestDetailContent />;

const statusCopy: Record<ServiceRequestStatus, string> = {
  draft: 'Borrador',
  open: 'Abierta',
  quoted: 'Cotizada',
  assigned: 'Asignada',
  cancelled: 'Cancelada',
};

const statusTone: Record<ServiceRequestStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  open: 'bg-accent-50 text-accent-700',
  quoted: 'bg-brand-50 text-brand-700',
  assigned: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

const formatRequestDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha pendiente';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const statusCount = (
  requests: ServiceRequest[],
  statuses: ServiceRequestStatus[],
) => requests.filter((request) => statuses.includes(request.status)).length;

const requestProgress: Record<ServiceRequestStatus, string> = {
  draft: 'Datos iniciales',
  open: 'Esperando cotizaciones',
  quoted: 'Cotizaciones recibidas',
  assigned: 'Profesional asignado',
  cancelled: 'Solicitud cancelada',
};

const ServiceRequestsContent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['service-requests'],
    queryFn: () => serviceRequestsService.list(),
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.list(),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      city: user?.city ?? '',
      zone: user?.zone ?? '',
      budget: '',
    },
  });
  const mutation = useMutation({
    mutationFn: (values: ServiceRequestFormValues) =>
      serviceRequestsService.create(values),
    onSuccess: async () => {
      reset({
        title: '',
        description: '',
        categoryId: '',
        city: user?.city ?? '',
        zone: user?.zone ?? '',
        budget: '',
      });
      await queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    },
  });

  const canCreate = user?.role === 'cliente' || user?.role === 'admin';
  const requests = query.data ?? [];
  const trackedRequests = requests.filter(
    (request) => request.status !== 'cancelled',
  );
  const openRequests = statusCount(requests, ['open']);
  const isProfessionalView = user?.role === 'profesional';
  const requestStats = [
    { label: 'Abiertas', value: openRequests },
    { label: 'Cotizadas', value: statusCount(requests, ['quoted']) },
    { label: 'Asignadas', value: statusCount(requests, ['assigned']) },
  ];
  const mobileHero = canCreate
    ? {
        eyebrow: 'Nueva solicitud',
        title: 'Contanos que paso',
        description:
          'Completa los datos basicos para que un profesional pueda cotizar el trabajo.',
        pill: 'Paso 1',
      }
    : {
        eyebrow: 'Solicitudes',
        title: 'Trabajos disponibles',
        description:
          'Revisa pedidos abiertos, compara alcance y prepara tu cotizacion.',
        pill: `${openRequests} abiertas`,
      };
  const trackingCopy = canCreate
    ? {
        eyebrow: 'Seguimiento',
        title: 'Mis solicitudes',
        description:
          'Revisa el estado de tus pedidos y las cotizaciones recibidas.',
        badge: `${trackedRequests.length} activas`,
        emptyTitle: 'Todavia no tenes solicitudes',
        emptyDescription:
          'Cuando crees un pedido, lo vas a ver aca con su estado y datos principales.',
      }
    : {
        eyebrow: 'Disponibles',
        title: 'Solicitudes abiertas',
        description:
          'Encuentra trabajos nuevos y revisa cuales necesitan una propuesta.',
        badge: `${openRequests} abiertas`,
        emptyTitle: 'No hay solicitudes disponibles',
        emptyDescription:
          'Cuando aparezcan pedidos abiertos para tu zona u oficio, los vas a ver aca.',
      };
  const submitRequest = (values: ServiceRequestFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Solicitudes"
          title="Flujo base de solicitud y cotizacion"
          description="Vista conectable para el nucleo del marketplace. Cuando la API no esta disponible, la app mantiene el shell operativo y deja el error visible."
        />
      </div>

      <Card className="rounded-[28px] !bg-ink p-5 text-white shadow-lg shadow-slate-300/70 md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
              {mobileHero.eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-black">{mobileHero.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {mobileHero.description}
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-ink">
            {mobileHero.pill}
          </div>
        </div>
      </Card>

      {categoriesQuery.error instanceof ApiError ||
      query.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">
            Backend no disponible
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {(query.error instanceof ApiError && query.error.message) ||
              (categoriesQuery.error instanceof ApiError &&
                categoriesQuery.error.message)}
          </p>
        </Card>
      ) : null}

      {canCreate ? (
        <Card
          className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6"
          id="nueva-solicitud"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-slate-950 md:text-xl md:font-bold">
                Nueva solicitud
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Indica que necesitas, donde estas y un presupuesto estimado.
              </p>
            </div>
            <Badge className="hidden break-all md:inline-flex">
              POST /service-requests
            </Badge>
          </div>

          {mutation.error instanceof ApiError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {mutation.error.message}
            </div>
          ) : null}

          <form
            className="mt-6 grid gap-4 md:grid-cols-2"
            onSubmit={(event) => void handleSubmit(submitRequest)(event)}
          >
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Titulo
              </span>
              <Input
                error={errors.title?.message}
                placeholder="Ej: Arreglo de canilla"
                {...register('title')}
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Descripcion
              </span>
              <Textarea
                error={errors.description?.message}
                placeholder="Conta que pasa, donde esta el problema y cualquier detalle util."
                {...register('description')}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Categoria
              </span>
              <Select
                error={errors.categoryId?.message}
                {...register('categoryId')}
              >
                <option value="">Selecciona una categoria</option>
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Presupuesto
              </span>
              <Input
                placeholder="$85.000"
                error={errors.budget?.message}
                {...register('budget')}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Ciudad
              </span>
              <Input error={errors.city?.message} {...register('city')} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Zona</span>
              <Input error={errors.zone?.message} {...register('zone')} />
            </label>
            <div className="md:col-span-2">
              <Button
                className="w-full sm:w-auto"
                disabled={mutation.isPending}
                type="submit"
                variant="secondary"
              >
                {mutation.isPending ? 'Creando...' : 'Crear solicitud'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <section className="space-y-3">
        <div className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
                {trackingCopy.eyebrow}
              </p>
              <h2 className="text-xl font-black text-slate-950 md:text-xl">
                {trackingCopy.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {trackingCopy.description}
              </p>
            </div>
            <Badge>{trackingCopy.badge}</Badge>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {requestStats.map((stat) => (
              <div
                className="rounded-2xl bg-slate-50 px-3 py-3 text-center"
                key={stat.label}
              >
                <p className="text-lg font-black text-slate-950">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {!requests.length && !query.isLoading ? (
            <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-xl font-black text-accent-600">
                0
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950">
                {trackingCopy.emptyTitle}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
                {trackingCopy.emptyDescription}
              </p>
              {canCreate ? (
                <a
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-400 sm:w-auto"
                  href="#nueva-solicitud"
                >
                  Crear una solicitud
                </a>
              ) : null}
            </Card>
          ) : null}
          {requests.map((request) => (
            <Card
              key={request.id}
              className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {formatRequestDate(request.createdAt)}
                  </p>
                  <h3 className="mt-1 text-lg font-black leading-tight text-slate-950">
                    {request.title}
                  </h3>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusTone[request.status]}`}
                >
                  {statusCopy[request.status]}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {request.description}
              </p>

              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Ubicacion
                </p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {request.city} / {request.zone}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {request.category.name}
                </span>
                {request.budget ? (
                  <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                    {request.budget}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 sm:w-auto"
                  to={`/app/solicitudes/${request.id}`}
                >
                  Ver detalle
                </Link>
                {isProfessionalView ? (
                  <Link
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-400 sm:w-auto"
                    to="/app/cotizaciones"
                  >
                    Cotizar solicitud
                  </Link>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

const ServiceRequestDetailContent = () => {
  const { user } = useAuth();
  const { requestId } = useParams();
  const query = useQuery({
    queryKey: ['service-requests'],
    queryFn: () => serviceRequestsService.list(),
  });
  const request = (query.data ?? []).find((item) => item.id === requestId);
  const isProfessionalView = user?.role === 'profesional';

  if (query.error instanceof ApiError) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">
            Backend no disponible
          </p>
          <p className="mt-2 text-sm text-amber-700">{query.error.message}</p>
        </Card>
      </div>
    );
  }

  if (!request && !query.isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
          <h1 className="text-xl font-black text-slate-950">
            Solicitud no encontrada
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Volve al listado para revisar las solicitudes disponibles.
          </p>
          <Link
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-400"
            to="/app/solicitudes"
          >
            Volver a solicitudes
          </Link>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Card className="rounded-[28px] bg-white p-5 shadow-lg shadow-slate-200/70 md:rounded-3xl">
          <p className="text-sm font-semibold text-slate-600">
            Cargando detalle de solicitud...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Detalle"
          title={request.title}
          description="Vista de detalle conectada al listado de solicitudes."
        />
      </div>

      <Link
        className="inline-flex min-h-10 items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm shadow-slate-200/70 md:hidden"
        to="/app/solicitudes"
      >
        Volver
      </Link>

      <Card className="rounded-[28px] !bg-ink p-5 text-white shadow-lg shadow-slate-300/70 md:rounded-3xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
              Detalle solicitud
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">
              {request.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              {request.description}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusTone[request.status]}`}
          >
            {statusCopy[request.status]}
          </span>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
        <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Resumen
          </p>
          <div className="mt-4 grid gap-3">
            {[
              { label: 'Categoria', value: request.category.name },
              {
                label: 'Ubicacion',
                value: `${request.city} / ${request.zone}`,
              },
              { label: 'Presupuesto', value: request.budget || 'A convenir' },
              {
                label: 'Publicado',
                value: formatRequestDate(request.createdAt),
              },
            ].map((item) => (
              <div
                className="rounded-2xl bg-slate-50 px-4 py-3"
                key={item.label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Estado
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            {requestProgress[request.status]}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isProfessionalView
              ? 'Revisa el alcance antes de preparar una propuesta para el cliente.'
              : 'Usa esta vista para seguir el avance y comparar las propuestas que recibas.'}
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-400"
            to={isProfessionalView ? '/app/cotizaciones' : '/app/solicitudes'}
          >
            {isProfessionalView ? 'Cotizar solicitud' : 'Ver solicitudes'}
          </Link>
        </Card>
      </div>
    </div>
  );
};
