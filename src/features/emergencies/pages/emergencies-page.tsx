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
import {
  emergencySchema,
  type EmergencyFormValues,
} from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';
import { Textarea } from '@/shared/ui/textarea';

const toScheduledAt = (date?: string, time?: string) =>
  date && time
    ? new Date(`${date}T${time}:00`).toISOString()
    : new Date().toISOString();

const sortByScore = (professionals: ProfessionalSearchResult[]) =>
  [...professionals].sort((first, second) => {
    if (second.ratingAverage !== first.ratingAverage) {
      return second.ratingAverage - first.ratingAverage;
    }

    return second.ratingCount - first.ratingCount;
  });

export const EmergenciesPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ProfessionalSearchFilters | null>(
    null,
  );
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
    mutationFn: (payload: CreateEmergencyInput) =>
      emergenciesService.create(payload),
    onSuccess: (response) => {
      setEmergency(response);
      setNotice(
        'Solicitud de emergencia creada. Recibiras una notificacion de confirmacion.',
      );
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
  const noImmediateAvailability =
    searched && !professionalsQuery.isFetching && !professionals.length;

  const searchNow = (values: EmergencyFormValues) => {
    setEmergency(null);
    setNotice(null);
    setFilters({
      categoryId: values.categoryId,
      zone: values.zone.trim(),
      availableAt: new Date().toISOString(),
    });
  };

  const createEmergency = (
    values: EmergencyFormValues,
    scheduledAt: string,
  ) => {
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
    createEmergency(
      values,
      toScheduledAt(values.scheduledDate, values.scheduledTime),
    );
  };

  const emergencyState = emergency
    ? 'Creada'
    : professionalsQuery.isFetching
      ? 'Buscando'
      : searched
        ? 'Lista'
        : 'Pendiente';

  return (
    <div className="space-y-5 pb-24 md:space-y-6 md:pb-0">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Emergencias"
          title="Solicitud urgente de profesional"
          description="Selecciona el problema, revisa profesionales disponibles ahora y solicita ayuda inmediata o agenda el primer horario posible."
        />
      </div>

      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300/50 md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">
              Emergencias
            </p>
            <h1 className="mt-3 text-3xl font-black leading-none">
              Ayuda urgente
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Busca profesionales disponibles ahora o agenda el primer horario
              posible.
            </p>
          </div>
          <Badge className="shrink-0 bg-white/10 text-white">Ahora</Badge>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-3">
            <p className="text-2xl font-black leading-none">
              {professionals.length}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Disponibles
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-3">
            <p className="text-lg font-black leading-none">{emergencyState}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Estado
            </p>
          </div>
        </div>
      </section>

      {notice ? (
        <Card className="border border-emerald-200 bg-emerald-50 shadow-emerald-100/70">
          <p className="text-sm font-semibold text-emerald-800">{notice}</p>
          {emergency ? (
            <p className="mt-2 text-sm text-emerald-700">
              Reserva pendiente con {emergency.booking.professionalName} para{' '}
              {emergency.serviceRequest.title}.
            </p>
          ) : null}
        </Card>
      ) : null}

      {categoriesQuery.error instanceof ApiError ||
      professionalsQuery.error instanceof ApiError ||
      emergencyMutation.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50 shadow-amber-100/70">
          <p className="text-sm font-semibold text-amber-800">
            No pudimos procesar la emergencia
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {(emergencyMutation.error instanceof ApiError &&
              emergencyMutation.error.message) ||
              (professionalsQuery.error instanceof ApiError &&
                professionalsQuery.error.message) ||
              (categoriesQuery.error instanceof ApiError &&
                categoriesQuery.error.message)}
          </p>
        </Card>
      ) : null}

      <Card className="p-4 sm:p-6">
        <div className="mb-5 md:hidden">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Datos del problema
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">
            Contanos que paso
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Completamos la busqueda con tu zona y priorizamos profesionales
            activos.
          </p>
        </div>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => void handleSubmit(searchNow)(event)}
        >
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Tipo de emergencia
            </span>
            <Select
              error={errors.categoryId?.message}
              {...register('categoryId')}
            >
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
            <Input
              placeholder="Caneria rota"
              error={errors.title?.message}
              {...register('title')}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Ciudad</span>
            <Input error={errors.city?.message} {...register('city')} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Zona</span>
            <Input
              placeholder="Palermo"
              error={errors.zone?.message}
              {...register('zone')}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Detalle urgente
            </span>
            <Textarea
              placeholder="Contanos que paso, si hay riesgo y como acceder al domicilio."
              error={errors.description?.message}
              {...register('description')}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Notas de contacto
            </span>
            <Input
              placeholder="Telefono alternativo, timbre o indicaciones"
              {...register('notes')}
            />
          </label>

          <div className="md:col-span-2">
            <Button
              className="w-full sm:w-auto"
              type="submit"
              disabled={professionalsQuery.isFetching}
            >
              {professionalsQuery.isFetching
                ? 'Buscando...'
                : 'Solicitud de emergencia'}
            </Button>
          </div>
        </form>
      </Card>

      {professionals.length ? (
        <section className="grid gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 md:hidden">
                Respuesta inmediata
              </p>
              <h3 className="mt-1 text-xl font-black leading-tight text-slate-950 md:mt-0 md:font-bold">
                Profesionales disponibles ahora
              </h3>
            </div>
            <Badge className="shrink-0">
              {professionals.length} disponibles
            </Badge>
          </div>
          {professionals.map((professional) => (
            <Card
              key={professional.id}
              className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-6"
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3 md:block">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                      {professional.specialties?.[0]?.name ?? 'Servicio'}
                    </p>
                    <h4 className="mt-1 text-lg font-black leading-tight text-slate-950 md:font-bold">
                      {professional.fullName}
                    </h4>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 md:hidden">
                    Online
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {professional.city ?? 'Ciudad sin cargar'} -{' '}
                  {professional.zone ?? 'Zona sin cargar'}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">
                    {professional.ratingAverage.toFixed(1)} puntaje
                  </span>
                  <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">
                    {professional.ratingCount} resenas
                  </span>
                </div>
              </div>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <Button
                  className="w-full sm:w-auto"
                  disabled={emergencyMutation.isPending}
                  onClick={requestImmediate}
                  variant="secondary"
                >
                  Solicitar ahora
                </Button>
                <a
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-center text-sm font-semibold leading-tight text-slate-700 transition hover:border-brand-300 hover:text-brand-700 sm:w-auto"
                  href={`mailto:${professional.email}?subject=Emergencia ArreglaYa`}
                >
                  Contactar
                </a>
              </div>
            </Card>
          ))}
        </section>
      ) : null}

      {noImmediateAvailability ? (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Sin disponibilidad inmediata
              </p>
              <p className="mt-2 text-base font-black leading-tight text-slate-950">
                No hay profesionales disponibles en este momento.
              </p>
            </div>
            <Badge className="w-fit bg-amber-50 text-amber-700">Agenda</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Puedes agendar la emergencia para el horario mas proximo disponible.
            Te avisaremos cuando el profesional confirme el turno.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Proxima fecha
              </span>
              <Input type="date" {...register('scheduledDate')} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Horario
              </span>
              <Input type="time" {...register('scheduledTime')} />
            </label>
            <div className="flex items-end">
              <Button
                className="w-full"
                disabled={emergencyMutation.isPending}
                onClick={scheduleFallback}
                variant="secondary"
              >
                Agendar proximo horario
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
};
