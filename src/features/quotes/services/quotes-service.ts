import { httpClient } from '@/shared/api/http-client';
import type { CreateQuoteInput, Quote, UpdateQuoteInput } from '@/shared/types/api';

export const quotesService = {
  listMine() {
    return httpClient.get<Quote[]>('/quotes/me');
  },
  listForRequest(serviceRequestId: string) {
    return httpClient.get<Quote[]>(`/service-requests/${serviceRequestId}/quotes`);
  },
  create(payload: CreateQuoteInput) {
    return httpClient.post<Quote>(`/service-requests/${payload.serviceRequestId}/quotes`, payload);
  },
  update(quoteId: string, payload: UpdateQuoteInput) {
    return httpClient.patch<Quote>(`/quotes/${quoteId}`, payload);
  },
};
