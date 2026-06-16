import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { bookingsService } from '@/features/bookings/services/bookings-service';
import { professionalsService } from '@/features/professionals/services/professionals-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';
import { categoriesService } from '@/features/service-requests/services/categories-service';
import { ApiError } from '@/shared/api/api-error';
import type {
  Booking,
  CreateBookingInput,
  ProfessionalSearchFilters,
  ProfessionalSearchResult,
} from '@/shared/types/api';
import {
  bookingSchema,
  type BookingFormValues,
  professionalSearchSchema,
  type ProfessionalSearchFormValues,
} from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { NeighborhoodSelect } from '@/shared/ui/neighborhood-select';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';

export const ProfessionalsPage = () => <ProfessionalsSearchContent />;

interface WorkPhoto {
  alt: string;
  src: string;
  title: string;
}

const galleryBySpecialty: Record<string, WorkPhoto[]> = {
  plomeria: [
    {
      title: 'Instalacion sanitaria',
      alt: 'Trabajo de plomeria en cocina',
      src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=720&q=80',
    },
    {
      title: 'Reparacion de canerias',
      alt: 'Herramientas de plomeria sobre una mesada',
      src: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=720&q=80',
    },
    {
      title: 'Mantenimiento preventivo',
      alt: 'Tecnico trabajando en una instalacion domestica',
      src: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=720&q=80',
    },
  ],
  electricidad: [
    {
      title: 'Tablero domiciliario',
      alt: 'Electricista revisando un tablero',
      src: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=720&q=80',
    },
    {
      title: 'Instalacion segura',
      alt: 'Herramientas electricas en banco de trabajo',
      src: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=720&q=80',
    },
    {
      title: 'Revision de conexiones',
      alt: 'Tecnico con instrumental de medicion',
      src: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=720&q=80',
    },
  ],
  default: [
    {
      title: 'Trabajo terminado',
      alt: 'Profesional preparando herramientas',
      src: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=720&q=80',
    },
    {
      title: 'Herramientas listas',
      alt: 'Herramientas ordenadas para una reparacion',
      src: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=720&q=80',
    },
    {
      title: 'Servicio en domicilio',
      alt: 'Persona trabajando en mantenimiento del hogar',
      src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=720&q=80',
    },
  ],
};

const formatRating = (rating: number) =>
  new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(rating);

const sortByScore = (professionals: ProfessionalSearchResult[]) =>
  [...professionals].sort((first, second) => {
    if (second.ratingAverage !== first.ratingAverage) {
      return second.ratingAverage - first.ratingAverage;
    }

    if (second.ratingCount !== first.ratingCount) {
      return second.ratingCount - first.ratingCount;
    }

    return first.fullName.localeCompare(second.fullName);
  });

const getPrimarySpecialty = (professional: ProfessionalSearchResult) =>
  professional.specialties[0]?.name ?? 'Especialidad sin cargar';

const getWorkPhotos = (professional: ProfessionalSearchResult) =>
  galleryBySpecialty[professional.specialties[0]?.slug ?? ''] ??
  galleryBySpecialty.default;

const toScheduledAt = (date: string, time: string) =>
  new Date(`${date}T${time}:00`).toISOString();

const useProfessionalProfile = (
  professionalId: string | undefined,
  professionalFromState: ProfessionalSearchResult | undefined,
  queryScope: string,
) =>
  useQuery({
    queryKey: ['professionals', queryScope, professionalId],
    queryFn: async () => {
      const professionals = await professionalsService.search();

      return professionals.find(
        (professional) => professional.id === professionalId,
      );
    },
    enabled: Boolean(professionalId && !professionalFromState),
  });

