import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { bookingsService } from '@/features/bookings/services/bookings-service';
import {
  ProfessionalBookingPage,
  ProfessionalProfilePage,
  ProfessionalsPage,
} from '@/features/professionals/pages/professionals-page';
import { professionalsService } from '@/features/professionals/services/professionals-service';
import { categoriesService } from '@/features/service-requests/services/categories-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';
import type { ProfessionalSearchResult } from '@/shared/types/api';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/service-requests/services/categories-service', () => ({
  categoriesService: {
    list: vi.fn(),
  },
}));

vi.mock('@/features/professionals/services/professionals-service', () => ({
  professionalsService: {
    search: vi.fn(),
    reviews: vi.fn(),
  },
}));

vi.mock('@/features/service-requests/services/service-requests-service', () => ({
  serviceRequestsService: {
    list: vi.fn(),
  },
}));

vi.mock('@/features/bookings/services/bookings-service', () => ({
  bookingsService: {
    create: vi.fn(),
  },
}));

const useAuthMock = vi.mocked(useAuth);
const categoriesServiceMock = vi.mocked(categoriesService);
const professionalsServiceMock = vi.mocked(professionalsService);
const serviceRequestsServiceMock = vi.mocked(serviceRequestsService);
const bookingsServiceMock = vi.mocked(bookingsService);

const professionals: ProfessionalSearchResult[] = [
  {
    id: 'pro-low',
    email: 'bruno@arreglaya.com',
    fullName: 'Bruno Vera',
    role: 'profesional',
    city: 'Buenos Aires',
    zone: 'Palermo',
    ratingAverage: 4.4,
    ratingCount: 18,
    available: true,
    specialties: [{ id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' }],
  },
  {
    id: 'pro-top',
    email: 'ana@arreglaya.com',
    fullName: 'Ana Ruiz',
    role: 'profesional',
    city: 'Buenos Aires',
    zone: 'Palermo',
    ratingAverage: 4.9,
    ratingCount: 32,
    available: true,
    specialties: [{ id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' }],
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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const renderSearch = () =>
  render(
    <TestProviders>
      <MemoryRouter initialEntries={['/app/profesionales']}>
        <Routes>
          <Route path="/app/profesionales" element={<ProfessionalsPage />} />
          <Route path="/app/profesionales/:professionalId" element={<ProfessionalProfilePage />} />
          <Route path="/app/profesionales/:professionalId/reservar" element={<ProfessionalBookingPage />} />
          <Route path="/app/solicitudes" element={<p>Solicitudes del cliente</p>} />
        </Routes>
      </MemoryRouter>
    </TestProviders>,
  );

const renderBooking = () =>
  render(
    <TestProviders>
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/app/profesionales/pro-top/reservar',
            state: { professional: professionals[1] },
          },
        ]}
      >
        <Routes>
          <Route path="/app/profesionales/:professionalId/reservar" element={<ProfessionalBookingPage />} />
        </Routes>
      </MemoryRouter>
    </TestProviders>,
  );

describe('ProfessionalsPage', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: {
        id: 'client-1',
        email: 'cliente@arreglaya.com',
        fullName: 'Cliente Demo',
        role: 'cliente',
        zone: 'Palermo',
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
    categoriesServiceMock.list.mockResolvedValue([
      { id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' },
      { id: 'cat-elec', name: 'Electricidad', slug: 'electricidad' },
    ]);
    professionalsServiceMock.search.mockResolvedValue(professionals);
    professionalsServiceMock.reviews.mockResolvedValue([]);
    serviceRequestsServiceMock.list.mockResolvedValue([
      {
        id: 'request-1',
        title: 'Arreglo de canilla',
        description: 'Pierde agua bajo mesada',
        status: 'open',
        category: { id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' },
        city: 'Buenos Aires',
        zone: 'Palermo',
        photos: [],
        statusLabel: 'Esperando cotizaciones',
        statusDescription: 'Tu solicitud esta publicada y disponible para profesionales.',
        availableActions: [],
        nextStep: {
          action: null,
          label: 'Esperar propuestas',
          description: 'Te avisaremos cuando llegue una cotizacion.',
        },
        createdAt: '2026-05-28T12:00:00.000Z',
      },
    ]);
    bookingsServiceMock.create.mockResolvedValue({
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
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('filtra profesionales por especialidad y zona y los ordena por puntaje', async () => {
    renderSearch();

    await screen.findByRole('option', { name: 'Plomeria' });
    const zoneSelect = screen.getByRole('combobox', { name: 'Zona' });

    expect(zoneSelect).toHaveDisplayValue('Palermo');
    expect(screen.queryByRole('textbox', { name: 'Zona' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Villa Crespo' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Especialidad'), {
      target: { value: 'cat-plom' },
    });
    fireEvent.change(screen.getByLabelText('Zona'), {
      target: { value: 'Palermo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar profesionales' }));

    await screen.findByText('Ana Ruiz');

    expect(professionalsServiceMock.search.mock.calls[0]?.[0]).toEqual({
      categoryId: 'cat-plom',
      zone: 'Palermo',
      availableAt: undefined,
    });
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Ana Ruiz',
      'Bruno Vera',
    ]);
  });

  it('muestra un estado vacio cuando no hay profesionales disponibles', async () => {
    professionalsServiceMock.search.mockResolvedValue([]);
    renderSearch();

    await screen.findByRole('option', { name: 'Plomeria' });
    fireEvent.change(screen.getByLabelText('Especialidad'), {
      target: { value: 'cat-plom' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar profesionales' }));

    expect(
      await screen.findByText('No encontramos profesionales disponibles para esos filtros.'),
    ).toBeInTheDocument();
  });

  it('permite entrar al perfil completo desde un resultado', async () => {
    professionalsServiceMock.reviews.mockResolvedValue([
      {
        id: 'review-1',
        bookingId: 'booking-1',
        serviceRequestId: 'request-1',
        clientId: 'client-2',
        clientName: 'Laura Perez',
        professionalId: 'pro-top',
        professionalName: 'Ana Ruiz',
        rating: 5,
        comment: 'Trabajo prolijo y puntual.',
        createdAt: '2026-05-27T12:00:00.000Z',
      },
    ]);
    renderSearch();

    await screen.findByRole('option', { name: 'Plomeria' });
    fireEvent.change(screen.getByLabelText('Especialidad'), {
      target: { value: 'cat-plom' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar profesionales' }));

    await screen.findByText('Ana Ruiz');
    fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Ana Ruiz' }));

    await waitFor(() => expect(screen.getByText('Perfil de Ana Ruiz')).toBeInTheDocument());
    expect(screen.getByText('Fotos de servicios recientes')).toBeInTheDocument();
    expect(await screen.findByText('Trabajo prolijo y puntual.')).toBeInTheDocument();
    expect(screen.getByText('5/5 estrellas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reservar' })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Ver solicitudes/ })[0]);

    expect(await screen.findByText('Solicitudes del cliente')).toBeInTheDocument();
    expect(bookingsServiceMock.create.mock.calls).toHaveLength(0);
  });

  it('bloquea la reserva directa cuando no hay solicitudes con cotizacion aceptada', async () => {
    renderBooking();

    expect(
      await screen.findByText(
        'Para reservar necesitas aceptar primero una cotizacion desde el detalle de la solicitud.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Arreglo de canilla - Buenos Aires / Palermo' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeDisabled();
    expect(bookingsServiceMock.create.mock.calls).toHaveLength(0);
  });
});
