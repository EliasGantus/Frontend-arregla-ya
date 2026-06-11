import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { bookingsService } from '@/features/bookings/services/bookings-service';
import { paymentsService } from '@/features/payments/services/payments-service';
import { ApiError } from '@/shared/api/api-error';
import type { Booking, Payment } from '@/shared/types/api';
import {
  paymentSchema,
  type PaymentFormValues,
} from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';
import { SuccessState } from '@/shared/ui/success-state';

const formatMoney = (amountCents: number, currency = 'ARS') =>
  new Intl.NumberFormat('es-AR', {
    currency,
    style: 'currency',
  }).format(amountCents / 100);

const toAmountCents = (amount: string) => {
  const normalized = amount.replace(/\./g, '').replace(',', '.');

  return Math.round(Number(normalized) * 100);
};

const isPayable = (booking: Booking) =>
  booking.status === 'confirmed' || booking.status === 'completed';

const methodCopy: Record<PaymentFormValues['method'], string> = {
  mercado_pago_wallet: 'MercadoPago wallet',
  mercado_pago_card: 'Tarjeta via MercadoPago',
};

const paymentStatusTone: Record<Payment['status'], string> = {
  pending: 'bg-accent-50 text-accent-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600',
  refunded: 'bg-brand-50 text-brand-700',
};

