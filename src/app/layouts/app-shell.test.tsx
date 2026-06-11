import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/app/layouts/app-shell';
import { useAuth } from '@/features/auth/context/auth-context';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);

describe('AppShell', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('oculta administracion para profesionales', () => {
    useAuthMock.mockReturnValue({
      user: {
        id: '2',
        email: 'pro@arreglaya.com',
        fullName: 'Pro Demo',
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

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<p>Home</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole('link', { name: 'Administracion' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Cotizaciones' }).length,
    ).toBeGreaterThan(0);
  });

  it('prioriza la navegacion mobile del cliente sin mostrar rutas secundarias', () => {
    useAuthMock.mockReturnValue({
      user: {
        id: '1',
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

    render(
      <MemoryRouter initialEntries={['/app/solicitudes/request-1']}>
        <Routes>
          <Route path="/app" element={<AppShell />}>
            <Route path="solicitudes/:requestId" element={<p>Detalle</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const mobileNav = screen.getByLabelText('Navegacion principal mobile');
    const mobileHeader = screen
      .getAllByRole('banner')
      .find((header) => within(header).queryByText('Cliente Demo'));

    if (!mobileHeader) {
      throw new Error('No se encontro el header mobile');
    }

    expect(within(mobileHeader).getByText('Solicitudes')).toBeInTheDocument();
    expect(
      within(mobileNav).getAllByRole('link', { name: /Inicio/ }),
    ).not.toHaveLength(0);
    expect(
      within(mobileNav).getAllByRole('link', { name: /Solicitudes/ }),
    ).not.toHaveLength(0);
    expect(
      within(mobileNav).getAllByRole('link', { name: /Reservas/ }),
    ).not.toHaveLength(0);
    expect(
      within(mobileNav).getAllByRole('link', { name: /Perfil/ }),
    ).not.toHaveLength(0);
    expect(
      within(mobileNav).queryByRole('link', { name: 'Cotizaciones' }),
    ).not.toBeInTheDocument();
  });
});
