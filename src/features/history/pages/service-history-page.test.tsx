import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { bookingsService } from '@/features/bookings/services/bookings-service';
import { ServiceHistoryPage } from '@/features/history/pages/service-history-page';
import { paymentsService } from '@/features/payments/services/payments-service';

vi.mock('@/features/bookings/services/bookings-service', () => ({
  bookingsService: {
    list: vi.fn(),
  },
}));

vi.mock('@/features/payments/services/payments-service', () => ({
  paymentsService: {
    list: vi.fn(),
  },
}));

const bookingsServiceMock = vi.mocked(bookingsService);
const paymentsServiceMock = vi.mocked(paymentsService);

const bookings = [
  {
    id: 'booking-pending',
    serviceRequestId: 'request-pending',
    serviceRequestTitle: 'Revision de enchufes',
    clientId: 'client-1',
    clientName: 'Cliente Demo',
    professionalId: 'pro-2',
    professionalName: 'Bruno Vera',
    scheduledAt: '2026-05-28T13:30:00.000Z',
    status: 'pending' as const,
    notes: 'Revisar cocina',
    createdAt: '2026-05-27T12:30:00.000Z',
  },
  {
    id: 'booking-completed',
    serviceRequestId: 'request-completed',
    serviceRequestTitle: 'Cambio de termica',
    clientId: 'client-1',
    clientName: 'Cliente Demo',
    professionalId: 'pro-1',
    professionalName: 'Ana Ruiz',
    scheduledAt: '2026-05-30T13:30:00.000Z',
    status: 'completed' as const,
    notes: 'Trabajo terminado',
    createdAt: '2026-05-28T12:30:00.000Z',
  },
  {
    id: 'booking-cancelled',
    serviceRequestId: 'request-cancelled',
    serviceRequestTitle: 'Arreglo de persiana',
    clientId: 'client-1',
    clientName: 'Cliente Demo',
    professionalId: 'pro-3',
    professionalName: 'Marta Silva',
    scheduledAt: '2026-05-20T13:30:00.000Z',
    status: 'cancelled' as const,
    createdAt: '2026-05-19T12:30:00.000Z',
  },
];

const TestProviders = ({ children }: PropsWithChildren) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const renderPage = () =>
  render(
    <TestProviders>
      <MemoryRouter initialEntries={['/app/historial']}>
        <ServiceHistoryPage />
      </MemoryRouter>
    </TestProviders>,
  );

describe('ServiceHistoryPage', () => {
  beforeEach(() => {
    bookingsServiceMock.list.mockResolvedValue(bookings);
    paymentsServiceMock.list.mockResolvedValue([
      {
        id: 'payment-1',
        bookingId: 'booking-completed',
        serviceRequestId: 'request-completed',
        serviceRequestTitle: 'Cambio de termica',
        professionalId: 'pro-1',
        professionalName: 'Ana Ruiz',
        amountCents: 8500000,
        currency: 'ARS',
        status: 'approved',
        provider: 'mercado_pago',
        receiptNumber: 'AY-2026-PAYMENT1',
        paidAt: '2026-05-30T14:00:00.000Z',
        createdAt: '2026-05-30T14:00:00.000Z',
      },
    ]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('muestra servicios ordenados por fecha reciente y su monto pagado', async () => {
    renderPage();

    await screen.findAllByText('Cambio de termica');
    const serviceRows = screen
      .getAllByRole('button')
      .filter(
        (button) =>
          button.textContent?.includes('Profesional') &&
          button.textContent.includes('Pago'),
      );

    expect(serviceRows[0]?.textContent).toContain('Cambio de termica');
    expect(serviceRows[1]?.textContent).toContain('Revision de enchufes');
    expect(screen.getAllByText(/85.000/).length).toBeGreaterThan(0);
  });

  it('filtra el historial por estado seleccionado', async () => {
    renderPage();

    await screen.findAllByText('Cambio de termica');
    fireEvent.change(screen.getByLabelText('Filtrar por estado'), {
      target: { value: 'cancelled' },
    });

    expect(screen.getAllByText('Arreglo de persiana').length).toBeGreaterThan(0);
    expect(screen.queryByText('Cambio de termica')).not.toBeInTheDocument();
    expect(screen.queryByText('Revision de enchufes')).not.toBeInTheDocument();
  });

  it('abre el detalle con informacion completa y accion para calificar completados', async () => {
    renderPage();

    await screen.findByText('Revision de enchufes');
    fireEvent.click(screen.getByRole('button', { name: /Cambio de termica/ }));

    expect(screen.getByText('Detalle del servicio')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Ruiz').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/85.000/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: 'Calificar servicio' }),
    ).toBeInTheDocument();
  });
});
