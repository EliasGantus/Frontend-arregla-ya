import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useAuth } from '@/features/auth/context/auth-context';
import { profileService } from '@/features/profile/services/profile-service';
import { categoriesService } from '@/features/service-requests/services/categories-service';
import { ApiError } from '@/shared/api/api-error';
import type { AuthUser, CategorySummary } from '@/shared/types/api';
import {
  profileSchema,
  type ProfileFormValues,
} from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { StatusPanel } from '@/shared/ui/status-panel';
import { Textarea } from '@/shared/ui/textarea';

const roleCopy: Record<AuthUser['role'], string> = {
  admin: 'Administrador',
  cliente: 'Cliente',
  profesional: 'Profesional',
};

const defaultProfileSettings = (user: AuthUser | null): ProfileFormValues => ({
  fullName: user?.fullName ?? '',
  city: user?.city ?? '',
  zone: user?.zone ?? '',
  phone: '',
  profilePhotoUrl: '',
  available: user?.role === 'profesional',
  specialties: [],
  workPhotos: '',
});

const toBackendProfile = (values: ProfileFormValues) => ({
  fullName: values.fullName,
  city: values.city,
  zone: values.zone,
});

const selectedSpecialtyNames = (
  categories: CategorySummary[] | undefined,
  specialtyIds: string[] | undefined,
) => {
  const selectedIds = new Set(specialtyIds ?? []);

  return (categories ?? [])
    .filter((category) => selectedIds.has(category.id))
    .map((category) => category.name);
};

const profileInitials = (name: string | undefined) =>
  (name || 'AY')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart.charAt(0))
    .join('')
    .toUpperCase();

const workPhotoList = (value: string | undefined) =>
  (value ?? '')
    .split('\n')
    .map((photo) => photo.trim())
    .filter(Boolean)
    .slice(0, 4);

