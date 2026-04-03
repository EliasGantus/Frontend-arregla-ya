import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { quotesService } from '@/features/quotes/services/quotes-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';
import { ApiError } from '@/shared/api/api-error';
import { quoteSchema, type QuoteFormValues } from '@/shared/types/contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { StatusPanel } from '@/shared/ui/status-panel';
import { Textarea } from '@/shared/ui/textarea';

export const QuotesPage = () => <QuotesContent />;

const QuotesContent = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['quotes', 'mine'],
    queryFn: quotesService.listMine,
  });
  const requestsQuery = useQuery({
    queryKey: ['service-requests', 'quoteable'],
    queryFn: serviceRequestsService.list,
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
  const quoteableRequests = (requestsQuery.data ?? []).filter((request) => !existingQuoteIds.has(request.id));
  const mutation = useMutation({
    mutationFn: quotesService.create,
    onSuccess: async () => {
      reset({
        serviceRequestId: '',
        amount: '',
        message: '',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quotes', 'mine'] }),
        queryClient.invalidateQueries({ queryKey: ['service-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['service-requests', 'quoteable'] }),
      ]);
    },
  });

  const quotes = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatusPanel
        eyebrow="Cotizaciones"
        title="Espacio para propuestas profesionales"
        description="Esta base ya separa el dominio de cotizaciones. Luego podrá conectarse a listas reales, detalle, acciones y filtros por estado."
      />

      {query.error instanceof ApiError || requestsQuery.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">Sin respuesta del backend</p>
          <p className="mt-2 text-sm text-amber-700">
            {(query.error instanceof ApiError && query.error.message) ||
              (requestsQuery.error instanceof ApiError && requestsQuery.error.message)}
          </p>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Enviar cotización</h2>
            <p className="mt-2 text-sm text-slate-600">Usa datos reales de solicitudes abiertas y publica tu propuesta.</p>
          </div>
          <Badge>POST /service-requests/:id/quotes</Badge>
        </div>

        {mutation.error instanceof ApiError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {mutation.error.message}
          </div>
        ) : null}

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit((values) => mutation.mutateAsync(values))}>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Solicitud</span>
            <Select error={errors.serviceRequestId?.message} {...register('serviceRequestId')}>
              <option value="">Selecciona una solicitud</option>
              {quoteableRequests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.title} · {request.city} / {request.zone}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Monto</span>
            <Input placeholder="$85.000" error={errors.amount?.message} {...register('amount')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Mensaje</span>
            <Textarea error={errors.message?.message} {...register('message')} />
          </label>
          <div>
            <Button type="submit" disabled={mutation.isPending || !quoteableRequests.length}>
              {mutation.isPending ? 'Enviando...' : 'Enviar cotización'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {!quotes.length && !query.isLoading ? (
          <Card className="md:col-span-2">
            <p className="text-sm text-slate-600">Aún no tienes cotizaciones registradas.</p>
          </Card>
        ) : null}
        {quotes.map((quote) => (
          <Card key={quote.id}>
            <p className="text-sm text-slate-500">Profesional</p>
            <p className="mt-2 text-xl font-bold text-slate-950">{quote.professionalName}</p>
            <p className="mt-4 text-sm text-slate-500">Solicitud</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{quote.serviceRequestId}</p>
            <p className="mt-4 text-sm text-slate-500">Monto</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-brand-700">{quote.amount}</p>
            <p className="mt-4 rounded-full bg-accent-50 px-3 py-2 text-sm font-semibold text-accent-700">
              Estado: {quote.status}
            </p>
            <p className="mt-4 text-sm text-slate-600">{quote.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
