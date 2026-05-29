import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useAuth } from '@/features/auth/context/auth-context';
import { emergenciesService } from '@/features/emergencies/services/emergencies-service';
import { professionalsService } from '@/features/professionals/services/professionals-service';
import { categoriesService } from '@/features/service-requests/services/categories-service';
import { ApiError } from '@/shared/api/api-error';
import type {
  CreateEmergencyInput,
  EmergencyResponse,
  ProfessionalSearchFilters,
  ProfessionalSearchResult,
} from '@/shared/types/api';
import { emergencySchema, type EmergencyFormValues } from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';
import { Textarea } from '@/shared/ui/textarea';

const toScheduledAt = (date?: string, time?: string) =>
  date && time ? new Date(`${date}T${time}:00`).toISOString() : new Date().toISOString();

const sortByScore = (professionals: ProfessionalSearchResult[]) =>
  [...professionals].sort((first, second) => {
    if (second.ratingAverage !== first.ratingAverage) {
      return second.ratingAverage - first.ratingAverage;
    }

    return second.ratingCount - first.ratingCount;
  });

export const EmergenciesPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ProfessionalSearchFilters | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [emergency, setEmergency] = useState<EmergencyResponse | null>(null);
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.list(),
  });
  const professionalsQuery = useQuery({
    queryKey: ['professionals', 'emergency', filters],
    queryFn: () => professionalsService.search(filters ?? {}),
    enabled: Boolean(filters),
  });
  const emergencyMutation = useMutation({
    mutationFn: (payload: CreateEmergencyInput) => emergenciesService.create(payload),
    onSuccess: (response) => {
      setEmergency(response);
      setNotice('Solicitud de emergencia creada. Recibiras una notificacion de confirmacion.');
    },
  });
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<EmergencyFormValues>({
    resolver: zodResolver(emergencySchema),
    defaultValues: {
      categoryId: '',
      title: '',
      description: '',
      city: user?.city ?? 'Buenos Aires',
      zone: user?.zone ?? '',
      scheduledDate: '',
      scheduledTime: '',
      notes: '',
    },
  });
  const professionals = useMemo(
    () => sortByScore(professionalsQuery.data ?? []),
    [professionalsQuery.data],
  );
  const searched = Boolean(filters);
  const noImmediateAvailability = searched && !professionalsQuery.isFetching && !professionals.length;

  const searchNow = (values: EmergencyFormValues) => {
    setEmergency(null);
    setNotice(null);
    setFilters({
      categoryId: values.categoryId,
      zone: values.zone.trim(),
      availableAt: new Date().toISOString(),
    });
  };

  const createEmergency = (values: EmergencyFormValues, scheduledAt: string) => {
    emergencyMutation.mutate({
      title: values.title,
      description: values.description,
      categoryId: values.categoryId,
      city: values.city,
      zone: values.zone,
      scheduledAt,
      notes: values.notes?.trim() || undefined,
    });
  };

  const requestImmediate = () => {
    createEmergency(getValues(), new Date().toISOString());
  };

  const scheduleFallback = () => {
    const values = getValues();
    createEmergency(values, toScheduledAt(values.scheduledDate, values.scheduledTime));
  };

  return (
    <div className="space-y-6">
      <StatusPanel
        eyebrow="Emergencias"
        title="Solicitud urgente de profesional"
        description="Selecciona el problema, revisa profesionales disponibles ahora y solicita ayuda inmediata o agenda el primer horario posible."
      />

      {notice ? (
        <Card className="border border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800">{notice}</p>
          {emergency ? (
            <p className="mt-2 text-sm text-emerald-700">
              Reserva pendiente con {emergency.booking.professionalName} para {emergency.serviceRequest.title}.
            </p>
          ) : null}
        </Card>
      ) : null}

      {categoriesQuery.error instanceof ApiError ||
      professionalsQuery.error instanceof ApiError ||
      emergencyMutation.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">No pudimos procesar la emergencia</p>
          <p className="mt-2 text-sm text-amber-700">
            {(emergencyMutation.error instanceof ApiError && emergencyMutation.error.message) ||
              (professionalsQuery.error instanceof ApiError && professionalsQuery.error.message) ||
              (categoriesQuery.error instanceof ApiError && categoriesQuery.error.message)}
          </p>
        </Card>
      ) : null}

      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => void handleSubmit(searchNow)(event)}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Tipo de emergencia</span>
            <Select error={errors.categoryId?.message} {...register('categoryId')}>
              <option value="">Selecciona el problema</option>
              {categoriesQuery.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Titulo</span>
            <Input placeholder="Caneria rota" error={errors.title?.message} {...register('title')} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Ciudad</span>
            <Input error={errors.city?.message} {...register('city')} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Zona</span>
            <Input placeholder="Palermo" error={errors.zone?.message} {...register('zone')} />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Detalle urgente</span>
            <Textarea
              placeholder="Contanos que paso, si hay riesgo y como acceder al domicilio."
              error={errors.description?.message}
              {...register('description')}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Notas de contacto</span>
            <Input placeholder="Telefono alternativo, timbre o indicaciones" {...register('notes')} />
          </label>

          <div className="md:col-span-2">
            <Button type="submit" disabled={professionalsQuery.isFetching}>
              {professionalsQuery.isFetching ? 'Buscando...' : 'Solicitud de emergencia'}
            </Button>
          </div>
        </form>
      </Card>

      {professionals.length ? (
        <div className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-bold text-slate-950">Profesionales disponibles ahora</h3>
            <Badge>{professionals.length} disponibles</Badge>
          </div>
          {professionals.map((professional) => (
            <Card key={professional.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-950">{professional.fullName}</h4>
                <p className="mt-1 text-sm text-slate-600">
                  {professional.city ?? 'Ciudad sin cargar'} - {professional.zone ?? 'Zona sin cargar'}
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-700">
                  Puntaje {professional.ratingAverage.toFixed(1)} - {professional.ratingCount} resenas
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={emergencyMutation.isPending}
                  onClick={requestImmediate}
                  variant="secondary"
                >
                  Solicitar ahora
                </Button>
                <a
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                  href={`mailto:${professional.email}?subject=Emergencia ArreglaYa`}
                >
                  Contactar
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {noImmediateAvailability ? (
        <Card>
          <p className="text-sm font-semibold text-slate-900">No hay profesionales disponibles en este momento.</p>
          <p className="mt-2 text-sm text-slate-600">
            Puedes agendar la emergencia para el horario mas proximo disponible. Te avisaremos cuando el profesional
            confirme el turno.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Proxima fecha</span>
              <Input type="date" {...register('scheduledDate')} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Horario</span>
              <Input type="time" {...register('scheduledTime')} />
            </label>
            <div className="flex items-end">
              <Button disabled={emergencyMutation.isPending} onClick={scheduleFallback} variant="secondary">
                Agendar proximo horario
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
};
