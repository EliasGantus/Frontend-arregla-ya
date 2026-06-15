import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { bookingsService } from '@/features/bookings/services/bookings-service';
import { ApiError } from '@/shared/api/api-error';
import type { AuthUser, Booking, BookingStatus } from '@/shared/types/api';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import {
  MobileHero,
  MobilePage,
  MobileSection,
  MobileStats,
} from '@/shared/ui/mobile-page';
import { StatusChip } from '@/shared/ui/status-chip';
import { StatusPanel } from '@/shared/ui/status-panel';

const statusCopy: Record<BookingStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha pendiente';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const statusCount = (bookings: Booking[], status: BookingStatus) =>
  bookings.filter((booking) => booking.status === status).length;

const canCancel = (booking: Booking, role: AuthUser['role'] | undefined) =>
  booking.status === 'pending' && (role === 'cliente' || role === 'admin');

const canConfirm = (booking: Booking, role: AuthUser['role'] | undefined) =>
  booking.status === 'pending' && (role === 'profesional' || role === 'admin');

const canComplete = (booking: Booking, role: AuthUser['role'] | undefined) =>
  booking.availableActions?.includes('complete_work') &&
  (role === 'profesional' || role === 'admin');

const canPay = (booking: Booking, role: AuthUser['role'] | undefined) =>
  booking.availableActions?.includes('pay') &&
  (role === 'cliente' || role === 'admin');

const canReview = (booking: Booking, role: AuthUser['role'] | undefined) =>
  booking.availableActions?.includes('review') &&
  (role === 'cliente' || role === 'admin');

type BookingNextStepGuidance = Pick<
  Booking['nextStep'],
  'label' | 'description'
>;

const actionGuidance = (
  booking: Booking,
  action: Booking['nextStep']['action'],
  fallback: BookingNextStepGuidance,
) =>
  booking.nextStep?.action === action
    ? {
        label: booking.nextStep.label,
        description: booking.nextStep.description,
      }
    : fallback;

const resolveBookingNextStepGuidance = (
  booking: Booking,
  role: AuthUser['role'] | undefined,
): BookingNextStepGuidance => {
  if (canPay(booking, role)) {
    return actionGuidance(booking, 'pay', {
      label: 'Pagar servicio',
      description: 'Completa el pago del servicio.',
    });
  }

  if (canReview(booking, role)) {
    return actionGuidance(booking, 'review', {
      label: 'Calificar servicio',
      description: 'Deja tu resena para cerrar el flujo.',
    });
  }

  if (canConfirm(booking, role)) {
    return actionGuidance(booking, 'confirm_booking', {
      label: 'Confirmar reserva',
      description: 'Confirma el turno para que el cliente pueda avanzar.',
    });
  }

  if (canComplete(booking, role)) {
    return actionGuidance(booking, 'complete_work', {
      label: 'Marcar trabajo como terminado',
      description: 'Confirma que el trabajo quedo terminado.',
    });
  }

  if (canCancel(booking, role)) {
    return {
      label: 'Reserva pendiente',
      description: 'Podes cancelar la reserva mientras espera confirmacion.',
    };
  }

  if (
    booking.nextStep?.action === 'pay' ||
    booking.nextStep?.action === 'review'
  ) {
    return {
      label: 'Esperando al cliente',
      description:
        booking.nextStep.action === 'pay'
          ? 'El cliente debe completar el pago del servicio.'
          : 'El cliente debe calificar el servicio.',
    };
  }

  if (
    booking.nextStep?.action === 'confirm_booking' ||
    booking.nextStep?.action === 'complete_work'
  ) {
    return {
      label: 'Esperando al profesional',
      description:
        booking.nextStep.action === 'confirm_booking'
          ? 'El profesional debe confirmar el turno.'
          : 'El profesional debe marcar el trabajo como terminado.',
    };
  }

  return {
    label: booking.nextStep?.label ?? statusCopy[booking.status],
    description:
      booking.nextStep?.description ??
      booking.statusDescription ??
      'Revisa las acciones disponibles.',
  };
};

