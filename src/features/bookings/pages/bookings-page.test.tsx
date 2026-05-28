import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/features/auth/context/auth-context';
import { BookingsPage } from '@/features/bookings/pages/bookings-page';
import { bookingsService } from '@/features/bookings/services/bookings-service';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/bookings/services/bookings-service', () => ({
  bookingsService: {
    list: vi.fn(),
    update: vi.fn(),
  },
}));

const useAuthMock = vi.mocked(useAuth);
const bookingsServiceMock = vi.mocked(bookingsService);

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

describe('BookingsPage', () => {
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
    bookingsServiceMock.list.mockResolvedValue([
      {
        id: 'booking-1',
        serviceRequestId: 'request-1',
        serviceRequestTitle: 'Arreglo de canilla',
        clientId: 'client-1',
        clientName: 'Cliente Demo',
        professionalId: 'pro-top',
        professionalName: 'Ana Ruiz',
        scheduledAt: '2026-05-30T13:30:00.000Z',
        status: 'pending',
        notes: 'Revisar perdida bajo mesada',
        createdAt: '2026-05-28T12:30:00.000Z',
      },
    ]);
    bookingsServiceMock.update.mockResolvedValue({
      id: 'booking-1',
      serviceRequestId: 'request-1',
      serviceRequestTitle: 'Arreglo de canilla',
      clientId: 'client-1',
      clientName: 'Cliente Demo',
      professionalId: 'pro-top',
      professionalName: 'Ana Ruiz',
      scheduledAt: '2026-05-30T13:30:00.000Z',
      status: 'cancelled',
      notes: 'Revisar perdida bajo mesada',
      createdAt: '2026-05-28T12:30:00.000Z',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('permite cancelar una reserva pendiente desde el historial', async () => {
    render(
      <TestProviders>
        <BookingsPage />
      </TestProviders>,
    );

    expect(await screen.findByText('Arreglo de canilla')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));

    expect(await screen.findByText(/Reserva cancelada/)).toBeInTheDocument();
    expect(bookingsServiceMock.update.mock.calls[0]).toEqual(['booking-1', { status: 'cancelled' }]);
  });
});
