import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { QuotesPage } from '@/features/quotes/pages/quotes-page';
import { quotesService } from '@/features/quotes/services/quotes-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';

vi.mock('@/features/quotes/services/quotes-service', () => ({
  quotesService: {
    create: vi.fn(),
    listMine: vi.fn(),
  },
}));

vi.mock('@/features/service-requests/services/service-requests-service', () => ({
  serviceRequestsService: {
    list: vi.fn(),
  },
}));

const quotesServiceMock = vi.mocked(quotesService);
const serviceRequestsServiceMock = vi.mocked(serviceRequestsService);

const TestProviders = ({ children }: PropsWithChildren) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('QuotesPage', () => {
  beforeEach(() => {
    serviceRequestsServiceMock.list.mockResolvedValue([]);
    quotesServiceMock.listMine.mockResolvedValue([
      {
        id: 'quote-1',
        serviceRequestId: 'request-1',
        serviceRequestTitle: 'prueba final',
        professionalId: 'pro-1',
        professionalName: 'Carlos Mendoza',
        amount: '50000',
        status: 'accepted',
        message: 'arreglamos todo',
        createdAt: '2026-06-15T10:00:00.000Z',
      },
    ]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('ofrece gestionar la reserva cuando una cotizacion fue aceptada', async () => {
    render(
      <TestProviders>
        <QuotesPage />
      </TestProviders>,
    );

    expect(await screen.findByText('prueba final')).toBeInTheDocument();
    expect(screen.getByText('Aceptada')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Gestionar reserva' }),
    ).toHaveAttribute('href', '/app/reservas');
  });
});
