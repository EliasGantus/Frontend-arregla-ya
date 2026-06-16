import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/features/auth/context/auth-context';
import { ProfilePage } from '@/features/profile/pages/profile-page';
import { profileService } from '@/features/profile/services/profile-service';
import { categoriesService } from '@/features/service-requests/services/categories-service';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/profile/services/profile-service', () => ({
  profileService: {
    me: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/features/service-requests/services/categories-service', () => ({
  categoriesService: {
    list: vi.fn(),
  },
}));

const useAuthMock = vi.mocked(useAuth);
const profileServiceMock = vi.mocked(profileService);
const categoriesServiceMock = vi.mocked(categoriesService);

const clientUser = {
  id: 'client-1',
  email: 'cliente@arreglaya.com',
  fullName: 'Lucia Benitez',
  role: 'cliente' as const,
  city: 'Buenos Aires',
  zone: 'Caballito',
};

const professionalUser = {
  id: 'pro-1',
  email: 'profesional@arreglaya.com',
  fullName: 'Carlos Mendoza',
  role: 'profesional' as const,
  city: 'Buenos Aires',
  zone: 'Almagro',
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
      <ProfilePage />
    </TestProviders>,
  );

const mockAuth = (
  user: typeof clientUser | typeof professionalUser,
  overrides: Partial<ReturnType<typeof useAuth>> = {},
) => {
  useAuthMock.mockReturnValue({
    user,
    accessToken: 'token',
    refreshToken: 'refresh',
    isAuthenticated: true,
    isBootstrapping: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    ...overrides,
  });
};

describe('ProfilePage', () => {
  beforeEach(() => {
    categoriesServiceMock.list.mockResolvedValue([
      { id: 'cat-plom', name: 'Plomeria', slug: 'plomeria' },
      { id: 'cat-elec', name: 'Electricidad', slug: 'electricidad' },
    ]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('actualiza datos personales de un cliente y refleja los cambios', async () => {
    mockAuth(clientUser);
    profileServiceMock.me.mockResolvedValue(clientUser);
    profileServiceMock.update.mockResolvedValue({
      ...clientUser,
      fullName: 'Lucia Fernandez',
      city: 'Buenos Aires',
      zone: 'Palermo',
    });

    renderPage();

    await screen.findByDisplayValue('Lucia Benitez');
    const zoneSelect = screen.getByRole('combobox', { name: 'Zona' });

    expect(zoneSelect).toHaveDisplayValue('Caballito');
    expect(screen.queryByRole('textbox', { name: 'Zona' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Palermo' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nombre completo'), {
      target: { value: 'Lucia Fernandez' },
    });
    fireEvent.change(screen.getByLabelText('Telefono'), {
      target: { value: '11 5555 5555' },
    });
    fireEvent.change(screen.getByLabelText('Zona'), {
      target: { value: 'Palermo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByText(
        'Perfil actualizado. Los cambios ya se reflejan en esta cuenta.',
      ),
    ).toBeInTheDocument();
    expect(profileServiceMock.update.mock.calls[0]?.[0]).toEqual({
      fullName: 'Lucia Fernandez',
      city: 'Buenos Aires',
      zone: 'Palermo',
    });
    expect(screen.getAllByText('Lucia Fernandez').length).toBeGreaterThan(0);
    expect(screen.getAllByText('11 5555 5555').length).toBeGreaterThan(0);
  });

  it('muestra el perfil cliente como pantalla utilitaria mobile', async () => {
    mockAuth(clientUser);
    profileServiceMock.me.mockResolvedValue(clientUser);

    renderPage();

    expect(await screen.findByText('Lucia Benitez')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar perfil' })).toHaveAttribute(
      'href',
      '#editar-perfil',
    );
    expect(
      screen.getByRole('button', { name: 'Cerrar sesion' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Profesional')).not.toBeInTheDocument();
  });

  it('muestra validaciones cuando faltan campos obligatorios', async () => {
    mockAuth(clientUser);
    profileServiceMock.me.mockResolvedValue(clientUser);

    renderPage();

    await screen.findByDisplayValue('Lucia Benitez');
    fireEvent.change(screen.getByLabelText('Nombre completo'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('Telefono'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByText('Ingresa un nombre válido.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Ingresa un telefono válido.')).toBeInTheDocument();
    expect(profileServiceMock.update.mock.calls).toHaveLength(0);
  });

  it('permite configurar especialidades, disponibilidad y trabajos para profesionales', async () => {
    mockAuth(professionalUser);
    profileServiceMock.me.mockResolvedValue(professionalUser);
    profileServiceMock.update.mockResolvedValue({
      ...professionalUser,
      fullName: 'Carlos Mendoza',
      city: 'Buenos Aires',
      zone: 'Villa Crespo',
    });

    renderPage();

    await screen.findByDisplayValue('Carlos Mendoza');
    await screen.findByText('Plomeria');
    expect(screen.getByRole('combobox', { name: 'Zona' })).toHaveDisplayValue(
      'Almagro',
    );
    fireEvent.change(screen.getByLabelText('Telefono'), {
      target: { value: '11 4444 4444' },
    });
    fireEvent.change(screen.getByLabelText('Zona'), {
      target: { value: 'Villa Crespo' },
    });
    fireEvent.click(screen.getByLabelText('Plomeria'));
    fireEvent.change(screen.getByLabelText('Fotos de trabajos realizados'), {
      target: { value: 'https://example.com/trabajo.jpg' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByText(
        'Perfil actualizado. Los cambios ya se reflejan en esta cuenta.',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Plomeria').length).toBeGreaterThan(0);
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByAltText('Trabajo realizado')).toHaveAttribute(
      'src',
      'https://example.com/trabajo.jpg',
    );
  });

  it('permite cerrar sesion desde la vista mobile del perfil', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    mockAuth(clientUser, { logout });
    profileServiceMock.me.mockResolvedValue(clientUser);

    renderPage();

    await screen.findByDisplayValue('Lucia Benitez');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesion' }));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
