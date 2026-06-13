import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { bookingsService } from '@/features/bookings/services/bookings-service';
import { quotesService } from '@/features/quotes/services/quotes-service';
import { categoriesService } from '@/features/service-requests/services/categories-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';
import { ApiError } from '@/shared/api/api-error';
import { env } from '@/shared/config/env';
import type {
  CreateServiceRequestInput,
  ServiceRequest,
  ServiceRequestStatus,
  Quote,
} from '@/shared/types/api';
import {
  serviceRequestSchema,
  type ServiceRequestFormValues,
} from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { FlowProgress } from '@/shared/ui/flow-progress';
import { Input } from '@/shared/ui/input';
import {
  MobileHero,
  MobilePage,
  MobileSection,
  MobileStats,
} from '@/shared/ui/mobile-page';
import { NextActionPanel } from '@/shared/ui/next-action-panel';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';
import { StatusChip } from '@/shared/ui/status-chip';

export const ServiceRequestsPage = () => <ServiceRequestsContent />;

export const ServiceRequestDetailPage = () => <ServiceRequestDetailContent />;

const statusCopy: Record<ServiceRequestStatus, string> = {
  draft: 'Borrador',
  open: 'Abierta',
  quoted: 'Cotizada',
  assigned: 'Asignada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const statusTone: Record<ServiceRequestStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  open: 'bg-accent-50 text-accent-700',
  quoted: 'bg-brand-50 text-brand-700',
  assigned: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-50 text-red-700',
};

const quoteStatusCopy: Record<Quote['status'], string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada',
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

const toScheduledAt = (date: string, time: string) =>
  new Date(`${date}T${time}:00`).toISOString();

const statusCount = (
  requests: ServiceRequest[],
  statuses: ServiceRequestStatus[],
) => requests.filter((request) => statuses.includes(request.status)).length;

const requestProgress: Record<ServiceRequestStatus, string> = {
  draft: 'Datos iniciales',
  open: 'Esperando cotizaciones',
  quoted: 'Cotizaciones recibidas',
  assigned: 'Profesional asignado',
  completed: 'Trabajo completado',
  cancelled: 'Solicitud cancelada',
};

const requestFlowSteps = (status: ServiceRequest['status']) => {
  const currentStep =
    status === 'completed'
      ? 'done'
      : status === 'assigned'
        ? 'booking'
        : 'quote';

  return [
    {
      key: 'request',
      label: 'Solicitud',
      description: 'Pedido publicado',
      state: 'done' as const,
    },
    {
      key: 'quote',
      label: 'Cotizacion',
      description: 'Comparar propuestas',
      state: currentStep === 'quote' ? ('current' as const) : ('done' as const),
    },
    {
      key: 'booking',
      label: 'Reserva',
      description: 'Coordinar turno',
      state:
        currentStep === 'booking'
          ? ('current' as const)
          : currentStep === 'done'
            ? ('done' as const)
            : ('upcoming' as const),
    },
    {
      key: 'done',
      label: 'Cierre',
      description: 'Pago y calificacion',
      state: currentStep === 'done' ? ('current' as const) : ('upcoming' as const),
    },
  ];
};

