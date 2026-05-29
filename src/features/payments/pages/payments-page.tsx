import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';

import { bookingsService } from '@/features/bookings/services/bookings-service';
import { paymentsService } from '@/features/payments/services/payments-service';
import { ApiError } from '@/shared/api/api-error';
import type { Booking, Payment } from '@/shared/types/api';
import { paymentSchema, type PaymentFormValues } from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';

const formatMoney = (amountCents: number, currency = 'ARS') =>
  new Intl.NumberFormat('es-AR', {
    currency,
    style: 'currency',
  }).format(amountCents / 100);

const toAmountCents = (amount: string) => {
  const normalized = amount.replace(/\./g, '').replace(',', '.');

  return Math.round(Number(normalized) * 100);
};

const isPayable = (booking: Booking) => booking.status === 'confirmed' || booking.status === 'completed';

const methodCopy: Record<PaymentFormValues['method'], string> = {
  mercado_pago_wallet: 'MercadoPago wallet',
  mercado_pago_card: 'Tarjeta via MercadoPago',
};

export const PaymentsPage = () => {
  const location = useLocation();
  const bookingFromState = (location.state as { booking?: Booking } | null)?.booking;
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
    const merged = bookingFromState ? [bookingFromState, ...bookings.filter((booking) => booking.id !== bookingFromState.id)] : bookings;

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
  const selectedBooking = payableBookings.find((booking) => booking.id === selectedBookingId);
  const createPaymentMutation = useMutation({
    mutationFn: ({ bookingId, values }: { bookingId: string; values: PaymentFormValues }) =>
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

  return (
    <div className="space-y-6">
      <StatusPanel
        eyebrow="Pagos"
        title="Pago seguro con MercadoPago"
        description="Revisa el servicio completado, selecciona un metodo de pago y genera un comprobante de la transaccion."
      />

      {errorMessage ? (
        <Card className="border border-red-200 bg-red-50">
          <p className="text-sm font-semibold text-red-800">Pago rechazado</p>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </Card>
      ) : null}

      {bookingsQuery.error instanceof ApiError || paymentsQuery.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">No pudimos cargar pagos</p>
          <p className="mt-2 text-sm text-amber-700">
            {(bookingsQuery.error instanceof ApiError && bookingsQuery.error.message) ||
              (paymentsQuery.error instanceof ApiError && paymentsQuery.error.message)}
          </p>
        </Card>
      ) : null}

      {payment ? (
        <Card className="border border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800">
            {payment.status === 'approved'
              ? 'Pago procesado exitosamente. Recibiras el comprobante por email.'
              : 'Pago iniciado en MercadoPago. Completa el checkout para recibir el comprobante.'}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-700">Comprobante</p>
              <p className="mt-1 font-bold text-emerald-950">{payment.receiptNumber ?? payment.id}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-700">Monto</p>
              <p className="mt-1 font-bold text-emerald-950">{formatMoney(payment.amountCents, payment.currency)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-700">Profesional</p>
              <p className="mt-1 font-bold text-emerald-950">{payment.professionalName}</p>
            </div>
          </div>
          {payment.checkoutUrl ? (
            <a
              className="mt-4 inline-flex rounded-2xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/30 hover:bg-accent-400"
              href={payment.checkoutUrl}
              rel="noreferrer"
              target="_blank"
            >
              Abrir MercadoPago
            </a>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <form className="grid gap-4" onSubmit={(event) => void handleSubmit(submitPayment)(event)}>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Servicio a pagar</span>
              <Select error={errors.bookingId?.message} {...register('bookingId')}>
                <option value="">Selecciona un servicio completado</option>
                {payableBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.serviceRequestTitle} - {booking.professionalName}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Monto</span>
              <Input placeholder="85000" error={errors.amount?.message} {...register('amount')} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Metodo de pago</span>
              <Select error={errors.method?.message} {...register('method')}>
                <option value="mercado_pago_wallet">MercadoPago wallet</option>
                <option value="mercado_pago_card">Tarjeta via MercadoPago</option>
              </Select>
            </label>

            <Button disabled={createPaymentMutation.isPending || !payableBookings.length} type="submit">
              {createPaymentMutation.isPending ? 'Procesando...' : 'Confirmar pago'}
            </Button>
          </form>
        </Card>

        <Card>
          <p className="text-sm font-semibold uppercase text-slate-400">Resumen del servicio</p>
          {selectedBooking ? (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-950">{selectedBooking.serviceRequestTitle}</h3>
                <p className="mt-1 text-sm text-slate-600">{selectedBooking.professionalName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">Monto</p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {selectedAmount ? formatMoney(toAmountCents(selectedAmount)) : '-'}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">Metodo</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{methodCopy[selectedMethod]}</p>
                </div>
              </div>
              <Badge>MercadoPago</Badge>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Selecciona un servicio para ver el detalle del pago.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-bold text-slate-950">Pagos recientes</h3>
        {!(paymentsQuery.data ?? []).length && !paymentsQuery.isLoading ? (
          <Card>
            <p className="text-sm text-slate-600">Todavia no hay pagos registrados.</p>
          </Card>
        ) : null}
        {(paymentsQuery.data ?? []).map((item) => (
          <Card key={item.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-slate-900">{item.serviceRequestTitle}</p>
              <p className="mt-1 text-sm text-slate-600">
                {item.professionalName} - {formatMoney(item.amountCents, item.currency)}
              </p>
            </div>
            <Badge>{item.status}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
};
