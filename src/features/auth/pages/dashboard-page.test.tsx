import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { adminService } from '@/features/admin/services/admin-service';
import { useAuth } from '@/features/auth/context/auth-context';
import { DashboardPage } from '@/features/auth/pages/dashboard-page';
import { bookingsService } from '@/features/bookings/services/bookings-service';
import { quotesService } from '@/features/quotes/services/quotes-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/admin/services/admin-service', () => ({
  adminService: {
    users: vi.fn(),
    serviceRequests: vi.fn(),
  },
}));

vi.mock('@/features/bookings/services/bookings-service', () => ({
  bookingsService: {
    list: vi.fn(),
  },
}));

vi.mock('@/features/quotes/services/quotes-service', () => ({
  quotesService: {
    listMine: vi.fn(),
  },
}));

vi.mock('@/features/service-requests/services/service-requests-service', () => ({
  serviceRequestsService: {
    list: vi.fn(),
  },
}));

const adminServiceMock = vi.mocked(adminService);
const bookingsServiceMock = vi.mocked(bookingsService);
const quotesServiceMock = vi.mocked(quotesService);
const serviceRequestsServiceMock = vi.mocked(serviceRequestsService);
const useAuthMock = vi.mocked(useAuth);

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

const renderPage = () =>
  render(
    <TestProviders>
      <DashboardPage />
    </TestProviders>,
  );

const serviceRequest = (status: 'open' | 'quoted' | 'assigned' | 'completed' | 'cancelled') => ({
  id: `request-${status}`,
  title: `Solicitud ${status}`,
  description: 'Descripcion de prueba',
  status,
  category: { id: 'cat-1', name: 'Plomeria', slug: 'plomeria' },
  city: 'Buenos Aires',
  zone: 'Palermo',
  photos: [],
  createdAt: '2026-06-01T10:00:00.000Z',
});

const booking = (status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => ({
  id: `booking-${status}`,
  serviceRequestId: 'request-1',
  serviceRequestTitle: 'Solicitud',
  clientId: 'client-1',
  clientName: 'Cliente Demo',
  professionalId: 'pro-1',
  professionalName: 'Profesional Demo',
  scheduledAt: '2026-06-10T14:00:00.000Z',
  status,
  createdAt: '2026-06-01T11:00:00.000Z',
});

const quote = (status: 'pending' | 'accepted' | 'rejected' | 'withdrawn') => ({
  id: `quote-${status}`,
  serviceRequestId: 'request-1',
  serviceRequestTitle: 'Solicitud',
  professionalId: 'pro-1',
  professionalName: 'Profesional Demo',
  amount: '$85.000',
  status,
  message: 'Puedo resolverlo durante la tarde.',
  createdAt: '2026-06-01T12:00:00.000Z',
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminServiceMock.users.mockResolvedValue([]);
    adminServiceMock.serviceRequests.mockResolvedValue([]);
    bookingsServiceMock.list.mockResolvedValue([]);
    quotesServiceMock.listMine.mockResolvedValue([]);
    serviceRequestsServiceMock.list.mockResolvedValue([]);
  });

  it('muestra metricas reales para cliente', async () => {
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
      serviceRequest('open'),
      serviceRequest('quoted'),
      serviceRequest('completed'),
      serviceRequest('cancelled'),
    ]);
    bookingsServiceMock.list.mockResolvedValue([booking('pending'), booking('completed')]);

    renderPage();

    expect(await screen.findByText('Solicitudes activas')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('02')).toBeInTheDocument());
    expect(screen.getAllByText('01')).toHaveLength(2);
    expect(screen.getByText('Reservas activas')).toBeInTheDocument();
  });

  it('muestra metricas reales para profesional', async () => {
    useAuthMock.mockReturnValue({
      user: {
        id: 'pro-1',
        email: 'pro@arreglaya.com',
        fullName: 'Profesional Demo',
        role: 'profesional',
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
    quotesServiceMock.listMine.mockResolvedValue([
      quote('accepted'),
      quote('pending'),
      quote('rejected'),
    ]);
    bookingsServiceMock.list.mockResolvedValue([booking('confirmed'), booking('completed')]);

    renderPage();

    expect(await screen.findByText('Cotizaciones enviadas')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('03')).toBeInTheDocument());
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('muestra metricas reales para admin', async () => {
    useAuthMock.mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin@arreglaya.com',
        fullName: 'Admin Demo',
        role: 'admin',
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
    adminServiceMock.users.mockResolvedValue([
      {
        id: 'user-1',
        fullName: 'Cliente Demo',
        email: 'cliente@arreglaya.com',
        role: 'cliente',
        createdAt: '2026-06-01T10:00:00.000Z',
      },
      {
        id: 'user-2',
        fullName: 'Profesional Demo',
        email: 'pro@arreglaya.com',
        role: 'profesional',
        createdAt: '2026-06-01T10:00:00.000Z',
      },
    ]);
    adminServiceMock.serviceRequests.mockResolvedValue([
      serviceRequest('open'),
      serviceRequest('quoted'),
      serviceRequest('assigned'),
      serviceRequest('completed'),
    ]);

    renderPage();

    expect(await screen.findByText('Usuarios activos')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('02')).toBeInTheDocument());
    expect(screen.getByText('Solicitudes abiertas')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
  });
});
