import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { bookingsService } from '@/features/bookings/services/bookings-service';
import { paymentsService } from '@/features/payments/services/payments-service';
import { ApiError } from '@/shared/api/api-error';
import type { Booking, BookingStatus, Payment } from '@/shared/types/api';
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

const statusTone: Record<BookingStatus, string> = {
  pending: 'bg-accent-50 text-accent-700',
  confirmed: 'bg-brand-50 text-brand-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
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

const statusCount = (bookings: Booking[], status: BookingStatus) =>
  bookings.filter((booking) => booking.status === status).length;

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
  const approvedPayments = paymentsQuery.data ?? [];
  const paidTotal = approvedPayments
    .filter((payment) => payment.status === 'approved')
    .reduce((total, payment) => total + payment.amountCents, 0);
  const historyStats = [
    { label: 'Completados', value: statusCount(sortedBookings, 'completed') },
    { label: 'Confirmados', value: statusCount(sortedBookings, 'confirmed') },
    { label: 'Pagado', value: formatMoney(paidTotal) },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Historial"
          title="Servicios contratados"
          description="Revisa tus servicios por fecha, filtra por estado y abre el detalle para ver profesional, pago y acciones disponibles."
        />
      </div>

      <Card className="rounded-[28px] !bg-ink p-5 text-white shadow-lg shadow-slate-300/70 md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
              Historial
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight">
              Servicios contratados
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Revisa turnos, pagos y acciones pendientes desde un solo lugar.
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-ink">
            {sortedBookings.length} total
          </div>
        </div>
      </Card>

      {bookingsQuery.error instanceof ApiError ||
      paymentsQuery.error instanceof ApiError ? (
        <Card className="rounded-[28px] border border-amber-200 bg-amber-50 md:rounded-3xl">
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

      <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
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
          <div className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-4">
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
        <div className="mt-4 grid grid-cols-3 gap-2 md:hidden">
          {historyStats.map((stat) => (
            <div
              className="rounded-2xl bg-slate-50 px-2 py-3 text-center"
              key={stat.label}
            >
              <p className="break-words text-base font-black text-slate-950">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {!filteredBookings.length && !bookingsQuery.isLoading ? (
        <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-xl font-black text-accent-600">
            0
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-950">
            No hay servicios para el estado seleccionado.
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
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
                  'rounded-[28px] border p-4 text-left shadow-lg shadow-slate-200/60 transition md:p-5',
                  isSelected
                    ? 'border-brand-300 bg-brand-50'
                    : 'border-white/70 bg-white/85 hover:border-brand-200 hover:bg-white',
                ].join(' ')}
                key={booking.id}
                onClick={() => setSelectedBookingId(booking.id)}
                type="button"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {formatDateTime(booking.scheduledAt)}
                    </p>
                    <h3 className="mt-1 text-lg font-black leading-tight text-slate-950">
                      {booking.serviceRequestTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.professionalName} -{' '}
                      {formatDateTime(booking.scheduledAt)}
                    </p>
                  </div>
                  <span
                    className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusTone[booking.status]}`}
                  >
                    {statusCopy[booking.status]}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/70 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Profesional
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {booking.professionalName}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/70 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Fecha
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatDateTime(booking.scheduledAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/70 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
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

        <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6 xl:sticky xl:top-6 xl:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Detalle del servicio
          </p>
          {selectedBooking ? (
            <div className="mt-4 space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-black text-slate-950">
                    {selectedBooking.serviceRequestTitle}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[selectedBooking.status]}`}
                  >
                    {statusCopy[selectedBooking.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedBooking.notes ?? 'Sin notas adicionales.'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Profesional
                  </p>
                  <p className="mt-1 font-bold text-slate-950">
                    {selectedBooking.professionalName}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Cliente
                  </p>
                  <p className="mt-1 font-bold text-slate-950">
                    {selectedBooking.clientName}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Fecha del servicio
                  </p>
                  <p className="mt-1 font-bold text-slate-950">
                    {formatDateTime(selectedBooking.scheduledAt)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
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
