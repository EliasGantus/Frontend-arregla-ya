import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { useAuth } from '@/features/auth/context/auth-context';
import { categoriesService } from '@/features/service-requests/services/categories-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';
import { ApiError } from '@/shared/api/api-error';
import { serviceRequestSchema, type ServiceRequestFormValues } from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';
import { Textarea } from '@/shared/ui/textarea';

export const ServiceRequestsPage = () => (
  <ServiceRequestsContent />
);

const ServiceRequestsContent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['service-requests'],
    queryFn: serviceRequestsService.list,
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.list,
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
    mutationFn: serviceRequestsService.create,
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

  return (
    <div className="space-y-6">
      <StatusPanel
        eyebrow="Solicitudes"
        title="Flujo base de solicitud y cotización"
        description="Vista conectable para el núcleo del marketplace. Cuando la API no está disponible, la app mantiene el shell operativo y deja el error visible."
      />

      {categoriesQuery.error instanceof ApiError || query.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">Backend no disponible</p>
          <p className="mt-2 text-sm text-amber-700">
            {(query.error instanceof ApiError && query.error.message) ||
              (categoriesQuery.error instanceof ApiError && categoriesQuery.error.message)}
          </p>
        </Card>
      ) : null}

      {canCreate ? (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Crear solicitud</h2>
              <p className="mt-2 text-sm text-slate-600">Este formulario envía `POST /service-requests` al backend real.</p>
            </div>
            <Badge>POST /service-requests</Badge>
          </div>

          {mutation.error instanceof ApiError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {mutation.error.message}
            </div>
          ) : null}

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => mutation.mutateAsync(values))}>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Título</span>
              <Input error={errors.title?.message} {...register('title')} />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Descripción</span>
              <Textarea error={errors.description?.message} {...register('description')} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Categoría</span>
              <Select error={errors.categoryId?.message} {...register('categoryId')}>
                <option value="">Selecciona una categoría</option>
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Presupuesto</span>
              <Input placeholder="$85.000" error={errors.budget?.message} {...register('budget')} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Ciudad</span>
              <Input error={errors.city?.message} {...register('city')} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Zona</span>
              <Input error={errors.zone?.message} {...register('zone')} />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creando...' : 'Crear solicitud'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {!requests.length && !query.isLoading ? (
          <Card>
            <p className="text-sm text-slate-600">No hay solicitudes disponibles para tu rol en este momento.</p>
          </Card>
        ) : null}
        {requests.map((request) => (
          <Card key={request.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-bold text-slate-950">{request.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {request.city} · {request.zone}
              </p>
              <p className="mt-2 text-sm text-slate-600">{request.category.name}</p>
            </div>
            <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              Estado: {request.status}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
