import { describe, expect, it } from 'vitest';

import { runFullFlowSmoke } from './smoke-flow.mjs';

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
});

describe('runFullFlowSmoke', () => {
  it('executes the client, professional, payment and review backend flow', async () => {
    const calls = [];
    const fetchImpl = async (url, options = {}) => {
      const { pathname } = new URL(url);
      const method = options.method ?? 'GET';
      const body = options.body ? JSON.parse(options.body) : undefined;

      calls.push({ pathname, method, body, authorization: options.headers?.Authorization });

      if (pathname === '/health') {
        return jsonResponse({ status: 'ok' });
      }

      if (pathname === '/login') {
        return jsonResponse('<html></html>');
      }

      if (pathname === '/auth/login' && body.email === 'cliente@arreglaya.com') {
        return jsonResponse({ accessToken: 'client-token', user: { id: 'client-1' } });
      }

      if (pathname === '/auth/login' && body.email === 'pro@arreglaya.com') {
        return jsonResponse({ accessToken: 'pro-token', user: { id: 'pro-1' } });
      }

      if (pathname === '/categories') {
        return jsonResponse([{ id: 'category-1', name: 'Plomeria', slug: 'plomeria' }]);
      }

      if (pathname === '/service-requests' && method === 'POST') {
        return jsonResponse({
          id: 'request-1',
          title: body.title,
          status: 'open',
          category: { id: body.categoryId, name: 'Plomeria', slug: 'plomeria' },
        }, 201);
      }

      if (pathname === '/service-requests/request-1/quotes' && method === 'POST') {
        return jsonResponse({
          id: 'quote-1',
          serviceRequestId: 'request-1',
          professionalId: 'pro-1',
          amount: body.amount,
          status: 'pending',
        }, 201);
      }

      if (pathname === '/quotes/quote-1' && method === 'PATCH') {
        return jsonResponse({
          id: 'quote-1',
          serviceRequestId: 'request-1',
          professionalId: 'pro-1',
          status: body.status,
        });
      }

      if (pathname === '/bookings' && method === 'POST') {
        return jsonResponse({
          id: 'booking-1',
          serviceRequestId: body.serviceRequestId,
          professionalId: body.professionalId,
          status: 'pending',
        }, 201);
      }

      if (pathname === '/bookings/booking-1' && method === 'PATCH') {
        return jsonResponse({
          id: 'booking-1',
          serviceRequestId: 'request-1',
          professionalId: 'pro-1',
          status: body.status,
        });
      }

      if (pathname === '/bookings/booking-1/payments' && method === 'POST') {
        return jsonResponse({
          id: 'payment-1',
          bookingId: 'booking-1',
          status: 'pending',
          amountCents: body.amountCents,
        }, 201);
      }

      if (pathname === '/payments/webhooks/mercadopago' && method === 'POST') {
        return jsonResponse({ received: true });
      }

      if (pathname === '/payments/payment-1/receipt') {
        return jsonResponse({
          paymentId: 'payment-1',
          bookingId: 'booking-1',
          receiptNumber: 'AY-TEST',
        });
      }

      if (pathname === '/reviews' && method === 'POST') {
        return jsonResponse({
          id: 'review-1',
          bookingId: body.bookingId,
          rating: body.rating,
        }, 201);
      }

      throw new Error(`Unexpected request: ${method} ${pathname}`);
    };

    const summary = await runFullFlowSmoke({
      backendUrl: 'http://backend.test',
      frontendUrl: 'http://frontend.test',
      fetchImpl,
      sleep: async () => {},
      uniqueId: 'test-123',
      scheduledAt: '2026-06-14T15:00:00.000Z',
    });

    expect(summary).toMatchObject({
      login: 'ok',
      serviceRequestId: 'request-1',
      quoteId: 'quote-1',
      bookingId: 'booking-1',
      paymentId: 'payment-1',
      receiptNumber: 'AY-TEST',
      reviewId: 'review-1',
    });

    expect(calls.map(({ method, pathname }) => `${method} ${pathname}`)).toEqual([
      'GET /health',
      'GET /login',
      'POST /auth/login',
      'POST /auth/login',
      'GET /categories',
      'POST /service-requests',
      'POST /service-requests/request-1/quotes',
      'PATCH /quotes/quote-1',
      'POST /bookings',
      'PATCH /bookings/booking-1',
      'POST /bookings/booking-1/payments',
      'POST /payments/webhooks/mercadopago',
      'GET /payments/payment-1/receipt',
      'PATCH /bookings/booking-1',
      'POST /reviews',
    ]);

    expect(calls.find((call) => call.pathname === '/service-requests')?.body).toMatchObject({
      categoryId: 'category-1',
      title: 'QA full flow test-123',
    });
    expect(calls.find((call) => call.pathname === '/quotes/quote-1')?.body).toEqual({
      status: 'accepted',
    });
    expect(calls.find((call) => call.pathname === '/reviews')?.body).toEqual({
      bookingId: 'booking-1',
      rating: 5,
      comment: 'Smoke full flow completed successfully.',
    });
  });

  it('includes backend response body when a backend request fails', async () => {
    const fetchImpl = async (url, options = {}) => {
      const { pathname } = new URL(url);
      const method = options.method ?? 'GET';
      const body = options.body ? JSON.parse(options.body) : undefined;

      if (pathname === '/health') {
        return jsonResponse({ status: 'ok' });
      }

      if (pathname === '/login') {
        return jsonResponse('<html></html>');
      }

      if (pathname === '/auth/login' && body.email === 'cliente@arreglaya.com') {
        return jsonResponse({ accessToken: 'client-token', user: { id: 'client-1' } });
      }

      if (pathname === '/auth/login' && body.email === 'pro@arreglaya.com') {
        return jsonResponse({ accessToken: 'pro-token', user: { id: 'pro-1' } });
      }

      if (pathname === '/categories') {
        return jsonResponse([{ id: 'category-1', name: 'Plomeria', slug: 'plomeria' }]);
      }

      if (pathname === '/service-requests' && method === 'POST') {
        return jsonResponse({
          id: 'request-1',
          title: body.title,
          status: 'open',
          category: { id: body.categoryId, name: 'Plomeria', slug: 'plomeria' },
        }, 201);
      }

      if (pathname === '/service-requests/request-1/quotes' && method === 'POST') {
        return jsonResponse({
          id: 'quote-1',
          serviceRequestId: 'request-1',
          professionalId: 'pro-1',
          amount: body.amount,
          status: 'pending',
        }, 201);
      }

      if (pathname === '/quotes/quote-1' && method === 'PATCH') {
        return jsonResponse({
          code: 'QUOTE_FORBIDDEN',
          message: 'No puedes resolver cotizaciones de otra solicitud.',
        }, 403);
      }

      throw new Error(`Unexpected request: ${method} ${pathname}`);
    };

    await expect(
      runFullFlowSmoke({
        backendUrl: 'http://backend.test',
        frontendUrl: 'http://frontend.test',
        fetchImpl,
        sleep: async () => {},
        uniqueId: 'test-123',
        scheduledAt: '2026-06-14T15:00:00.000Z',
      }),
    ).rejects.toThrow(
      /PATCH http:\/\/backend\.test\/quotes\/quote-1 fallo con status 403.*QUOTE_FORBIDDEN/s,
    );
  });
});
