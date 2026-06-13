import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { ServiceRequestsPage } from '@/features/service-requests/pages/service-requests-page';
import { categoriesService } from '@/features/service-requests/services/categories-service';
import { serviceRequestsService } from '@/features/service-requests/services/service-requests-service';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/service-requests/services/categories-service', () => ({
  categoriesService: {
    list: vi.fn(),
  },
}));

vi.mock('@/features/service-requests/services/service-requests-service', () => ({
  serviceRequestsService: {
    list: vi.fn(),
    create: vi.fn(),
  },
}));

const useAuthMock = vi.mocked(useAuth);
const categoriesServiceMock = vi.mocked(categoriesService);
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
      <MemoryRouter initialEntries={['/app/solicitudes']}>
        <Routes>
          <Route path="/app/solicitudes" element={<ServiceRequestsPage />} />
        </Routes>
      </MemoryRouter>
    </TestProviders>,
  );

describe('ServiceRequestsPage', () => {
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
    categoriesServiceMock.list.mockResolvedValue([
      { id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' },
    ]);
    serviceRequestsServiceMock.create.mockResolvedValue({
      id: 'request-new',
      title: 'Nueva solicitud',
      description: 'Nueva solicitud',
      status: 'open',
      statusLabel: 'Abierta',
      statusDescription: 'La solicitud esta publicada.',
      availableActions: [],
      nextStep: {
        action: null,
        label: 'Esperar cotizaciones',
        description: 'Los profesionales pueden enviar propuestas.',
      },
      category: { id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' },
      city: 'Buenos Aires',
      zone: 'Palermo',
      photos: [],
      createdAt: '2026-05-29T12:00:00.000Z',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('muestra solicitudes cliente con proximo paso visible', async () => {
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

    renderPage();

    expect(await screen.findByText('Arreglo de canilla')).toBeInTheDocument();
    expect(await screen.findByText('Comparar cotizaciones')).toBeInTheDocument();
    expect(
      screen.getByText('Acepta una propuesta para coordinar fecha y horario.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver detalle' })).toHaveAttribute(
      'href',
      '/app/solicitudes/request-1',
    );
  });

  it('muestra accion concreta cuando el cliente no tiene solicitudes', async () => {
    serviceRequestsServiceMock.list.mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText('Todavia no tenes solicitudes'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Crear una solicitud' }),
    ).toHaveAttribute('href', '#nueva-solicitud');
  });
});
