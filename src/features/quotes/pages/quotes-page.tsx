import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { quotesService } from '@/features/quotes/services/quotes-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';
import { ApiError } from '@/shared/api/api-error';
import type { QuoteStatus } from '@/shared/types/api';
import { quoteSchema, type QuoteFormValues } from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';
import { Textarea } from '@/shared/ui/textarea';

export const QuotesPage = () => <QuotesContent />;

const quoteStatusCopy: Record<QuoteStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada',
};

const quoteStatusTone: Record<QuoteStatus, string> = {
  pending: 'bg-accent-50 text-accent-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  withdrawn: 'bg-slate-100 text-slate-600',
};

const statusCount = (statuses: QuoteStatus[], status: QuoteStatus) =>
  statuses.filter((currentStatus) => currentStatus === status).length;

const formatQuoteDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha pendiente';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const QuotesContent = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['quotes', 'mine'],
    queryFn: () => quotesService.listMine(),
  });
  const requestsQuery = useQuery({
    queryKey: ['service-requests', 'quoteable'],
    queryFn: () => serviceRequestsService.list(),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      serviceRequestId: '',
      amount: '',
      message: '',
    },
  });
  const existingQuoteIds = useMemo(
    () => new Set((query.data ?? []).map((quote) => quote.serviceRequestId)),
    [query.data],
  );
  const quoteableRequests = (requestsQuery.data ?? []).filter(
    (request) => !existingQuoteIds.has(request.id),
  );
  const mutation = useMutation({
    mutationFn: (values: QuoteFormValues) => quotesService.create(values),
    onSuccess: async () => {
      reset({
        serviceRequestId: '',
        amount: '',
        message: '',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quotes', 'mine'] }),
        queryClient.invalidateQueries({ queryKey: ['service-requests'] }),
        queryClient.invalidateQueries({
          queryKey: ['service-requests', 'quoteable'],
        }),
      ]);
    },
  });

  const quotes = query.data ?? [];
  const quoteStatuses = quotes.map((quote) => quote.status);
  const quoteStats = [
    { label: 'Pendientes', value: statusCount(quoteStatuses, 'pending') },
    { label: 'Aceptadas', value: statusCount(quoteStatuses, 'accepted') },
    { label: 'Rechazadas', value: statusCount(quoteStatuses, 'rejected') },
  ];
  const submitQuote = (values: QuoteFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Cotizaciones"
          title="Espacio para propuestas profesionales"
          description="Esta base ya separa el dominio de cotizaciones. Luego podra conectarse a listas reales, detalle, acciones y filtros por estado."
        />
      </div>

      <Card className="rounded-[28px] !bg-ink p-5 text-white shadow-lg shadow-slate-300/70 md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
              Mis cotizaciones
            </p>
            <h1 className="mt-2 text-2xl font-black">Propuestas enviadas</h1>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Consulta estados, montos y oportunidades para nuevos trabajos.
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-ink">
            {quotes.length} total
          </div>
        </div>
      </Card>

      {query.error instanceof ApiError ||
      requestsQuery.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">
            Sin respuesta del backend
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {(query.error instanceof ApiError && query.error.message) ||
              (requestsQuery.error instanceof ApiError &&
                requestsQuery.error.message)}
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
              Mis cotizaciones
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Revisa el avance de tus propuestas y prepara nuevas respuestas.
            </p>
          </div>
          <Badge>{quotes.length} enviadas</Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {quoteStats.map((stat) => (
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

      <Card className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-slate-950 md:text-xl md:font-bold">
              Enviar cotizacion
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Usa datos reales de solicitudes abiertas y publica tu propuesta.
            </p>
          </div>
          <Badge className="hidden break-all md:inline-flex">
            POST /service-requests/:id/quotes
          </Badge>
        </div>

        {mutation.error instanceof ApiError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {mutation.error.message}
          </div>
        ) : null}

        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => void handleSubmit(submitQuote)(event)}
        >
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Solicitud
            </span>
            <Select
              error={errors.serviceRequestId?.message}
              {...register('serviceRequestId')}
            >
              <option value="">Selecciona una solicitud</option>
              {quoteableRequests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.title} / {request.city} / {request.zone}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Monto</span>
            <Input
              placeholder="$85.000"
              error={errors.amount?.message}
              {...register('amount')}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Mensaje
            </span>
            <Textarea
              error={errors.message?.message}
              placeholder="Explica alcance, materiales y tiempos estimados."
              {...register('message')}
            />
          </label>
          <div>
            <Button
              className="w-full sm:w-auto"
              disabled={mutation.isPending || !quoteableRequests.length}
              type="submit"
              variant="secondary"
            >
              {mutation.isPending ? 'Enviando...' : 'Enviar cotizacion'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {!quotes.length && !query.isLoading ? (
          <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:col-span-2 md:rounded-3xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-xl font-black text-accent-600">
              0
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-950">
              Todavia no enviaste cotizaciones
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
              Cuando respondas a una solicitud, vas a ver aca el monto, mensaje
              y estado de la propuesta.
            </p>
          </Card>
        ) : null}
        {quotes.map((quote) => (
          <Card
            className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6"
            key={quote.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {formatQuoteDate(quote.createdAt)}
                </p>
                <h3 className="mt-1 text-lg font-black leading-tight text-slate-950">
                  {quote.serviceRequestTitle}
                </h3>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${quoteStatusTone[quote.status]}`}
              >
                {quoteStatusCopy[quote.status]}
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Monto
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {quote.amount}
              </p>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {quote.message}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
