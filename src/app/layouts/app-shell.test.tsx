import { render, screen } from '@testing-library/react';
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

  it('oculta administración para profesionales', () => {
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
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<p>Home</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Administración')).not.toBeInTheDocument();
    expect(screen.getByText('Cotizaciones')).toBeInTheDocument();
  });
});