export const PaymentsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingFromState = (location.state as { booking?: Booking } | null)
    ?.booking;
  const [payment, setPayment] = useState<Payment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'payments'],
    queryFn: () => bookingsService.list(),
  });
  const paymentsQuery = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsService.list(),
  });
  const payableBookings = useMemo(() => {
    const bookings = bookingsQuery.data ?? [];
    const merged = bookingFromState
      ? [
          bookingFromState,
          ...bookings.filter((booking) => booking.id !== bookingFromState.id),
        ]
      : bookings;

    return merged.filter(isPayable);
  }, [bookingFromState, bookingsQuery.data]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      bookingId: bookingFromState?.id ?? '',
      amount: '',
      method: 'mercado_pago_wallet',
    },
  });
  const selectedBookingId = watch('bookingId');
  const selectedAmount = watch('amount');
  const selectedMethod = watch('method');
  const selectedBooking = payableBookings.find(
    (booking) => booking.id === selectedBookingId,
  );
  const createPaymentMutation = useMutation({
    mutationFn: ({
      bookingId,
      values,
    }: {
      bookingId: string;
      values: PaymentFormValues;
    }) =>
      paymentsService.createForBooking(bookingId, {
        amountCents: toAmountCents(values.amount),
        currency: 'ARS',
        description: `Servicio ArreglaYa: ${selectedBooking?.serviceRequestTitle ?? bookingId} - ${methodCopy[values.method]}`,
      }),
    onError: (error) => {
      setPayment(null);
      setErrorMessage(
        error instanceof ApiError
          ? `${error.message} Intenta con otro metodo de pago.`
          : 'No pudimos procesar el cobro. Intenta con otro metodo de pago.',
      );
    },
    onSuccess: (createdPayment) => {
      setErrorMessage(null);
      setPayment(createdPayment);
    },
  });

  const submitPayment = (values: PaymentFormValues) => {
    createPaymentMutation.mutate({ bookingId: values.bookingId, values });
  };
  const payments = paymentsQuery.data ?? [];
  const approvedTotal = payments
    .filter((item) => item.status === 'approved')
    .reduce((total, item) => total + item.amountCents, 0);
  const paymentStats = [
    { label: 'Servicios', value: payableBookings.length },
    { label: 'Pagos', value: payments.length },
    { label: 'Aprobado', value: formatMoney(approvedTotal) },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Pagos"
          title="Pago seguro con MercadoPago"
          description="Revisa el servicio completado, selecciona un metodo de pago y genera un comprobante de la transaccion."
        />
      </div>

      <Card className="rounded-[28px] !bg-ink p-5 text-white shadow-lg shadow-slate-300/70 md:hidden">
        <div className="space-y-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
              Pagos
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight">
              Pago seguro con MercadoPago
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Selecciona el servicio, el monto y genera tu comprobante.
            </p>
          </div>
          <div className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-ink">
            {payableBookings.length} servicios
          </div>
        </div>
      </Card>

      {errorMessage ? (
        <Card className="rounded-[28px] border border-red-200 bg-red-50 md:rounded-3xl">
          <p className="text-sm font-semibold text-red-800">Pago rechazado</p>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </Card>
      ) : null}

      {bookingsQuery.error instanceof ApiError ||
      paymentsQuery.error instanceof ApiError ? (
        <Card className="rounded-[28px] border border-amber-200 bg-amber-50 md:rounded-3xl">
          <p className="text-sm font-semibold text-amber-800">
            No pudimos cargar pagos
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {(bookingsQuery.error instanceof ApiError &&
              bookingsQuery.error.message) ||
              (paymentsQuery.error instanceof ApiError &&
                paymentsQuery.error.message)}
          </p>
        </Card>
      ) : null}

      {payment ? (
        <div className="space-y-3">
          <SuccessState
            title={
              payment.status === 'approved'
                ? 'Pago procesado exitosamente.'
                : 'Pago iniciado en MercadoPago.'
            }
            description={
              payment.status === 'approved'
                ? `Comprobante ${payment.receiptNumber ?? payment.id}. Recibiras el detalle por email.`
                : 'Pago iniciado en MercadoPago. Completa el checkout para recibir el comprobante.'
            }
            actionLabel="Volver a reservas"
            onAction={() => void navigate('/app/reservas')}
          />
          {payment.checkoutUrl ? (
            <a
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-accent-500 px-4 py-3 text-center text-sm font-semibold leading-tight text-white shadow-lg shadow-accent-500/30 hover:bg-accent-400 sm:w-auto"
              href={payment.checkoutUrl}
              rel="noreferrer"
              target="_blank"
            >
              Abrir MercadoPago
            </a>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
              Resumen
            </p>
            <h2 className="text-xl font-black text-slate-950 md:text-xl">
              Estado de pagos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Revisa servicios pagables, comprobantes y total aprobado.
            </p>
          </div>
          <Badge>{payments.length} registros</Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {paymentStats.map((stat) => (
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
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
              Nuevo pago
            </p>
            <h2 className="text-xl font-black text-slate-950">
              Completa el pago
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Selecciona un servicio confirmado o completado y define el monto.
            </p>
          </div>
          <form
            className="grid gap-4"
            onSubmit={(event) => void handleSubmit(submitPayment)(event)}
          >
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Servicio a pagar
              </span>
              <Select
                error={errors.bookingId?.message}
                {...register('bookingId')}
              >
                <option value="">Selecciona un servicio completado</option>
                {payableBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.serviceRequestTitle} - {booking.professionalName}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Monto
              </span>
              <Input
                placeholder="85000"
                error={errors.amount?.message}
                {...register('amount')}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Metodo de pago
              </span>
              <Select error={errors.method?.message} {...register('method')}>
                <option value="mercado_pago_wallet">MercadoPago wallet</option>
                <option value="mercado_pago_card">
                  Tarjeta via MercadoPago
                </option>
              </Select>
            </label>

            <Button
              className="w-full sm:w-auto"
              disabled={
                createPaymentMutation.isPending || !payableBookings.length
              }
              type="submit"
            >
              {createPaymentMutation.isPending
                ? 'Procesando...'
                : 'Confirmar pago'}
            </Button>
          </form>
        </Card>

        <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Resumen del servicio
          </p>
          {selectedBooking ? (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-xl font-black text-slate-950">
                  {selectedBooking.serviceRequestTitle}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedBooking.professionalName}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Monto
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {selectedAmount
                      ? formatMoney(toAmountCents(selectedAmount))
                      : '-'}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Metodo
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {methodCopy[selectedMethod]}
                  </p>
                </div>
              </div>
              <Badge>MercadoPago</Badge>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              Selecciona un servicio para ver el detalle del pago.
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:hidden">
              Actividad
            </p>
            <h3 className="text-lg font-black text-slate-950">
              Pagos recientes
            </h3>
          </div>
          <Badge>{payments.length} total</Badge>
        </div>
        {!payments.length && !paymentsQuery.isLoading ? (
          <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl">
            <p className="text-sm text-slate-600">
              Todavia no hay pagos registrados.
            </p>
          </Card>
        ) : null}
        {payments.map((item) => (
          <Card
            key={item.id}
            className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {item.receiptNumber ?? item.id}
                </p>
                <h4 className="mt-1 text-lg font-black leading-tight text-slate-950">
                  {item.serviceRequestTitle}
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  {item.professionalName}
                </p>
              </div>
              <span
                className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusTone[item.status]}`}
              >
                {item.status}
              </span>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Monto
              </p>
              <p className="mt-1 text-xl font-black text-slate-950">
                {formatMoney(item.amountCents, item.currency)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