const ServiceRequestsContent = () => {
  const { user, accessToken } = useAuth();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || uploadedPhotos.length >= 4) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadError(null);
      const res = await fetch(`${env.apiUrl}/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Error al subir imagen.');
      const data = (await res.json()) as { url: string };
      setUploadedPhotos((prev) => [...prev, `${env.apiUrl}${data.url}`]);
    } catch {
      setUploadError('No se pudo subir la imagen. Intentá de nuevo.');
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };
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
      categoryId: '',
      city: user?.city ?? '',
      zone: user?.zone ?? '',
      budget: '',
    },
  });
  const mutation = useMutation({
    mutationFn: (values: CreateServiceRequestInput) =>
      serviceRequestsService.create(values),
    onSuccess: async () => {
      reset({
        title: '',
        categoryId: '',
        city: user?.city ?? '',
        zone: user?.zone ?? '',
        budget: '',
      });
      setUploadedPhotos([]);
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
  const isClientView = user?.role === 'cliente';
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
    mutation.mutate({
      title: values.title,
      description: values.title,
      categoryId: values.categoryId,
      city: values.city,
      zone: values.zone,
      budget: values.budget,
      photos: uploadedPhotos,
    });
  };

  return (
    <MobilePage>
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Solicitudes"
          title="Flujo base de solicitud y cotizacion"
          description="Vista conectable para el nucleo del marketplace. Cuando la API no esta disponible, la app mantiene el shell operativo y deja el error visible."
        />
      </div>

      <MobileHero
        eyebrow={mobileHero.eyebrow}
        title={mobileHero.title}
        description={mobileHero.description}
        badge={mobileHero.pill}
      />

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
                Describe tu problema
              </span>
              <Input
                error={errors.title?.message}
                placeholder="Ej: Instalación de aire acondicionado en el living"
                {...register('title')}
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
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
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
            </div>
            <div className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Agregar imágenes del problema
              </span>
              <div className="flex flex-wrap gap-2">
                {uploadedPhotos.map((url, i) => (
                  <div
                    key={url}
                    className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200"
                  >
                    <img
                      alt={`Foto ${i + 1}`}
                      className="h-full w-full object-cover"
                      src={url}
                    />
                    <button
                      className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-red-500 text-xs font-bold text-white"
                      type="button"
                      onClick={() => removePhoto(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {uploadedPhotos.length < 4 ? (
                  <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 hover:border-accent-400">
                    <span className="text-2xl leading-none text-slate-400">+</span>
                    <input
                      accept="image/*"
                      className="hidden"
                      type="file"
                      onChange={(e) => void handlePhotoUpload(e)}
                    />
                  </label>
                ) : null}
              </div>
              {uploadError ? (
                <p className="text-xs text-red-600">{uploadError}</p>
              ) : null}
            </div>

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

      <MobileSection
        eyebrow={trackingCopy.eyebrow}
        title={trackingCopy.title}
        description={trackingCopy.description}
        badge={trackingCopy.badge}
      >
        <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
          <MobileStats stats={requestStats} className="grid-cols-3 gap-2" />
        </Card>

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
              <div className="mt-4 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-700">
                  Proximo paso
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {request.nextStep?.label ??
                    request.statusLabel ??
                    statusCopy[request.status]}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {request.nextStep?.description ??
                    request.statusDescription ??
                    'Abri el detalle para revisar el estado.'}
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link
                  className={
                    isClientView
                      ? 'inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-400 sm:w-auto'
                      : 'inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 sm:w-auto'
                  }
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
      </MobileSection>
    </MobilePage>
  );
};

const ServiceRequestDetailContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requestId } = useParams();
  const queryClient = useQueryClient();
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const query = useQuery({
    queryKey: ['service-requests'],
    queryFn: () => serviceRequestsService.list(),
  });
  const request = (query.data ?? []).find((item) => item.id === requestId);
  const isProfessionalView = user?.role === 'profesional';
  const canReviewQuotes =
    Boolean(requestId && request) &&
    (user?.role === 'cliente' || user?.role === 'admin');
  const quotesQuery = useQuery({
    queryKey: ['quotes', 'request', requestId],
    queryFn: () => quotesService.listForRequest(requestId ?? ''),
    enabled: canReviewQuotes,
  });
  const bookingMutation = useMutation({
    mutationFn: (quote: Quote) =>
      bookingsService.create({
        serviceRequestId: quote.serviceRequestId,
        professionalId: quote.professionalId,
        scheduledAt: toScheduledAt(scheduledDate, scheduledTime),
        notes: bookingNotes.trim() || undefined,
      }),
    onSuccess: async (booking) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['service-requests'] }),
      ]);
      void navigate('/app/reservas', { state: { booking } });
    },
  });
  const quoteStatusMutation = useMutation({
    mutationFn: ({
      quoteId,
      status,
    }: {
      quoteId: string;
      status: 'accepted' | 'rejected';
    }) => quotesService.update(quoteId, { status }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quotes', 'request', requestId] }),
        queryClient.invalidateQueries({ queryKey: ['service-requests'] }),
      ]);
    },
  });
  const quotes = quotesQuery.data ?? [];
  const canAcceptQuotes =
    request?.availableActions?.includes('accept_quote') ?? false;
  const canBookAcceptedQuote =
    request?.status === 'quoted' || request?.status === 'assigned';
  const canSubmitBooking =
    Boolean(scheduledDate && scheduledTime) && !bookingMutation.isPending;

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

      <NextActionPanel
        title={request.title}
        description={request.statusDescription ?? request.description}
        status={request.status}
        statusLabel={request.statusLabel ?? statusCopy[request.status]}
        nextStep={
          request.nextStep ?? {
            action: null,
            label: requestProgress[request.status],
            description: 'Revisa el detalle para ver acciones disponibles.',
          }
        }
      />

      <FlowProgress steps={requestFlowSteps(request.status)} />

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

      {canReviewQuotes ? (
        <section className="space-y-4">
          {(quotesQuery.error instanceof ApiError ||
            bookingMutation.error instanceof ApiError ||
            quoteStatusMutation.error instanceof ApiError) ? (
            <Card className="rounded-[28px] border border-amber-200 bg-amber-50 md:rounded-3xl">
              <p className="text-sm font-semibold text-amber-800">
                No pudimos sincronizar cotizaciones
              </p>
              <p className="mt-2 text-sm text-amber-700">
                {(bookingMutation.error instanceof ApiError &&
                  bookingMutation.error.message) ||
                  (quoteStatusMutation.error instanceof ApiError &&
                    quoteStatusMutation.error.message) ||
                  (quotesQuery.error instanceof ApiError &&
                    quotesQuery.error.message)}
              </p>
            </Card>
          ) : null}

          <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Propuestas
                </p>
                <h2 className="mt-2 text-xl font-black text-slate-950">
                  Propuestas recibidas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Elegi una propuesta, coordina fecha y deja la reserva
                  pendiente de confirmacion.
                </p>
              </div>
              <Badge>{quotes.length} recibidas</Badge>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Fecha tentativa
                </span>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Horario
                </span>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(event) => setScheduledTime(event.target.value)}
                />
              </label>
              <label className="space-y-2 md:col-span-1">
                <span className="text-sm font-semibold text-slate-700">
                  Notas para la reserva
                </span>
                <Input
                  placeholder="Ej: Coordinar acceso"
                  value={bookingNotes}
                  onChange={(event) => setBookingNotes(event.target.value)}
                />
              </label>
            </div>
          </Card>

          {!quotes.length && !quotesQuery.isLoading ? (
            <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-xl font-black text-accent-600">
                0
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950">
                Todavia no hay cotizaciones
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
                Cuando un profesional envie una propuesta, vas a poder
                reservarla desde este detalle.
              </p>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {quotes.map((quote) => (
              <Card
                key={quote.id}
                className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Profesional
                    </p>
                    <h3 className="mt-1 text-lg font-black leading-tight text-slate-950">
                      {quote.professionalName}
                    </h3>
                  </div>
                  <StatusChip label={quoteStatusCopy[quote.status]} status={quote.status} />
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Monto
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {quote.amount}
                  </p>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {quote.message}
                </p>

                {quote.status === 'pending' && canAcceptQuotes ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button
                      aria-label={`Aceptar cotizacion de ${quote.professionalName}`}
                      disabled={quoteStatusMutation.isPending}
                      onClick={() =>
                        quoteStatusMutation.mutate({
                          quoteId: quote.id,
                          status: 'accepted',
                        })
                      }
                      variant="secondary"
                    >
                      {quoteStatusMutation.isPending ? 'Actualizando...' : 'Aceptar'}
                    </Button>
                    <Button
                      aria-label={`Rechazar cotizacion de ${quote.professionalName}`}
                      disabled={quoteStatusMutation.isPending}
                      onClick={() =>
                        quoteStatusMutation.mutate({
                          quoteId: quote.id,
                          status: 'rejected',
                        })
                      }
                      variant="ghost"
                    >
                      Rechazar
                    </Button>
                  </div>
                ) : null}

                {quote.status === 'accepted' && canBookAcceptedQuote ? (
                  <Button
                    className="mt-3 w-full sm:w-auto"
                    disabled={!canSubmitBooking}
                    onClick={() => bookingMutation.mutate(quote)}
                    variant="secondary"
                  >
                    {bookingMutation.isPending
                      ? 'Reservando...'
                      : `Reservar con ${quote.professionalName}`}
                  </Button>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
