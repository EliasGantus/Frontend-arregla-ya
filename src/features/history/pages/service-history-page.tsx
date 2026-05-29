import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { bookingsService } from '@/features/bookings/services/bookings-service';
import { paymentsService } from '@/features/payments/services/payments-service';
import { ApiError } from '@/shared/api/api-error';
import type { Booking, BookingStatus, Payment } from '@/shared/types/api';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';

type HistoryStatusFilter = 'all' | BookingStatus;

const statusCopy: Record<BookingStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const statusFilters: Array<{ label: string; value: HistoryStatusFilter }> = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Confirmados', value: 'confirmed' },
  { label: 'Completados', value: 'completed' },
  { label: 'Cancelados', value: 'cancelled' },
];

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const formatMoney = (amountCents: number, currency = 'ARS') =>
  new Intl.NumberFormat('es-AR', {
    currency,
    style: 'currency',
  }).format(amountCents / 100);

const sortByRecentDate = (bookings: Booking[]) =>
  [...bookings].sort(
    (first, second) =>
      new Date(second.scheduledAt).getTime() -
      new Date(first.scheduledAt).getTime(),
  );

const getApprovedPayment = (payments: Payment[], bookingId: string) =>
  payments.find(
    (payment) =>
      payment.bookingId === bookingId && payment.status === 'approved',
  );

export const ServiceHistoryPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'history'],
    queryFn: () => bookingsService.list(),
  });
  const paymentsQuery = useQuery({
    queryKey: ['payments', 'history'],
    queryFn: () => paymentsService.list(),
  });
  const sortedBookings = useMemo(
    () => sortByRecentDate(bookingsQuery.data ?? []),
    [bookingsQuery.data],
  );
  const filteredBookings = useMemo(
    () =>
      statusFilter === 'all'
        ? sortedBookings
        : sortedBookings.filter((booking) => booking.status === statusFilter),
    [sortedBookings, statusFilter],
  );
  const selectedBooking =
    sortedBookings.find((booking) => booking.id === selectedBookingId) ??
    filteredBookings[0] ??
    null;
  const selectedPayment = selectedBooking
    ? getApprovedPayment(paymentsQuery.data ?? [], selectedBooking.id)
    : undefined;

  return (
    <div className="space-y-6">
      <StatusPanel
        eyebrow="Historial"
        title="Servicios contratados"
        description="Revisa tus servicios por fecha, filtra por estado y abre el detalle para ver profesional, pago y acciones disponibles."
      />

      {bookingsQuery.error instanceof ApiError ||
      paymentsQuery.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">
            No pudimos cargar el historial
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {(bookingsQuery.error instanceof ApiError &&
              bookingsQuery.error.message) ||
              (paymentsQuery.error instanceof ApiError &&
                paymentsQuery.error.message)}
          </p>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <label className="w-full space-y-2 md:max-w-xs">
            <span className="text-sm font-semibold text-slate-700">
              Filtrar por estado
            </span>
            <Select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as HistoryStatusFilter);
                setSelectedBookingId(null);
              }}
            >
              {statusFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </Select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statusFilters
              .filter((filter) => filter.value !== 'all')
              .map((filter) => (
                <div
                  className="rounded-2xl bg-slate-50 px-4 py-3"
                  key={filter.value}
                >
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    {filter.label}
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {
                      sortedBookings.filter(
                        (booking) => booking.status === filter.value,
                      ).length
                    }
                  </p>
                </div>
              ))}
          </div>
        </div>
      </Card>

      {!filteredBookings.length && !bookingsQuery.isLoading ? (
        <Card>
          <p className="text-sm font-semibold text-slate-800">
            No hay servicios para el estado seleccionado.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Cambia el filtro para consultar el resto de tu historial.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="grid gap-3">
          {filteredBookings.map((booking) => {
            const payment = getApprovedPayment(
              paymentsQuery.data ?? [],
              booking.id,
            );
            const isSelected = booking.id === selectedBooking?.id;

            return (
              <button
                className={[
                  'rounded-[28px] border p-5 text-left shadow-xl shadow-slate-200/50 transition',
                  isSelected
                    ? 'border-brand-300 bg-brand-50'
                    : 'border-white/70 bg-white/85 hover:border-brand-200 hover:bg-white',
                ].join(' ')}
                key={booking.id}
                onClick={() => setSelectedBookingId(booking.id)}
                type="button"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      {booking.serviceRequestTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.professionalName} -{' '}
                      {formatDateTime(booking.scheduledAt)}
                    </p>
                  </div>
                  <Badge>{statusCopy[booking.status]}</Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Profesional
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {booking.professionalName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Fecha
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatDateTime(booking.scheduledAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Pago
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {payment
                        ? formatMoney(payment.amountCents, payment.currency)
                        : 'Sin pago registrado'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Card className="xl:sticky xl:top-6 xl:self-start">
          <p className="text-sm font-semibold uppercase text-slate-400">
            Detalle del servicio
          </p>
          {selectedBooking ? (
            <div className="mt-4 space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-black text-slate-950">
                    {selectedBooking.serviceRequestTitle}
                  </h3>
                  <Badge>{statusCopy[selectedBooking.status]}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedBooking.notes ?? 'Sin notas adicionales.'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Profesional
                  </p>
                  <p className="mt-1 font-bold text-slate-950">
                    {selectedBooking.professionalName}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Cliente
                  </p>
                  <p className="mt-1 font-bold text-slate-950">
                    {selectedBooking.clientName}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Fecha del servicio
                  </p>
                  <p className="mt-1 font-bold text-slate-950">
                    {formatDateTime(selectedBooking.scheduledAt)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Monto pagado
                  </p>
                  <p className="mt-1 font-bold text-slate-950">
                    {selectedPayment
                      ? formatMoney(
                          selectedPayment.amountCents,
                          selectedPayment.currency,
                        )
                      : 'Sin pago registrado'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {selectedBooking.status === 'completed' ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => {
                      void navigate('/app/calificaciones', {
                        state: { booking: selectedBooking },
                      });
                    }}
                  >
                    Calificar servicio
                  </Button>
                ) : null}
                {(selectedBooking.status === 'confirmed' ||
                  selectedBooking.status === 'completed') &&
                !selectedPayment ? (
                  <Button
                    className="w-full sm:w-auto"
                    variant="secondary"
                    onClick={() => {
                      void navigate('/app/pagos', {
                        state: { booking: selectedBooking },
                      });
                    }}
                  >
                    Pagar servicio
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              Selecciona un servicio para consultar la informacion completa.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
