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
    update: vi.fn(),
  },
}));

vi.mock('@/features/service-requests/services/service-requests-service', () => ({
  serviceRequestsService: {
    list: vi.fn(),
  },
}));

const useAuthMock = vi.mocked(useAuth);
const bookingsServiceMock = vi.mocked(bookingsService);
const quotesServiceMock = vi.mocked(quotesService) as unknown as {
  listForRequest: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
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
        statusLabel: 'Cotizaciones recibidas',
        statusDescription: 'Revisa las propuestas y elige con quien avanzar.',
        availableActions: ['accept_quote'],
        nextStep: {
          action: 'accept_quote',
          label: 'Comparar cotizaciones',
          description: 'Acepta una propuesta para coordinar fecha y horario.',
        },
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
    quotesServiceMock.update.mockImplementation((quoteId: string, payload: { status: string }) =>
      Promise.resolve({
        id: quoteId,
        serviceRequestId: 'request-1',
        serviceRequestTitle: 'Arreglo de canilla',
        professionalId: 'pro-1',
        professionalName: 'Ana Ruiz',
        amount: '85000',
        status: payload.status,
        message: 'Puedo resolverlo durante la tarde.',
        createdAt: '2026-05-28T13:00:00.000Z',
      }),
    );
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
      notes: 'Coordinar acceso por porteria',
      createdAt: '2026-05-28T14:00:00.000Z',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('permite reservar una cotizacion recibida desde el detalle de solicitud', async () => {
    quotesServiceMock.listForRequest.mockResolvedValue([
      {
        id: 'quote-1',
        serviceRequestId: 'request-1',
        serviceRequestTitle: 'Arreglo de canilla',
        professionalId: 'pro-1',
        professionalName: 'Ana Ruiz',
        amount: '85000',
        status: 'accepted',
        message: 'Puedo resolverlo durante la tarde.',
        createdAt: '2026-05-28T13:00:00.000Z',
      },
    ]);
    renderPage();

    expect(await screen.findAllByText('Cotizaciones recibidas')).not.toHaveLength(0);
    expect(await screen.findByText('Comparar cotizaciones')).toBeInTheDocument();
    expect(
      screen.getByText('Acepta una propuesta para coordinar fecha y horario.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Reserva')).toBeInTheDocument();
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

  it('no permite reservar una cotizacion pendiente', async () => {
    renderPage();

    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reservar con Ana Ruiz' }),
    ).not.toBeInTheDocument();
  });

  it('oculta acciones de cotizacion cuando la solicitud no permite aceptarlas', async () => {
    serviceRequestsServiceMock.list.mockResolvedValue([
      {
        id: 'request-1',
        title: 'Arreglo de canilla',
        description: 'Pierde agua bajo mesada',
        status: 'cancelled',
        statusLabel: 'Cancelada',
        statusDescription: 'Esta solicitud fue cancelada.',
        availableActions: [],
        nextStep: {
          action: null,
          label: 'Solicitud cerrada',
          description: 'No hay acciones pendientes.',
        },
        category: { id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' },
        city: 'Buenos Aires',
        zone: 'Palermo',
        photos: [],
        createdAt: '2026-05-28T12:00:00.000Z',
      },
    ]);
    renderPage();

    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Aceptar cotizacion de Ana Ruiz',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Rechazar cotizacion de Ana Ruiz',
      }),
    ).not.toBeInTheDocument();
  });

  it('no permite reservar una cotizacion aceptada de una solicitud completada', async () => {
    serviceRequestsServiceMock.list.mockResolvedValue([
      {
        id: 'request-1',
        title: 'Arreglo de canilla',
        description: 'Pierde agua bajo mesada',
        status: 'completed',
        statusLabel: 'Trabajo completado',
        statusDescription: 'El trabajo fue marcado como finalizado.',
        availableActions: ['review'],
        nextStep: {
          action: 'review',
          label: 'Calificar servicio',
          description: 'Comparte tu experiencia con el profesional.',
        },
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
        status: 'accepted',
        message: 'Puedo resolverlo durante la tarde.',
        createdAt: '2026-05-28T13:00:00.000Z',
      },
    ]);
    renderPage();

    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reservar con Ana Ruiz' }),
    ).not.toBeInTheDocument();
  });

  it('permite aceptar una cotizacion recibida', async () => {
    renderPage();

    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Aceptar cotizacion de Ana Ruiz',
      }),
    );

    await waitFor(() =>
      expect(quotesServiceMock.update).toHaveBeenCalledWith('quote-1', {
        status: 'accepted',
      }),
    );
  });

  it('permite rechazar una cotizacion recibida', async () => {
    renderPage();

    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Rechazar cotizacion de Ana Ruiz',
      }),
    );

    await waitFor(() =>
      expect(quotesServiceMock.update).toHaveBeenCalledWith('quote-1', {
        status: 'rejected',
      }),
    );
  });
});
