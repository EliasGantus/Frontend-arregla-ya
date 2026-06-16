import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/features/auth/context/auth-context';
import { EmergenciesPage } from '@/features/emergencies/pages/emergencies-page';
import { emergenciesService } from '@/features/emergencies/services/emergencies-service';
import { professionalsService } from '@/features/professionals/services/professionals-service';
import { categoriesService } from '@/features/service-requests/services/categories-service';

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
  },
}));

vi.mock('@/features/emergencies/services/emergencies-service', () => ({
  emergenciesService: {
    create: vi.fn(),
  },
}));

const useAuthMock = vi.mocked(useAuth);
const categoriesServiceMock = vi.mocked(categoriesService);
const professionalsServiceMock = vi.mocked(professionalsService);
const emergenciesServiceMock = vi.mocked(emergenciesService);

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
      <EmergenciesPage />
    </TestProviders>,
  );

describe('EmergenciesPage', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: {
        id: 'client-1',
        email: 'cliente@arreglaya.com',
        fullName: 'Cliente Demo',
        role: 'cliente',
        city: 'Buenos Aires',
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
    ]);
    professionalsServiceMock.search.mockResolvedValue([
      {
        id: 'pro-1',
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
    ]);
    emergenciesServiceMock.create.mockResolvedValue({
      serviceRequest: {
        id: 'request-1',
        title: 'Caneria rota',
        description: 'Hay agua saliendo debajo de la mesada',
        status: 'assigned',
        category: { id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' },
        city: 'Buenos Aires',
        zone: 'Palermo',
        photos: [],
        statusLabel: 'Reserva en curso',
        statusDescription: 'Ya hay un profesional asignado a esta solicitud.',
        availableActions: [],
        nextStep: {
          action: null,
          label: 'Seguir reserva',
          description: 'Revisa el estado desde tus reservas.',
          path: '/app/reservas',
        },
        createdAt: '2026-05-28T12:00:00.000Z',
      },
      booking: {
        id: 'booking-1',
        serviceRequestId: 'request-1',
        serviceRequestTitle: 'Caneria rota',
        clientId: 'client-1',
        clientName: 'Cliente Demo',
        professionalId: 'pro-1',
        professionalName: 'Ana Ruiz',
        scheduledAt: '2026-05-28T12:00:00.000Z',
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
        createdAt: '2026-05-28T12:00:00.000Z',
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('busca profesionales disponibles y permite solicitar una emergencia inmediata', async () => {
    renderPage();

    await screen.findByRole('option', { name: 'Plomeria' });
    const zoneSelect = screen.getByRole('combobox', { name: 'Zona' });

    expect(zoneSelect).toHaveDisplayValue('Palermo');
    expect(screen.queryByRole('textbox', { name: 'Zona' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Villa Crespo' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Tipo de emergencia'), {
      target: { value: 'cat-plom' },
    });
    fireEvent.change(screen.getByLabelText('Titulo'), {
      target: { value: 'Caneria rota' },
    });
    fireEvent.change(screen.getByLabelText('Detalle urgente'), {
      target: { value: 'Hay agua saliendo debajo de la mesada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Solicitud de emergencia' }));

    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar ahora' }));

    expect(await screen.findByText('Solicitud de emergencia creada. Recibiras una notificacion de confirmacion.')).toBeInTheDocument();
    expect(emergenciesServiceMock.create.mock.calls[0]?.[0]).toMatchObject({
      title: 'Caneria rota',
      categoryId: 'cat-plom',
      city: 'Buenos Aires',
      zone: 'Palermo',
    });
  });

  it('ofrece agendar cuando no hay disponibilidad inmediata', async () => {
    professionalsServiceMock.search.mockResolvedValue([]);
    renderPage();

    await screen.findByRole('option', { name: 'Plomeria' });
    fireEvent.change(screen.getByLabelText('Tipo de emergencia'), {
      target: { value: 'cat-plom' },
    });
    fireEvent.change(screen.getByLabelText('Titulo'), {
      target: { value: 'Corte de luz' },
    });
    fireEvent.change(screen.getByLabelText('Detalle urgente'), {
      target: { value: 'No hay energia en toda la casa' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Solicitud de emergencia' }));

    expect(await screen.findByText('No hay profesionales disponibles en este momento.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Proxima fecha'), {
      target: { value: '2026-05-30' },
    });
    fireEvent.change(screen.getByLabelText('Horario'), {
      target: { value: '09:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Agendar proximo horario' }));

    expect(await screen.findByText('Solicitud de emergencia creada. Recibiras una notificacion de confirmacion.')).toBeInTheDocument();
  });
});
