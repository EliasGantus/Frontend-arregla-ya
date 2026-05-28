import { httpClient } from '@/shared/api/http-client';
import type { Booking, CreateBookingInput, UpdateBookingInput } from '@/shared/types/api';

export const bookingsService = {
  list() {
    return httpClient.get<Booking[]>('/bookings');
  },
  create(payload: CreateBookingInput) {
    return httpClient.post<Booking>('/bookings', payload);
  },
  update(bookingId: string, payload: UpdateBookingInput) {
    return httpClient.patch<Booking>(`/bookings/${bookingId}`, payload);
  },
};
