import { httpClient } from '@/shared/api/http-client';
import type { CreateQuoteInput, Quote } from '@/shared/types/api';

export const quotesService = {
  listMine() {
    return httpClient.get<Quote[]>('/quotes/me');
  },
  create(payload: CreateQuoteInput) {
    return httpClient.post<Quote>(`/service-requests/${payload.serviceRequestId}/quotes`, payload);
  },
};