export const BookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsService.list(),
  });
  const updateMutation = useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: BookingStatus;
    }) => bookingsService.update(bookingId, { status }),
    onSuccess: async (booking) => {
      setNotice(
        booking.status === 'confirmed'
          ? 'Reserva confirmada. El cliente recibira una notificacion de turno confirmado.'
          : booking.status === 'completed'
            ? 'Trabajo marcado como terminado. El cliente ya puede calificar el servicio.'
            : 'Reserva cancelada. El profesional recibira una notificacion y el turno queda libre.',
      );
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
  const bookings = bookingsQuery.data ?? [];
  const visibleBookings = bookings.filter(
    (booking) => booking.status !== 'cancelled',
  );
  const bookingStats = [
    { label: 'Pendientes', value: statusCount(bookings, 'pending') },
    { label: 'Confirmadas', value: statusCount(bookings, 'confirmed') },
    { label: 'Finalizadas', value: statusCount(bookings, 'completed') },
  ];
  const isProfessionalView = user?.role === 'profesional';
  const mobileCopy = isProfessionalView
    ? {
        eyebrow: 'Reservas',
        title: 'Turnos por confirmar',
        description:
          'Gestiona pedidos agendados y confirma los trabajos pendientes.',
        badge: `${visibleBookings.length} activas`,
        listTitle: 'Agenda profesional',
        listDescription:
          'Revisa clientes, horarios y acciones disponibles para cada reserva.',
      }
    : {
        eyebrow: 'Reservas',
        title: 'Tus servicios agendados',
        description:
          'Consulta turnos, cancela pendientes y avanza con pagos o calificaciones.',
        badge: `${visibleBookings.length} activas`,
        listTitle: 'Mis reservas',
        listDescription:
          'Sigue el estado de cada servicio y las proximas acciones.',
      };

  return (
    <MobilePage>
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Reservas"
          title="Historial de servicios y turnos"
          description="Consulta reservas pendientes y confirmadas. Desde aca se puede cancelar un turno pendiente o confirmarlo si sos profesional."
        />
      </div>

      <MobileHero
        eyebrow={mobileCopy.eyebrow}
        title={mobileCopy.title}
        description={mobileCopy.description}
        badge={`${bookings.length} total`}
      />

      {notice ? (
        <Card className="rounded-[28px] border border-emerald-200 bg-emerald-50 md:rounded-3xl">
          <p className="text-sm font-semibold text-emerald-800">{notice}</p>
        </Card>
      ) : null}

      {bookingsQuery.error instanceof ApiError ||
      updateMutation.error instanceof ApiError ? (
        <Card className="rounded-[28px] border border-amber-200 bg-amber-50 md:rounded-3xl">
          <p className="text-sm font-semibold text-amber-800">
            No pudimos sincronizar reservas
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {(bookingsQuery.error instanceof ApiError &&
              bookingsQuery.error.message) ||
              (updateMutation.error instanceof ApiError &&
                updateMutation.error.message)}
          </p>
        </Card>
      ) : null}

      <MobileSection
        eyebrow="Seguimiento"
        title={mobileCopy.listTitle}
        description={mobileCopy.listDescription}
        badge={mobileCopy.badge}
      >
        <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
          <MobileStats stats={bookingStats} className="grid-cols-3 gap-2" />
        </Card>
      </MobileSection>

      {!bookings.length && !bookingsQuery.isLoading ? (
        <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-xl font-black text-accent-600">
            0
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-950">
            Todavia no hay reservas
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            Cuando tengas un servicio agendado, lo vas a ver aca con su estado,
            horario y acciones disponibles.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {bookings.map((booking) => {
          const nextStepGuidance = resolveBookingNextStepGuidance(
            booking,
            user?.role,
          );

          return (
            <Card
              key={booking.id}
              className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {formatDateTime(booking.scheduledAt)}
                  </p>
                  <h3 className="mt-1 text-lg font-black leading-tight text-slate-950">
                    {booking.serviceRequestTitle}
                  </h3>
                </div>
                <StatusChip
                  label={booking.statusLabel ?? statusCopy[booking.status]}
                  status={booking.status}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {isProfessionalView ? 'Cliente' : 'Profesional'}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {isProfessionalView
                      ? booking.clientName
                      : booking.professionalName}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Turno
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {formatDateTime(booking.scheduledAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-700">
                  Proximo paso
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {nextStepGuidance.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {nextStepGuidance.description}
                </p>
              </div>

              <div className="mt-4">
                {booking.notes ? (
                  <p className="rounded-2xl bg-white text-sm leading-6 text-slate-600">
                    {booking.notes}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {canPay(booking, user?.role) ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => {
                      void navigate('/app/pagos', { state: { booking } });
                    }}
                    variant="secondary"
                  >
                    Pagar servicio
                  </Button>
                ) : null}
                {canReview(booking, user?.role) ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => {
                      void navigate('/app/calificaciones', {
                        state: { booking },
                      });
                    }}
                  >
                    Calificar servicio
                  </Button>
                ) : null}
                {canCancel(booking, user?.role) ? (
                  <Button
                    className="w-full sm:w-auto"
                    disabled={updateMutation.isPending}
                    onClick={() =>
                      updateMutation.mutate({
                        bookingId: booking.id,
                        status: 'cancelled',
                      })
                    }
                    variant="ghost"
                  >
                    Cancelar reserva
                  </Button>
                ) : null}
                {canConfirm(booking, user?.role) ? (
                  <Button
                    className="w-full sm:w-auto"
                    disabled={updateMutation.isPending}
                    onClick={() =>
                      updateMutation.mutate({
                        bookingId: booking.id,
                        status: 'confirmed',
                      })
                    }
                    variant="secondary"
                  >
                    Confirmar reserva
                  </Button>
                ) : null}
                {canComplete(booking, user?.role) ? (
                  <Button
                    className="w-full sm:w-auto"
                    disabled={updateMutation.isPending}
                    onClick={() =>
                      updateMutation.mutate({
                        bookingId: booking.id,
                        status: 'completed',
                      })
                    }
                    variant="secondary"
                  >
                    Marcar trabajo como terminado
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </MobilePage>
  );
};
