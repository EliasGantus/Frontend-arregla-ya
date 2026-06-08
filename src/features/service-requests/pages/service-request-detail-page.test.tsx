import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { bookingsService } from '@/features/bookings/services/bookings-service';
import { quotesService } from '@/features/quotes/services/quotes-service';
import { ServiceRequestDetailPage } from '@/features/service-requests/pages/service-requests-page';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/bookings/services/bookings-service', () => ({
  bookingsService: {
    create: vi.fn(),
  },
}));

vi.mock('@/features/quotes/services/quotes-service', () => ({
  quotesService: {
    listForRequest: vi.fn(),
  },
}));

vi.mock('@/features/service-requests/services/service-requests-service', () => ({
  serviceRequestsService: {
    list: vi.fn(),
  },
}));

const useAuthMock = vi.mocked(useAuth);
const bookingsServiceMock = vi.mocked(bookingsService);
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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const renderPage = () =>
  render(
    <TestProviders>
      <MemoryRouter initialEntries={['/app/solicitudes/request-1']}>
        <Routes>
          <Route
            path="/app/solicitudes/:requestId"
            element={<ServiceRequestDetailPage />}
          />
          <Route path="/app/reservas" element={<p>Reservas</p>} />
        </Routes>
      </MemoryRouter>
    </TestProviders>,
  );

describe('ServiceRequestDetailPage', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: {
        id: 'client-1',
        email: 'cliente@arreglaya.com',
        fullName: 'Cliente Demo',
        role: 'cliente',
      },
      accessToken: 'token',
      refreshToken: 'refresh',
      isAuthenticated: true,
      isBootstrapping: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });
    serviceRequestsServiceMock.list.mockResolvedValue([
      {
        id: 'request-1',
        title: 'Arreglo de canilla',
        description: 'Pierde agua bajo mesada',
        status: 'quoted',
        category: { id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' },
        city: 'Buenos Aires',
        zone: 'Palermo',
        photos: [],
        createdAt: '2026-05-28T12:00:00.000Z',
      },
    ]);
    quotesServiceMock.listForRequest.mockResolvedValue([
      {
        id: 'quote-1',
        serviceRequestId: 'request-1',
        serviceRequestTitle: 'Arreglo de canilla',
        professionalId: 'pro-1',
        professionalName: 'Ana Ruiz',
        amount: '85000',
        status: 'pending',
        message: 'Puedo resolverlo durante la tarde.',
        createdAt: '2026-05-28T13:00:00.000Z',
      },
    ]);
    bookingsServiceMock.create.mockResolvedValue({
      id: 'booking-1',
      serviceRequestId: 'request-1',
      serviceRequestTitle: 'Arreglo de canilla',
      clientId: 'client-1',
      clientName: 'Cliente Demo',
      professionalId: 'pro-1',
      professionalName: 'Ana Ruiz',
      scheduledAt: '2026-06-14T13:30:00.000Z',
      status: 'pending',
      notes: 'Coordinar acceso por porteria',
      createdAt: '2026-05-28T14:00:00.000Z',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('permite reservar una cotizacion recibida desde el detalle de solicitud', async () => {
    renderPage();

    expect(await screen.findByText('Cotizaciones recibidas')).toBeInTheDocument();
    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Fecha tentativa'), {
      target: { value: '2026-06-14' },
    });
    fireEvent.change(screen.getByLabelText('Horario'), {
      target: { value: '10:30' },
    });
    fireEvent.change(screen.getByLabelText('Notas para la reserva'), {
      target: { value: 'Coordinar acceso por porteria' },
    });
    const submitButton = screen.getByRole('button', {
      name: 'Reservar con Ana Ruiz',
    });
    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(bookingsServiceMock.create.mock.calls[0]?.[0]).toMatchObject({
        serviceRequestId: 'request-1',
        professionalId: 'pro-1',
        notes: 'Coordinar acceso por porteria',
      }),
    );
    expect(await screen.findByText('Reservas')).toBeInTheDocument();
  });
});
