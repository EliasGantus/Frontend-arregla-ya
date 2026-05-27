import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { ProfessionalProfilePage, ProfessionalsPage } from '@/features/professionals/pages/professionals-page';
import { professionalsService } from '@/features/professionals/services/professionals-service';
import { categoriesService } from '@/features/service-requests/services/categories-service';
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

const useAuthMock = vi.mocked(useAuth);
const categoriesServiceMock = vi.mocked(categoriesService);
const professionalsServiceMock = vi.mocked(professionalsService);

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
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('filtra profesionales por especialidad y zona y los ordena por puntaje', async () => {
    renderSearch();

    await screen.findByRole('option', { name: 'Plomeria' });
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
    expect(await screen.findByText('Trabajo prolijo y puntual.')).toBeInTheDocument();
  });
});
