import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useAuth } from '@/features/auth/context/auth-context';
import { profileService } from '@/features/profile/services/profile-service';
import { ApiError } from '@/shared/api/api-error';
import { profileSchema, type ProfileFormValues } from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { StatusPanel } from '@/shared/ui/status-panel';

export const ProfilePage = () => {
  const { updateUser, user } = useAuth();
  const query = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.me,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      city: user?.city ?? '',
      zone: user?.zone ?? '',
    },
  });
  const mutation = useMutation({
    mutationFn: profileService.update,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      reset({
        fullName: updatedUser.fullName,
        city: updatedUser.city ?? '',
        zone: updatedUser.zone ?? '',
      });
    },
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    reset({
      fullName: query.data.fullName,
      city: query.data.city ?? '',
      zone: query.data.zone ?? '',
    });
  }, [query.data, reset]);

  return (
    <div className="space-y-6">
      <StatusPanel
        eyebrow="Perfil"
        title="Base de perfil conectable"
        description="Pantalla placeholder para datos del usuario autenticado, pensada para evolucionar a edición de perfil, cobertura y preferencias."
      />

      {mutation.error instanceof ApiError ? (
        <Card className="border border-red-200 bg-red-50">
          <p className="text-sm font-semibold text-red-800">{mutation.error.message}</p>
        </Card>
      ) : null}

      <Card className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Nombre completo</p>
          <p className="mt-2 text-xl font-bold text-slate-950">{query.data?.fullName ?? user?.fullName}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Email</p>
          <p className="mt-2 text-xl font-bold text-slate-950">{query.data?.email ?? user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Ubicación</p>
          <p className="mt-2 text-xl font-bold text-slate-950">
            {query.data?.city || user?.city || 'Ciudad pendiente'} / {query.data?.zone || user?.zone || 'Zona pendiente'}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Rol</p>
          <div className="mt-2">
            <Badge>{query.data?.role ?? user?.role}</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Editar perfil</h2>
            <p className="mt-2 text-sm text-slate-600">Actualiza los datos que ya consume el backend en `/me`.</p>
          </div>
          <Badge>PATCH /me</Badge>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => mutation.mutateAsync(values))}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Nombre completo</span>
            <Input error={errors.fullName?.message} {...register('fullName')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Ciudad</span>
            <Input error={errors.city?.message} {...register('city')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Zona</span>
            <Input error={errors.zone?.message} {...register('zone')} />
          </label>
          <div className="flex items-end">
            <Button className="w-full md:w-auto" type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
