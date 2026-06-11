import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';

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
        statusLabel: 'Pendiente de confirmacion',
        statusDescription: 'La reserva espera confirmacion del profesional.',
        availableActions: ['confirm_booking'],
        nextStep: {
          action: 'confirm_booking',
          label: 'Confirmar reserva',
          description: 'El profesional debe confirmar el turno.',
        },
        hasPayment: false,
        hasReview: false,
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
        <MemoryRouter>
          <BookingsPage />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(await screen.findByText('Arreglo de canilla')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));

    expect(await screen.findByText(/Reserva cancelada/)).toBeInTheDocument();
    expect(bookingsServiceMock.update.mock.calls[0]).toEqual(['booking-1', { status: 'cancelled' }]);
  });

  it('permite al profesional marcar un trabajo confirmado como terminado', async () => {
    useAuthMock.mockReturnValue({
      user: {
        id: 'pro-top',
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
        status: 'confirmed',
        statusLabel: 'Reserva confirmada',
        statusDescription: 'El turno esta confirmado y listo para avanzar.',
        availableActions: ['pay', 'complete_work'],
        nextStep: {
          action: 'pay',
          label: 'Pagar servicio',
          description: 'Completa el pago del servicio.',
        },
        hasPayment: false,
        hasReview: false,
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
      status: 'completed',
      statusLabel: 'Trabajo completado',
      statusDescription: 'El trabajo fue finalizado por el profesional.',
      availableActions: ['review'],
      nextStep: {
        action: 'review',
        label: 'Calificar servicio',
        description: 'Deja tu resena para cerrar el flujo.',
      },
      hasPayment: false,
      hasReview: false,
      notes: 'Trabajo terminado',
      createdAt: '2026-05-28T12:30:00.000Z',
    });

    render(
      <TestProviders>
        <MemoryRouter>
          <BookingsPage />
        </MemoryRouter>
      </TestProviders>,
    );

    expect(await screen.findByText('Arreglo de canilla')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar trabajo como terminado' }));

    expect(await screen.findByText(/Trabajo marcado como terminado/)).toBeInTheDocument();
    expect(bookingsServiceMock.update.mock.calls[0]).toEqual(['booking-1', { status: 'completed' }]);
  });
});
