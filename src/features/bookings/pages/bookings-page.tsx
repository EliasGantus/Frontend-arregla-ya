import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { bookingsService } from '@/features/bookings/services/bookings-service';
import { ApiError } from '@/shared/api/api-error';
import type { Booking, BookingStatus } from '@/shared/types/api';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { StatusPanel } from '@/shared/ui/status-panel';

const statusCopy: Record<BookingStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const statusTone: Record<BookingStatus, string> = {
  pending: 'bg-accent-50 text-accent-700',
  confirmed: 'bg-brand-50 text-brand-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
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

  const canCancel = (booking: Booking) =>
    booking.status === 'pending' &&
    (user?.role === 'cliente' || user?.role === 'admin');
  const canConfirm = (booking: Booking) =>
    booking.status === 'pending' &&
    (user?.role === 'profesional' || user?.role === 'admin');
  const canPay = (booking: Booking) =>
    (booking.status === 'confirmed' || booking.status === 'completed') &&
    (user?.role === 'cliente' || user?.role === 'admin');
  const canReview = (booking: Booking) =>
    booking.status === 'completed' &&
    (user?.role === 'cliente' || user?.role === 'admin');

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Reservas"
          title="Historial de servicios y turnos"
          description="Consulta reservas pendientes y confirmadas. Desde aca se puede cancelar un turno pendiente o confirmarlo si sos profesional."
        />
      </div>

      <Card className="rounded-[28px] !bg-ink p-5 text-white shadow-lg shadow-slate-300/70 md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
              {mobileCopy.eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight">
              {mobileCopy.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {mobileCopy.description}
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-ink">
            {bookings.length} total
          </div>
        </div>
      </Card>

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

      <section className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
              Seguimiento
            </p>
            <h2 className="text-xl font-black text-slate-950 md:text-xl">
              {mobileCopy.listTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mobileCopy.listDescription}
            </p>
          </div>
          <Badge>{mobileCopy.badge}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {bookingStats.map((stat) => (
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
        {bookings.map((booking) => (
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
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusTone[booking.status]}`}
              >
                {statusCopy[booking.status]}
              </span>
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

            <div className="mt-4">
              {booking.notes ? (
                <p className="rounded-2xl bg-white text-sm leading-6 text-slate-600">
                  {booking.notes}
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {canConfirm(booking) ? (
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
              {canCancel(booking) ? (
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
              {canPay(booking) ? (
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
              {canReview(booking) ? (
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
