import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { bookingsService } from '@/features/bookings/services/bookings-service';
import { professionalsService } from '@/features/professionals/services/professionals-service';
import { reviewsService } from '@/features/reviews/services/reviews-service';
import { ApiError } from '@/shared/api/api-error';
import type { Booking, ProfessionalReview } from '@/shared/types/api';
import { reviewSchema, type ReviewFormValues } from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';
import { SuccessState } from '@/shared/ui/success-state';
import { Textarea } from '@/shared/ui/textarea';

const isReviewable = (booking: Booking) =>
  booking.availableActions?.includes('review');

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const ratingOptions = [1, 2, 3, 4, 5];

export const ReviewsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bookingFromState = (location.state as { booking?: Booking } | null)
    ?.booking;
  const [createdReview, setCreatedReview] = useState<ProfessionalReview | null>(
    null,
  );
  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'reviews'],
    queryFn: () => bookingsService.list(),
  });
  const reviewableBookings = useMemo(() => {
    const bookings = bookingsQuery.data ?? [];
    const merged =
      bookingFromState && !bookings.some((booking) => booking.id === bookingFromState.id)
        ? [bookingFromState, ...bookings]
        : bookings;

    return merged.filter(isReviewable);
  }, [bookingFromState, bookingsQuery.data]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      bookingId: bookingFromState?.id ?? '',
      rating: 0,
      comment: '',
    },
  });
  const selectedBookingId = watch('bookingId');
  const selectedRating = watch('rating');
  const selectedBooking = reviewableBookings.find(
    (booking) => booking.id === selectedBookingId,
  );
  const reviewsQuery = useQuery({
    queryKey: ['professionals', selectedBooking?.professionalId, 'reviews'],
    queryFn: () =>
      professionalsService.reviews(selectedBooking?.professionalId ?? ''),
    enabled: Boolean(selectedBooking?.professionalId),
  });
  const existingReview = (reviewsQuery.data ?? []).find(
    (review) => review.bookingId === selectedBooking?.id,
  );
  const visibleReview = createdReview ?? existingReview ?? null;
  const createReviewMutation = useMutation({
    mutationFn: (values: ReviewFormValues) =>
      reviewsService.create({
        bookingId: values.bookingId,
        rating: values.rating,
        comment: values.comment?.trim() || undefined,
      }),
    onSuccess: async (review) => {
      setCreatedReview(review);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['professionals', review.professionalId, 'reviews'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['professionals', 'search'],
        }),
      ]);
    },
  });

  const submitReview = (values: ReviewFormValues) => {
    if (visibleReview) {
      return;
    }

    createReviewMutation.mutate(values);
  };
  const reviewState = visibleReview
    ? 'Enviada'
    : selectedBooking
      ? 'Lista'
      : 'Pendiente';

  return (
    <div className="space-y-5 pb-24 md:space-y-6 md:pb-0">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Calificaciones"
          title="Califica servicios completados"
          description="Selecciona un servicio terminado, puntua al profesional y publica una resena visible en su perfil."
          actions={
            <Button
              className="w-full sm:w-auto"
              variant="ghost"
              onClick={() => {
                void navigate('/app/reservas');
              }}
            >
              Volver al historial
            </Button>
          }
        />
      </div>

      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300/50 md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">
              Calificaciones
            </p>
            <h1 className="mt-3 text-3xl font-black leading-none">
              Tu experiencia
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Elegi un servicio completado, puntua al profesional y comparti una
              resena.
            </p>
          </div>
          <Button
            className="shrink-0 border-white/10 bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
            variant="ghost"
            onClick={() => {
              void navigate('/app/reservas');
            }}
          >
            Historial
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-3">
            <p className="text-2xl font-black leading-none">
              {reviewableBookings.length}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Servicios
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-3">
            <p className="text-lg font-black leading-none">{reviewState}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Estado
            </p>
          </div>
        </div>
      </section>

      {bookingsQuery.error instanceof ApiError ||
      reviewsQuery.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50 shadow-amber-100/70">
          <p className="text-sm font-semibold text-amber-800">
            No pudimos cargar calificaciones
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {(bookingsQuery.error instanceof ApiError &&
              bookingsQuery.error.message) ||
              (reviewsQuery.error instanceof ApiError &&
                reviewsQuery.error.message)}
          </p>
        </Card>
      ) : null}

      {createReviewMutation.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50 shadow-amber-100/70">
          <p className="text-sm font-semibold text-amber-800">
            No pudimos publicar la resena
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {createReviewMutation.error.message}
          </p>
        </Card>
      ) : null}

      {visibleReview ? (
        <SuccessState
          title="Gracias por calificar el servicio"
          description="Tu opinion ayuda a otros clientes y mejora la calidad de la comunidad ArreglaYa."
          actionLabel="Volver a reservas"
          onAction={() => void navigate('/app/reservas')}
        />
      ) : null}

      {!reviewableBookings.length && !bookingsQuery.isLoading ? (
        <Card className="p-4 sm:p-6">
          <p className="text-sm font-semibold text-slate-800">
            Todavia no tenes servicios completados para calificar.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Cuando una reserva pase a completada vas a poder dejar una
            calificacion desde este historial.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Card className="p-4 sm:p-6">
          <div className="mb-5 md:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Nueva resena
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">
              Califica el servicio
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tu puntuacion ayuda a ordenar profesionales y orientar a otros
              clientes.
            </p>
          </div>
          <form
            className="grid gap-4"
            onSubmit={(event) => void handleSubmit(submitReview)(event)}
          >
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Servicio completado
              </span>
              <Select
                error={errors.bookingId?.message}
                {...register('bookingId', {
                  onChange: () => {
                    setCreatedReview(null);
                    setValue('rating', 0);
                  },
                })}
              >
                <option value="">Selecciona un servicio completado</option>
                {reviewableBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.serviceRequestTitle} - {booking.professionalName}
                  </option>
                ))}
              </Select>
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  Calificacion
                </span>
                {selectedRating ? (
                  <span className="text-sm font-bold text-brand-700">
                    {selectedRating}/5
                  </span>
                ) : null}
              </div>
              <input
                type="hidden"
                {...register('rating', { valueAsNumber: true })}
              />
              <div
                className="grid grid-cols-5 gap-2 sm:flex"
                role="radiogroup"
                aria-label="Calificacion del profesional"
              >
                {ratingOptions.map((rating) => (
                  <button
                    aria-checked={selectedRating === rating}
                    aria-label={`${rating} estrellas`}
                    className={[
                      'flex h-12 w-full items-center justify-center rounded-2xl border text-2xl font-black transition sm:w-12',
                      selectedRating >= rating
                        ? 'border-accent-400 bg-accent-100 text-accent-700'
                        : 'border-slate-200 bg-white text-slate-300 hover:border-accent-300 hover:text-accent-500',
                    ].join(' ')}
                    disabled={Boolean(visibleReview)}
                    key={rating}
                    onClick={() =>
                      setValue('rating', rating, { shouldValidate: true })
                    }
                    role="radio"
                    type="button"
                  >
                    ★
                  </button>
                ))}
              </div>
              {errors.rating ? (
                <p className="text-sm text-red-600">{errors.rating.message}</p>
              ) : null}
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Comentario opcional
              </span>
              <Textarea
                disabled={Boolean(visibleReview)}
                error={errors.comment?.message}
                placeholder="Contale a otros clientes como fue la experiencia."
                {...register('comment')}
              />
            </label>

            <Button
              className="w-full sm:w-auto"
              disabled={
                createReviewMutation.isPending ||
                Boolean(visibleReview) ||
                !reviewableBookings.length
              }
              type="submit"
            >
              {createReviewMutation.isPending
                ? 'Publicando...'
                : 'Enviar resena'}
            </Button>
          </form>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Resumen del servicio
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight text-slate-950 md:text-lg md:font-bold">
                Servicio seleccionado
              </h2>
            </div>
            {visibleReview ? (
              <Badge className="shrink-0 bg-emerald-50 text-emerald-700">
                Enviada
              </Badge>
            ) : selectedBooking ? (
              <Badge className="shrink-0">Lista</Badge>
            ) : null}
          </div>
          {selectedBooking ? (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  {selectedBooking.serviceRequestTitle}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedBooking.professionalName}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Fecha
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {formatDateTime(selectedBooking.scheduledAt)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Estado
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    Completado
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
                <p className="text-sm font-semibold text-brand-800">
                  {visibleReview ? 'Resena enviada' : 'Listo para calificar'}
                </p>
                <p className="mt-1 text-sm leading-6 text-brand-700">
                  {visibleReview
                    ? 'El comentario ya esta visible en el perfil del profesional.'
                    : 'Selecciona estrellas y publica tu experiencia cuando estes listo.'}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              Selecciona un servicio completado para dejar tu resena.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