const ProfessionalsSearchContent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState<ProfessionalSearchFilters | null>(
    null,
  );
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.list(),
  });
  const professionalsQuery = useQuery({
    queryKey: ['professionals', 'search', filters],
    queryFn: () => professionalsService.search(filters ?? {}),
    enabled: Boolean(filters),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfessionalSearchFormValues>({
    resolver: zodResolver(professionalSearchSchema),
    defaultValues: {
      categoryId: '',
      zone: user?.zone ?? '',
      availableNow: false,
    },
  });
  const professionals = useMemo(
    () => sortByScore(professionalsQuery.data ?? []),
    [professionalsQuery.data],
  );
  const hasSearched = Boolean(filters);
  const availableProfessionals = professionals.filter(
    (professional) => professional.available,
  ).length;
  const reviewsCount = professionals.reduce(
    (total, professional) => total + professional.ratingCount,
    0,
  );
  const professionalStats = [
    { label: 'Resultados', value: professionals.length },
    { label: 'Disponibles', value: availableProfessionals },
    { label: 'Resenas', value: reviewsCount },
  ];

  const submitSearch = (values: ProfessionalSearchFormValues) => {
    setFilters({
      categoryId: values.categoryId,
      zone: values.zone.trim(),
      availableAt: values.availableNow ? new Date().toISOString() : undefined,
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Profesionales"
          title="Busqueda por especialidad, zona y disponibilidad"
          description="Filtra profesionales activos, compara puntaje y resenas, y entra al perfil para validar si encaja con tu necesidad."
        />
      </div>

      <Card className="rounded-[28px] !bg-ink p-5 text-white shadow-lg shadow-slate-300/70 md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
              Profesionales
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight">
              Encontra ayuda confiable
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Filtra por oficio, zona y disponibilidad para comparar opciones.
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-ink">
            {hasSearched ? `${professionals.length} total` : 'Buscar'}
          </div>
        </div>
      </Card>

      {categoriesQuery.error instanceof ApiError ||
      professionalsQuery.error instanceof ApiError ? (
        <Card className="rounded-[28px] border border-amber-200 bg-amber-50 md:rounded-3xl">
          <p className="text-sm font-semibold text-amber-800">
            Backend no disponible
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {(professionalsQuery.error instanceof ApiError &&
              professionalsQuery.error.message) ||
              (categoriesQuery.error instanceof ApiError &&
                categoriesQuery.error.message)}
          </p>
        </Card>
      ) : null}

      <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
            Filtros
          </p>
          <h2 className="text-xl font-black text-slate-950 md:text-xl">
            Buscar profesionales
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Ajusta la especialidad y la zona para encontrar perfiles relevantes.
          </p>
        </div>
        <form
          className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]"
          onSubmit={(event) => void handleSubmit(submitSearch)(event)}
        >
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Especialidad
            </span>
            <Select
              error={errors.categoryId?.message}
              {...register('categoryId')}
            >
              <option value="">Selecciona una especialidad</option>
              {categoriesQuery.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Zona</span>
            <NeighborhoodSelect
              error={errors.zone?.message}
              {...register('zone')}
            />
          </label>

          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                type="checkbox"
                {...register('availableNow')}
              />
              Disponible ahora
            </label>
            <Button
              className="w-full sm:w-auto"
              type="submit"
              disabled={professionalsQuery.isFetching}
            >
              {professionalsQuery.isFetching
                ? 'Buscando...'
                : 'Buscar profesionales'}
            </Button>
          </div>
        </form>
      </Card>

      <section className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
              Comparacion
            </p>
            <h2 className="text-xl font-black text-slate-950 md:text-xl">
              Resultados
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Los perfiles se ordenan por puntaje y cantidad de resenas.
            </p>
          </div>
          <Badge>{hasSearched ? `${professionals.length} encontrados` : 'Sin buscar'}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {professionalStats.map((stat) => (
            <div
              className="rounded-2xl bg-slate-50 px-3 py-3 text-center"
              key={stat.label}
            >
              <p className="text-lg font-black text-slate-950">{stat.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {!hasSearched ? (
        <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-xl font-black text-accent-600">
            0
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-950">
            Completa los filtros para iniciar la busqueda.
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            Los resultados se ordenan por puntaje y cantidad de resenas para que
            priorices profesionales mejor calificados.
          </p>
        </Card>
      ) : null}

      {hasSearched &&
      !professionalsQuery.isFetching &&
      !professionals.length ? (
        <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-xl font-black text-accent-600">
            0
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-950">
            No encontramos profesionales disponibles para esos filtros.
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            Amplia la zona, cambia la especialidad o quita la disponibilidad
            inmediata para ver mas opciones.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {professionals.map((professional) => (
          <Card
            key={professional.id}
            className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {getPrimarySpecialty(professional)}
                </p>
                <h3 className="mt-1 text-lg font-black leading-tight text-slate-950">
                  {professional.fullName}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {professional.city ?? 'Ciudad sin cargar'} -{' '}
                  {professional.zone ?? 'Zona sin cargar'}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  professional.available
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {professional.available ? 'Disponible' : 'Con agenda'}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {professional.specialties.map((specialty) => (
                <span
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                  key={specialty.id}
                >
                  {specialty.name}
                </span>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Puntaje
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {formatRating(professional.ratingAverage)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Resenas
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {professional.ratingCount}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="break-all text-sm text-slate-600">
                {professional.email}
              </p>
              <Button
                aria-label={`Ver perfil de ${professional.fullName}`}
                className="w-full sm:w-auto"
                onClick={() => {
                  void navigate(`/app/profesionales/${professional.id}`, {
                    state: { professional },
                  });
                }}
              >
                Ver perfil
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const ProfessionalProfilePage = () => {
  const navigate = useNavigate();
  const { professionalId } = useParams();
  const location = useLocation();
  const professionalFromState = (
    location.state as { professional?: ProfessionalSearchResult } | null
  )?.professional;
  const professionalIdValue = professionalId ?? '';
  const profileQuery = useProfessionalProfile(
    professionalId,
    professionalFromState,
    'profile',
  );
  const reviewsQuery = useQuery({
    queryKey: ['professionals', professionalId, 'reviews'],
    queryFn: () => professionalsService.reviews(professionalIdValue),
    enabled: Boolean(professionalId),
  });
  const professional = professionalFromState ?? profileQuery.data;
  const workPhotos = professional ? getWorkPhotos(professional) : [];
  const reviews = reviewsQuery.data ?? [];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Perfil profesional"
          title={
            professional
              ? `Perfil de ${professional.fullName}`
              : 'Perfil profesional'
          }
          description="Informacion de contacto, especialidades, disponibilidad y resenas del profesional seleccionado."
          actions={
            <>
              <Button
                className="w-full sm:w-auto"
                variant="ghost"
                onClick={() => {
                  void navigate('/app/profesionales');
                }}
              >
                Volver al buscador
              </Button>
              {professional ? (
                <Button
                  className="w-full sm:w-auto"
                  variant="secondary"
                  onClick={() => {
                    void navigate('/app/solicitudes');
                  }}
                >
                  Ver solicitudes
                </Button>
              ) : null}
            </>
          }
        />
      </div>

      <Button
        className="min-h-10 rounded-full bg-white px-4 py-2 text-slate-600 shadow-sm shadow-slate-200/70 md:hidden"
        variant="ghost"
        onClick={() => {
          void navigate('/app/profesionales');
        }}
      >
        Volver
      </Button>

      {professional ? (
        <Card className="rounded-[28px] !bg-ink p-5 text-white shadow-lg shadow-slate-300/70 md:hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
                Perfil profesional
              </p>
              <h1 className="mt-2 text-2xl font-black leading-tight">
                {professional.fullName}
              </h1>
              <p className="mt-2 text-sm font-semibold text-accent-100">
                {getPrimarySpecialty(professional)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {professional.city ?? 'Ciudad sin cargar'} /{' '}
                {professional.zone ?? 'Zona sin cargar'}
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-ink">
              {professional.available ? 'Disponible' : 'Agenda'}
            </div>
          </div>
        </Card>
      ) : null}

      {profileQuery.error instanceof ApiError ||
      reviewsQuery.error instanceof ApiError ? (
        <Card className="rounded-[28px] border border-amber-200 bg-amber-50 md:rounded-3xl">
          <p className="text-sm font-semibold text-amber-800">
            No pudimos cargar todo el perfil
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {(profileQuery.error instanceof ApiError &&
              profileQuery.error.message) ||
              (reviewsQuery.error instanceof ApiError &&
                reviewsQuery.error.message)}
          </p>
        </Card>
      ) : null}

      {!professional && !profileQuery.isLoading ? (
        <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-xl font-black text-accent-600">
            0
          </div>
          <h1 className="mt-4 text-xl font-black text-slate-950">
            No encontramos el profesional solicitado.
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            Vuelve al buscador y abre el perfil desde un resultado vigente.
          </p>
        </Card>
      ) : null}

      {professional ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
                    Contacto
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">
                    {professional.fullName}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-brand-700">
                    {getPrimarySpecialty(professional)}
                  </p>
                  <p className="mt-2 break-all text-sm text-slate-600">
                    {professional.email}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {professional.city ?? 'Ciudad sin cargar'} -{' '}
                    {professional.zone ?? 'Zona sin cargar'}
                  </p>
                </div>
                <span
                  className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    professional.available
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {professional.available ? 'Disponible' : 'Con agenda'}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {professional.specialties.map((specialty) => (
                  <span
                    className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                    key={specialty.id}
                  >
                    {specialty.name}
                  </span>
                ))}
              </div>
              <Button
                aria-label={`Ver solicitudes para ${professional.fullName}`}
                className="mt-6 w-full md:hidden"
                variant="secondary"
                onClick={() => {
                  void navigate('/app/solicitudes');
                }}
              >
                Ver solicitudes
              </Button>
            </Card>

            <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Reputacion
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Confianza del perfil
                  </h2>
                </div>
                <Badge>{reviews.length} resenas</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Puntaje
                  </p>
                  <p className="mt-1 text-3xl font-black text-slate-950">
                    {formatRating(professional.ratingAverage)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Resenas
                  </p>
                  <p className="mt-1 text-3xl font-black text-slate-950">
                    {professional.ratingCount}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Trabajos realizados
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  Fotos de servicios recientes
                </h3>
              </div>
              <Badge>{workPhotos.length} fotos</Badge>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3 md:gap-4">
              {workPhotos.map((photo) => (
                <figure
                  className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 md:rounded-2xl"
                  key={photo.src}
                >
                  <img
                    alt={photo.alt}
                    className="h-40 w-full object-cover md:h-44"
                    src={photo.src}
                  />
                  <figcaption className="px-4 py-3 text-sm font-semibold text-slate-700">
                    {photo.title}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Card>
        </>
      ) : null}

      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
              Opiniones
            </p>
            <h3 className="text-lg font-black text-slate-950">
              Resenas recientes
            </h3>
          </div>
          <Badge>{reviews.length} total</Badge>
        </div>
        {!reviewsQuery.isLoading && !reviews.length ? (
          <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
            <p className="text-sm text-slate-600">
              Este profesional todavia no tiene resenas publicadas.
            </p>
          </Card>
        ) : null}
        {reviews.map((review) => (
          <Card
            className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6"
            key={review.id}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {review.clientName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Cliente verificado
                </p>
              </div>
              <div
                aria-label={`${review.rating} de 5 estrellas`}
                className="text-sm font-bold text-accent-600"
              >
                {review.rating}/5 estrellas
              </div>
            </div>
            {review.comment ? (
              <p className="mt-3 text-sm text-slate-600">{review.comment}</p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
};

export const ProfessionalBookingPage = () => {
  const navigate = useNavigate();
  const { professionalId } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const professionalFromState = (
    location.state as { professional?: ProfessionalSearchResult } | null
  )?.professional;
  const professionalIdValue = professionalId ?? '';
  const profileQuery = useProfessionalProfile(
    professionalId,
    professionalFromState,
    'booking-profile',
  );
  const serviceRequestsQuery = useQuery({
    queryKey: ['service-requests', 'booking-flow'],
    queryFn: () => serviceRequestsService.list(),
  });
  const createBookingMutation = useMutation({
    mutationFn: (payload: CreateBookingInput) =>
      bookingsService.create(payload),
    onSuccess: async (booking) => {
      setCreatedBooking(booking);
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceRequestId: '',
      scheduledDate: '',
      scheduledTime: '',
      notes: '',
    },
  });
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const professional = professionalFromState ?? profileQuery.data;
  const serviceRequests = serviceRequestsQuery.data ?? [];
  const bookableRequests = serviceRequests.filter(
    (request) => request.status === 'assigned',
  );
  const availableRequests = bookableRequests.length;

  const submitBooking = (values: BookingFormValues) => {
    if (!professional) {
      return;
    }

    createBookingMutation.mutate({
      serviceRequestId: values.serviceRequestId,
      professionalId: professional.id,
      scheduledAt: toScheduledAt(values.scheduledDate, values.scheduledTime),
      notes: values.notes?.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Reserva de turno"
          title={
            professional
              ? `Reserva con ${professional.fullName}`
              : 'Reserva con profesional'
          }
          description="Inicio del flujo para coordinar fecha, horario y detalle del trabajo antes de confirmar la solicitud."
          actions={
            <Button
              className="w-full sm:w-auto"
              variant="ghost"
              onClick={() => {
                void navigate(`/app/profesionales/${professionalIdValue}`, {
                  state: professional ? { professional } : undefined,
                });
              }}
            >
              Volver al perfil
            </Button>
          }
        />
      </div>

      <Button
        className="min-h-10 rounded-full bg-white px-4 py-2 text-slate-600 shadow-sm shadow-slate-200/70 md:hidden"
        variant="ghost"
        onClick={() => {
          void navigate(`/app/profesionales/${professionalIdValue}`, {
            state: professional ? { professional } : undefined,
          });
        }}
      >
        Volver
      </Button>

      <Card className="rounded-[28px] !bg-ink p-5 text-white shadow-lg shadow-slate-300/70 md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
              Reserva de turno
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight">
              {professional
                ? `Coordina con ${professional.fullName}`
                : 'Reserva con profesional'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Elige solicitud, fecha y horario para dejar el servicio pendiente
              de confirmacion.
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-ink">
            Paso 2
          </div>
        </div>
      </Card>

      {profileQuery.error instanceof ApiError ? (
        <Card className="rounded-[28px] border border-amber-200 bg-amber-50 md:rounded-3xl">
          <p className="text-sm font-semibold text-amber-800">
            No pudimos cargar el profesional
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {profileQuery.error.message}
          </p>
        </Card>
      ) : null}

      {serviceRequestsQuery.error instanceof ApiError ||
      createBookingMutation.error instanceof ApiError ? (
        <Card className="rounded-[28px] border border-amber-200 bg-amber-50 md:rounded-3xl">
          <p className="text-sm font-semibold text-amber-800">
            No pudimos completar la reserva
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {(createBookingMutation.error instanceof ApiError &&
              createBookingMutation.error.message) ||
              (serviceRequestsQuery.error instanceof ApiError &&
                serviceRequestsQuery.error.message)}
          </p>
        </Card>
      ) : null}

      {createdBooking ? (
        <Card className="rounded-[28px] border border-emerald-200 bg-emerald-50 md:rounded-3xl">
          <p className="text-sm font-semibold text-emerald-800">
            Reserva creada con estado Pendiente. Recibiras una notificacion de
            confirmacion.
          </p>
          <p className="mt-2 text-sm text-emerald-700">
            Turno solicitado para{' '}
            {new Intl.DateTimeFormat('es-AR', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(createdBooking.scheduledAt))}
            .
          </p>
          <Button
            className="mt-4 w-full sm:w-auto"
            onClick={() => {
              void navigate('/app/reservas');
            }}
            variant="secondary"
          >
            Ver historial de servicios
          </Button>
        </Card>
      ) : null}

      {!professional && !profileQuery.isLoading ? (
        <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-xl font-black text-accent-600">
            0
          </div>
          <h1 className="mt-4 text-xl font-black text-slate-950">
            No encontramos el profesional para reservar.
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            Vuelve al buscador y selecciona un profesional disponible.
          </p>
        </Card>
      ) : null}

      {professional ? (
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Profesional seleccionado
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">
              {professional.fullName}
            </h3>
            <p className="mt-2 text-sm font-semibold text-brand-700">
              {getPrimarySpecialty(professional)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {professional.city ?? 'Ciudad sin cargar'} -{' '}
              {professional.zone ?? 'Zona sin cargar'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  professional.available
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {professional.available ? 'Disponible' : 'Con agenda'}
              </span>
              <Badge>{availableRequests} solicitudes</Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Puntaje
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {formatRating(professional.ratingAverage)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Resenas
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {professional.ratingCount}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
                Datos del turno
              </p>
              <h2 className="text-xl font-black text-slate-950">
                Completa la reserva
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Asocia una solicitud con cotizacion aceptada y propone una fecha tentativa.
              </p>
            </div>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => void handleSubmit(submitBooking)(event)}
            >
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Solicitud asociada
                </span>
                <Select
                  error={errors.serviceRequestId?.message}
                  {...register('serviceRequestId')}
                >
                  <option value="">Selecciona una solicitud asignada</option>
                  {bookableRequests.map((request) => (
                    <option key={request.id} value={request.id}>
                      {request.title} - {request.city} / {request.zone}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Fecha tentativa
                </span>
                <Input
                  error={errors.scheduledDate?.message}
                  type="date"
                  {...register('scheduledDate')}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Horario
                </span>
                <Input
                  error={errors.scheduledTime?.message}
                  type="time"
                  {...register('scheduledTime')}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Detalle del trabajo
                </span>
                <Input
                  error={errors.notes?.message}
                  placeholder="Ej. perdida bajo mesada, revisar antes del viernes"
                  {...register('notes')}
                />
              </label>
              {!bookableRequests.length && !serviceRequestsQuery.isLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:col-span-2">
                  Para reservar necesitas aceptar primero una cotizacion desde
                  el detalle de la solicitud.
                </div>
              ) : null}
              <div className="md:col-span-2">
                <Button
                  className="w-full sm:w-auto"
                  disabled={
                    createBookingMutation.isPending || !bookableRequests.length
                  }
                  type="submit"
                >
                  {createBookingMutation.isPending
                    ? 'Confirmando...'
                    : 'Confirmar reserva'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
};
