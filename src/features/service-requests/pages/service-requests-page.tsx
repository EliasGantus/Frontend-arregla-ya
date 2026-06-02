import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { useAuth } from '@/features/auth/context/auth-context';
import { categoriesService } from '@/features/service-requests/services/categories-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';
import { ApiError } from '@/shared/api/api-error';
import type { ServiceRequestStatus } from '@/shared/types/api';
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

const statusCopy: Record<ServiceRequestStatus, string> = {
  draft: 'Borrador',
  open: 'Abierta',
  quoted: 'Cotizada',
  assigned: 'Asignada',
  cancelled: 'Cancelada',
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
              Nueva solicitud
            </p>
            <h1 className="mt-2 text-2xl font-black">Contanos que paso</h1>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Completa los datos basicos para que un profesional pueda cotizar
              el trabajo.
            </p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-ink">
            Paso 1
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
        <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
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

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
              Seguimiento
            </p>
            <h2 className="text-lg font-black text-slate-950 md:text-xl">
              Mis solicitudes
            </h2>
          </div>
          <Badge>{requests.length} activas</Badge>
        </div>

        <div className="grid gap-4">
          {!requests.length && !query.isLoading ? (
            <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl md:text-left">
              <p className="text-sm text-slate-600">
                No hay solicitudes disponibles para tu rol en este momento.
              </p>
            </Card>
          ) : null}
          {requests.map((request) => (
            <Card
              key={request.id}
              className="flex flex-col gap-3 rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:flex-row md:items-center md:justify-between md:rounded-3xl md:p-6"
            >
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-950">
                  {request.title}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {request.city} / {request.zone}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    {request.category.name}
                  </span>
                  {request.budget ? (
                    <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                      {request.budget}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="self-start rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white md:self-auto">
                {statusCopy[request.status]}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
