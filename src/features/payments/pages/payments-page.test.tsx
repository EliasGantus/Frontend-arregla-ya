import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { bookingsService } from '@/features/bookings/services/bookings-service';
import { PaymentsPage } from '@/features/payments/pages/payments-page';
import { paymentsService } from '@/features/payments/services/payments-service';
import { ApiError } from '@/shared/api/api-error';

vi.mock('@/features/bookings/services/bookings-service', () => ({
  bookingsService: {
    list: vi.fn(),
  },
}));

vi.mock('@/features/payments/services/payments-service', () => ({
  paymentsService: {
    list: vi.fn(),
    createForBooking: vi.fn(),
  },
}));

const bookingsServiceMock = vi.mocked(bookingsService);
const paymentsServiceMock = vi.mocked(paymentsService);

const booking = {
  id: 'booking-1',
  serviceRequestId: 'request-1',
  serviceRequestTitle: 'Cambio de termica',
  clientId: 'client-1',
  clientName: 'Cliente Demo',
  professionalId: 'pro-1',
  professionalName: 'Ana Ruiz',
  scheduledAt: '2026-05-30T13:30:00.000Z',
  status: 'completed' as const,
  notes: 'Trabajo terminado',
  createdAt: '2026-05-28T12:30:00.000Z',
};

const TestProviders = ({ children }: PropsWithChildren) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const renderPage = () =>
  render(
    <TestProviders>
      <MemoryRouter initialEntries={[{ pathname: '/app/pagos', state: { booking } }]}>
        <PaymentsPage />
      </MemoryRouter>
    </TestProviders>,
  );

describe('PaymentsPage', () => {
  beforeEach(() => {
    bookingsServiceMock.list.mockResolvedValue([booking]);
    paymentsServiceMock.list.mockResolvedValue([]);
    paymentsServiceMock.createForBooking.mockResolvedValue({
      id: 'payment-1',
      bookingId: 'booking-1',
      serviceRequestId: 'request-1',
      serviceRequestTitle: 'Cambio de termica',
      professionalId: 'pro-1',
      professionalName: 'Ana Ruiz',
      amountCents: 8500000,
      currency: 'ARS',
      status: 'approved',
      provider: 'mercado_pago',
      receiptNumber: 'AY-2026-PAYMENT1',
      paidAt: '2026-05-29T12:00:00.000Z',
      createdAt: '2026-05-29T12:00:00.000Z',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('procesa un pago exitoso y muestra comprobante', async () => {
    renderPage();

    await screen.findByText('Cambio de termica');
    fireEvent.change(screen.getByLabelText('Monto'), {
      target: { value: '85000' },
    });
    fireEvent.change(screen.getByLabelText('Metodo de pago'), {
      target: { value: 'mercado_pago_card' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }));

    expect(await screen.findByText('Pago procesado exitosamente. Recibiras el comprobante por email.')).toBeInTheDocument();
    expect(screen.getByText('AY-2026-PAYMENT1')).toBeInTheDocument();
    expect(paymentsServiceMock.createForBooking.mock.calls[0]?.[0]).toBe('booking-1');
    expect(paymentsServiceMock.createForBooking.mock.calls[0]?.[1]).toMatchObject({
      amountCents: 8500000,
      currency: 'ARS',
    });
  });

  it('muestra error descriptivo cuando falla el cobro', async () => {
    paymentsServiceMock.createForBooking.mockRejectedValue(
      new ApiError('MercadoPago rechazo la tarjeta.', 402, 'PAYMENT_REJECTED'),
    );
    renderPage();

    await screen.findByText('Cambio de termica');
    fireEvent.change(screen.getByLabelText('Monto'), {
      target: { value: '85000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }));

    expect(await screen.findByText(/MercadoPago rechazo la tarjeta/)).toBeInTheDocument();
    expect(screen.getByText(/Intenta con otro metodo de pago/)).toBeInTheDocument();
  });
});
