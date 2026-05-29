import { httpClient } from '@/shared/api/http-client';
import type { CreatePaymentInput, Payment, PaymentReceipt } from '@/shared/types/api';

export const paymentsService = {
  list() {
    return httpClient.get<Payment[]>('/payments');
  },
  createForBooking(bookingId: string, payload: CreatePaymentInput) {
    return httpClient.post<Payment>(`/bookings/${bookingId}/payments`, payload);
  },
  receipt(paymentId: string) {
    return httpClient.get<PaymentReceipt>(`/payments/${paymentId}/receipt`);
  },
};
