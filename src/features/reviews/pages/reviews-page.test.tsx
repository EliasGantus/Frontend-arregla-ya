import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { bookingsService } from '@/features/bookings/services/bookings-service';
import { professionalsService } from '@/features/professionals/services/professionals-service';
import { ReviewsPage } from '@/features/reviews/pages/reviews-page';
import { reviewsService } from '@/features/reviews/services/reviews-service';

vi.mock('@/features/bookings/services/bookings-service', () => ({
  bookingsService: {
    list: vi.fn(),
  },
}));

vi.mock('@/features/professionals/services/professionals-service', () => ({
  professionalsService: {
    reviews: vi.fn(),
  },
}));

vi.mock('@/features/reviews/services/reviews-service', () => ({
  reviewsService: {
    create: vi.fn(),
  },
}));

const bookingsServiceMock = vi.mocked(bookingsService);
const professionalsServiceMock = vi.mocked(professionalsService);
const reviewsServiceMock = vi.mocked(reviewsService);

const completedBooking = {
  id: 'booking-1',
  serviceRequestId: 'request-1',
  serviceRequestTitle: 'Cambio de termica',
  clientId: 'client-1',
  clientName: 'Cliente Demo',
  professionalId: 'pro-1',
  professionalName: 'Ana Ruiz',
  scheduledAt: '2026-05-30T13:30:00.000Z',
  status: 'completed' as const,
  statusLabel: 'Trabajo completado',
  statusDescription: 'El trabajo fue finalizado por el profesional.',
  availableActions: ['review' as const],
  nextStep: {
    action: 'review' as const,
    label: 'Calificar servicio',
    description: 'Deja tu resena para cerrar el flujo.',
  },
  hasPayment: true,
  hasReview: false,
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

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const renderPage = () =>
  render(
    <TestProviders>
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/app/calificaciones',
            state: { booking: completedBooking },
          },
        ]}
      >
        <ReviewsPage />
      </MemoryRouter>
    </TestProviders>,
  );

describe('ReviewsPage', () => {
  beforeEach(() => {
    bookingsServiceMock.list.mockResolvedValue([completedBooking]);
    professionalsServiceMock.reviews.mockResolvedValue([]);
    reviewsServiceMock.create.mockImplementation((payload) =>
      Promise.resolve({
        id: 'review-1',
        bookingId: 'booking-1',
        serviceRequestId: 'request-1',
        clientId: 'client-1',
        clientName: 'Cliente Demo',
        professionalId: 'pro-1',
        professionalName: 'Ana Ruiz',
        rating: payload.rating,
        comment: payload.comment,
        createdAt: '2026-05-30T14:00:00.000Z',
      }),
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('publica una resena para un servicio completado', async () => {
    renderPage();

    await screen.findByText('Cambio de termica');
    fireEvent.click(screen.getByRole('radio', { name: '5 estrellas' }));
    fireEvent.change(screen.getByLabelText('Comentario opcional'), {
      target: { value: 'Trabajo prolijo y puntual.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar resena' }));

    expect(
      await screen.findByText('Gracias por calificar el servicio'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Volver a reservas' }).length,
    ).toBeGreaterThan(0);
    expect(reviewsServiceMock.create.mock.calls[0]?.[0]).toEqual({
      bookingId: 'booking-1',
      rating: 5,
      comment: 'Trabajo prolijo y puntual.',
    });
  });

  it('permite enviar solo estrellas sin comentario', async () => {
    renderPage();

    await screen.findByText('Cambio de termica');
    fireEvent.click(screen.getByRole('radio', { name: '4 estrellas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar resena' }));

    expect(
      await screen.findByText('Gracias por calificar el servicio'),
    ).toBeInTheDocument();
    expect(reviewsServiceMock.create.mock.calls[0]?.[0]).toMatchObject({
      bookingId: 'booking-1',
      rating: 4,
    });
  });

  it('bloquea una nueva calificacion cuando la reserva ya tiene resena', async () => {
    professionalsServiceMock.reviews.mockResolvedValue([
      {
        id: 'review-1',
        bookingId: 'booking-1',
        serviceRequestId: 'request-1',
        clientId: 'client-1',
        clientName: 'Cliente Demo',
        professionalId: 'pro-1',
        professionalName: 'Ana Ruiz',
        rating: 5,
        createdAt: '2026-05-30T14:00:00.000Z',
      },
    ]);
    renderPage();

    expect(
      await screen.findByText('Gracias por calificar el servicio'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Enviar resena' }),
    ).toBeDisabled();
    expect(reviewsServiceMock.create.mock.calls).toHaveLength(0);
  });

  it('no ofrece reservas completadas que ya no tienen accion de calificar', async () => {
    bookingsServiceMock.list.mockResolvedValue([
      {
        ...completedBooking,
        hasReview: true,
        availableActions: [],
        nextStep: {
          action: null,
          label: 'Reserva cerrada',
          description: 'No hay acciones pendientes.',
        },
      },
    ]);
    renderPage();

    await waitFor(() =>
      expect(
        screen.queryByRole('option', {
          name: 'Cambio de termica - Ana Ruiz',
        }),
      ).not.toBeInTheDocument(),
    );
  });

  it('presenta estrellas grandes y comentario opcional para mobile', async () => {
    renderPage();

    await screen.findByText('Cambio de termica');
    expect(screen.getByRole('radio', { name: '5 estrellas' })).toHaveClass(
      'h-12',
    );
    expect(screen.getByLabelText('Comentario opcional')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Enviar resena' }),
    ).toBeInTheDocument();
  });
});
