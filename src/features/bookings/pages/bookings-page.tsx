import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

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

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const BookingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsService.list(),
  });
  const updateMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: BookingStatus }) =>
      bookingsService.update(bookingId, { status }),
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

  const canCancel = (booking: Booking) =>
    booking.status === 'pending' && (user?.role === 'cliente' || user?.role === 'admin');
  const canConfirm = (booking: Booking) =>
    booking.status === 'pending' && (user?.role === 'profesional' || user?.role === 'admin');

  return (
    <div className="space-y-6">
      <StatusPanel
        eyebrow="Reservas"
        title="Historial de servicios y turnos"
        description="Consulta reservas pendientes y confirmadas. Desde aca se puede cancelar un turno pendiente o confirmarlo si sos profesional."
      />

      {notice ? (
        <Card className="border border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800">{notice}</p>
        </Card>
      ) : null}

      {bookingsQuery.error instanceof ApiError || updateMutation.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">No pudimos sincronizar reservas</p>
          <p className="mt-2 text-sm text-amber-700">
            {(bookingsQuery.error instanceof ApiError && bookingsQuery.error.message) ||
              (updateMutation.error instanceof ApiError && updateMutation.error.message)}
          </p>
        </Card>
      ) : null}

      {!bookings.length && !bookingsQuery.isLoading ? (
        <Card>
          <p className="text-sm text-slate-600">Todavia no hay reservas en tu historial.</p>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-slate-950">{booking.serviceRequestTitle}</h3>
                <Badge>{statusCopy[booking.status]}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {booking.professionalName} - {formatDateTime(booking.scheduledAt)}
              </p>
              {booking.notes ? <p className="mt-2 text-sm text-slate-500">{booking.notes}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {canConfirm(booking) ? (
                <Button
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ bookingId: booking.id, status: 'confirmed' })}
                  variant="secondary"
                >
                  Confirmar reserva
                </Button>
              ) : null}
              {canCancel(booking) ? (
                <Button
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ bookingId: booking.id, status: 'cancelled' })}
                  variant="ghost"
                >
                  Cancelar reserva
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
