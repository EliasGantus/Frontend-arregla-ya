import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/features/auth/context/auth-context';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (ui: ReactNode, queryClient = createTestQueryClient()) => ({
  queryClient,
  ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
});

const Probe = () => {
  const auth = useAuth();

  return (
    <>
      <button
        onClick={() =>
          void auth.login({
            email: 'cliente@arreglaya.com',
            password: '123456',
          })
        }
        type="button"
      >
        {auth.user?.email ?? 'sin-sesion'}
      </button>
      <button onClick={() => void auth.logout()} type="button">
        cerrar
      </button>
    </>
  );
};

describe('AuthProvider', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('persiste la sesión después del login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            accessToken: 'token',
            refreshToken: 'refresh',
            user: {
              id: '1',
              email: 'cliente@arreglaya.com',
              fullName: 'Cliente Demo',
              role: 'cliente',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    const { getByRole } = renderWithQueryClient(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    fireEvent.click(getByRole('button', { name: 'sin-sesion' }));

    await waitFor(() =>
      expect(window.localStorage.getItem('arreglaya.session')).toContain('cliente@arreglaya.com'),
    );
  });

  it('limpia la sesion local aunque el logout remoto falle', async () => {
    window.localStorage.setItem(
      'arreglaya.session',
      JSON.stringify({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: {
          id: '1',
          email: 'cliente@arreglaya.com',
          fullName: 'Cliente Demo',
          role: 'cliente',
        },
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'logout failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const { getByRole } = renderWithQueryClient(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    fireEvent.click(getByRole('button', { name: 'cerrar' }));

    await waitFor(() =>
      expect(window.localStorage.getItem('arreglaya.session')).toBeNull(),
    );
    await waitFor(() =>
      expect(getByRole('button', { name: 'sin-sesion' })).toBeInTheDocument(),
    );
  });

  it('limpia la cache privada al cerrar sesion', async () => {
    window.localStorage.setItem(
      'arreglaya.session',
      JSON.stringify({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: {
          id: '1',
          email: 'cliente@arreglaya.com',
          fullName: 'Cliente Demo',
          role: 'cliente',
        },
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 204,
        }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['profile', 'me'], {
      id: '1',
      email: 'cliente@arreglaya.com',
      fullName: 'Cliente Demo',
      role: 'cliente',
    });
    queryClient.setQueryData(['bookings'], [{ id: 'booking-1' }]);

    const { getByRole } = renderWithQueryClient(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
      queryClient,
    );

    fireEvent.click(getByRole('button', { name: 'cerrar' }));

    await waitFor(() => expect(queryClient.getQueryData(['profile', 'me'])).toBeUndefined());
    expect(queryClient.getQueryData(['bookings'])).toBeUndefined();
  });
});