export const ProfilePage = () => {
  const { updateUser, user } = useAuth();
  const [savedSettings, setSavedSettings] = useState<ProfileFormValues>(() =>
    defaultProfileSettings(user),
  );
  const [hasHydratedProfile, setHasHydratedProfile] = useState(false);
  const query = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.me(),
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories', 'profile'],
    queryFn: () => categoriesService.list(),
    enabled: user?.role === 'profesional',
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: savedSettings,
  });
  const watchedValues = watch();
  const previewSpecialties = useMemo(
    () =>
      selectedSpecialtyNames(categoriesQuery.data, savedSettings.specialties),
    [categoriesQuery.data, savedSettings.specialties],
  );
  const currentName = savedSettings.fullName || user?.fullName || 'Usuario';
  const currentEmail = query.data?.email ?? user?.email ?? 'Email pendiente';
  const currentLocation =
    savedSettings.city && savedSettings.zone
      ? `${savedSettings.city} / ${savedSettings.zone}`
      : 'Ubicacion pendiente';
  const currentPhone = savedSettings.phone || 'Telefono pendiente';
  const watchedSpecialties = selectedSpecialtyNames(
    categoriesQuery.data,
    watchedValues.specialties,
  );
  const previewWorkPhotos = workPhotoList(watchedValues.workPhotos);
  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => ({
      updatedUser: await profileService.update(toBackendProfile(values)),
      values,
    }),
    onSuccess: ({ updatedUser, values }) => {
      const syncedUser = {
        ...updatedUser,
        fullName: values.fullName,
        city: values.city,
        zone: values.zone,
      };
      const nextSettings: ProfileFormValues = {
        ...values,
      };
      updateUser(syncedUser);
      setHasHydratedProfile(true);
      setSavedSettings(nextSettings);
      reset(nextSettings);
    },
  });

  useEffect(() => {
    if (!query.data || isDirty || hasHydratedProfile) {
      return;
    }

    setSavedSettings((currentSettings) => {
      const nextSettings = {
        ...currentSettings,
        fullName: query.data.fullName,
        city: query.data.city ?? '',
        zone: query.data.zone ?? '',
      };
      reset(nextSettings);

      return nextSettings;
    });
    setHasHydratedProfile(true);
  }, [hasHydratedProfile, isDirty, query.data, reset]);

  const submitProfile = (values: ProfileFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Perfil"
          title="Configuracion de usuario"
          description="Actualiza datos personales, foto, contacto y preferencias del perfil segun el tipo de cuenta."
        />
      </div>

      {mutation.error instanceof ApiError || query.error instanceof ApiError ? (
        <Card className="border border-red-200 bg-red-50">
          <p className="text-sm font-semibold text-red-800">
            No pudimos guardar el perfil
          </p>
          <p className="mt-2 text-sm text-red-700">
            {(mutation.error instanceof ApiError && mutation.error.message) ||
              (query.error instanceof ApiError && query.error.message)}
          </p>
        </Card>
      ) : null}

      {mutation.isSuccess ? (
        <Card className="border border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800">
            Perfil actualizado. Los cambios ya se reflejan en esta cuenta.
          </p>
        </Card>
      ) : null}

      <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div className="flex flex-col items-center gap-4 md:flex-row md:text-left">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-ink text-3xl font-black text-white shadow-lg shadow-slate-300/70 md:h-20 md:w-20 md:rounded-2xl md:bg-brand-100 md:text-2xl md:text-brand-700">
              {savedSettings.profilePhotoUrl ? (
                <img
                  alt={`Foto de ${currentName}`}
                  className="h-full w-full object-cover"
                  src={savedSettings.profilePhotoUrl}
                />
              ) : (
                profileInitials(currentName)
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl font-black text-slate-950">
                {currentName}
              </h3>
              <p className="mt-1 break-all text-sm font-medium text-slate-500">
                {currentEmail}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                <Badge className="bg-accent-50 text-accent-700">
                  {user ? roleCopy[user.role] : 'Usuario'}
                </Badge>
                {savedSettings.city && savedSettings.zone ? (
                  <Badge>{currentLocation}</Badge>
                ) : null}
              </div>
            </div>
          </div>
          <div className="hidden rounded-2xl bg-slate-50 px-4 py-3 md:block">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Telefono
            </p>
            <p className="mt-1 font-bold text-slate-950">{currentPhone}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:hidden">
          {[
            { label: 'Email', value: currentEmail },
            { label: 'Telefono', value: currentPhone },
            { label: 'Ubicacion', value: currentLocation },
            {
              label: 'Estado',
              value:
                user?.role === 'profesional'
                  ? savedSettings.available
                    ? 'Disponible ahora'
                    : 'Agenda pausada'
                  : 'Cuenta cliente',
            },
          ].map((row) => (
            <div
              className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 text-left"
              key={row.label}
            >
              <p className="text-xs font-semibold uppercase text-slate-400">
                {row.label}
              </p>
              <p className="min-w-0 break-words text-right text-sm font-bold text-slate-950">
                {row.value}
              </p>
            </div>
          ))}
        </div>

        <a
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-400 md:hidden"
          href="#editar-perfil"
        >
          Editar perfil
        </a>
      </Card>

      {user?.role === 'profesional' ? (
        <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Profesional
              </p>
              <p className="mt-1 text-lg font-black text-slate-950">
                Servicios activos
              </p>
            </div>
            <Badge className="bg-accent-50 text-accent-700">
              {savedSettings.available ? 'Activo' : 'Pausado'}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(previewSpecialties.length ? previewSpecialties : ['Sin definir'])
              .slice(0, 3)
              .map((specialty) => (
                <span
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                  key={specialty}
                >
                  {specialty}
                </span>
              ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <Card
          className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6"
          id="editar-perfil"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Editar perfil
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Los datos basicos se sincronizan con la cuenta; el resto
                actualiza la configuracion visible de esta pantalla.
              </p>
            </div>
            <Badge>Mi perfil</Badge>
          </div>

          <form
            className="mt-6 grid gap-4 md:grid-cols-2"
            onSubmit={(event) => void handleSubmit(submitProfile)(event)}
          >
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nombre completo
              </span>
              <Input
                error={errors.fullName?.message}
                {...register('fullName')}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Telefono
              </span>
              <Input
                error={errors.phone?.message}
                placeholder="11 5555 5555"
                type="tel"
                {...register('phone')}
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
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Foto de perfil
              </span>
              <Input
                error={errors.profilePhotoUrl?.message}
                placeholder="https://..."
                type="url"
                {...register('profilePhotoUrl')}
              />
            </label>

            {user?.role === 'profesional' ? (
              <>
                <div className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Especialidades
                  </span>
                  {categoriesQuery.error instanceof ApiError ? (
                    <p className="text-sm text-amber-700">
                      {categoriesQuery.error.message}
                    </p>
                  ) : null}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(categoriesQuery.data ?? []).map((category) => (
                      <label
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                        key={category.id}
                      >
                        <input
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          type="checkbox"
                          value={category.id}
                          {...register('specialties')}
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                  {errors.specialties ? (
                    <p className="text-sm text-red-600">
                      {errors.specialties.message}
                    </p>
                  ) : null}
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    type="checkbox"
                    {...register('available')}
                  />
                  Disponible para nuevos trabajos
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Fotos de trabajos realizados
                  </span>
                  <Textarea
                    error={errors.workPhotos?.message}
                    placeholder="Pega URLs separadas por salto de linea."
                    {...register('workPhotos')}
                  />
                </label>
              </>
            ) : null}

            <div className="md:col-span-2">
              <Button
                className="w-full sm:w-auto"
                disabled={mutation.isPending}
                variant="secondary"
                type="submit"
              >
                {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="hidden md:block xl:sticky xl:top-6 xl:self-start">
          <p className="text-sm font-semibold uppercase text-slate-400">
            {user?.role === 'profesional' ? 'Vista publica' : 'Vista de cuenta'}
          </p>
          <div className="mt-4 space-y-5">
            <div>
              <h3 className="text-2xl font-black text-slate-950">
                {watchedValues.fullName || savedSettings.fullName}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {watchedValues.city || savedSettings.city} /{' '}
                {watchedValues.zone || savedSettings.zone}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Contacto
                </p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {watchedValues.phone || 'Telefono pendiente'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Estado
                </p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {user?.role === 'profesional'
                    ? watchedValues.available
                      ? 'Disponible'
                      : 'Agenda pausada'
                    : 'Cuenta cliente'}
                </p>
              </div>
            </div>
            {user?.role === 'profesional' ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Especialidades publicas
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(watchedSpecialties.length
                      ? watchedSpecialties
                      : previewSpecialties
                    ).map((specialty) => (
                      <span
                        className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                        key={specialty}
                      >
                        {specialty}
                      </span>
                    ))}
                    {!watchedValues.specialties?.length &&
                    !previewSpecialties.length ? (
                      <span className="text-sm text-slate-500">
                        Sin especialidades seleccionadas.
                      </span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Trabajos realizados
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {previewWorkPhotos.map((photo) => (
                      <img
                        alt="Trabajo realizado"
                        className="h-28 w-full rounded-2xl border border-slate-200 object-cover"
                        key={photo}
                        src={photo}
                      />
                    ))}
                    {!watchedValues.workPhotos?.trim() ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 sm:col-span-2">
                        Agrega fotos para enriquecer el perfil publico.
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
};
