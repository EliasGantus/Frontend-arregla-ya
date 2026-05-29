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
import { Textarea } from '@/shared/ui/textarea';

const isReviewable = (booking: Booking) => booking.status === 'completed';

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
    const merged = bookingFromState
      ? [
          bookingFromState,
          ...bookings.filter((booking) => booking.id !== bookingFromState.id),
        ]
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

  return (
    <div className="space-y-6">
      <StatusPanel
        eyebrow="Calificaciones"
        title="Califica servicios completados"
        description="Selecciona un servicio terminado, puntua al profesional y publica una resena visible en su perfil."
        actions={
          <Button
            variant="ghost"
            onClick={() => {
              void navigate('/app/reservas');
            }}
          >
            Volver al historial
          </Button>
        }
      />

      {bookingsQuery.error instanceof ApiError ||
      reviewsQuery.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50">
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
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">
            No pudimos publicar la resena
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {createReviewMutation.error.message}
          </p>
        </Card>
      ) : null}

      {visibleReview ? (
        <Card className="border border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800">
            Resena publicada. Este servicio ya no puede volver a calificarse.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-emerald-950">
                {visibleReview.rating}/5 estrellas
              </p>
              {visibleReview.comment ? (
                <p className="mt-1 text-sm text-emerald-700">
                  {visibleReview.comment}
                </p>
              ) : null}
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                void navigate(
                  `/app/profesionales/${visibleReview.professionalId}`,
                );
              }}
            >
              Ver perfil del profesional
            </Button>
          </div>
        </Card>
      ) : null}

      {!reviewableBookings.length && !bookingsQuery.isLoading ? (
        <Card>
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
        <Card>
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
              <span className="text-sm font-semibold text-slate-700">
                Calificacion
              </span>
              <input
                type="hidden"
                {...register('rating', { valueAsNumber: true })}
              />
              <div
                className="flex gap-2"
                role="radiogroup"
                aria-label="Calificacion del profesional"
              >
                {ratingOptions.map((rating) => (
                  <button
                    aria-checked={selectedRating === rating}
                    aria-label={`${rating} estrellas`}
                    className={[
                      'h-12 w-12 rounded-2xl border text-2xl font-black transition',
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

        <Card>
          <p className="text-sm font-semibold uppercase text-slate-400">
            Resumen del servicio
          </p>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Fecha
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {formatDateTime(selectedBooking.scheduledAt)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Estado
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    Completado
                  </p>
                </div>
              </div>
              {visibleReview ? (
                <Badge>Resena enviada</Badge>
              ) : (
                <Badge>Listo para calificar</Badge>
              )}
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
