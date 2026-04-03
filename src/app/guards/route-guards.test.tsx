import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AuthGuard } from '@/app/guards/auth-guard';
import { RoleGuard } from '@/app/guards/role-guard';
import { useAuth } from '@/features/auth/context/auth-context';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);

describe('route guards', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('redirige al login cuando la sesión no existe', () => {
    useAuthMock.mockReturnValue({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/app" element={<p>Privado</p>} />
          </Route>
          <Route path="/login" element={<p>Login</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renderiza el contenido privado cuando la sesión está activa', () => {
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
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/app" element={<p>Privado</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Privado')).toBeInTheDocument();
  });

  it('bloquea rutas de admin para roles no permitidos', () => {
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
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app/admin']}>
        <Routes>
          <Route path="/app" element={<p>Panel</p>} />
          <Route element={<RoleGuard allow={['admin']} />}>
            <Route path="/app/admin" element={<p>Admin</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Panel')).toBeInTheDocument();
  });
});
