import { fireEvent, render, waitFor } from '@testing-library/react';

import { AuthProvider, useAuth } from '@/features/auth/context/auth-context';

const Probe = () => {
  const auth = useAuth();

  return (
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

    const { getByRole } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    fireEvent.click(getByRole('button'));

    await waitFor(() =>
      expect(window.localStorage.getItem('arreglaya.session')).toContain('cliente@arreglaya.com'),
    );
  });
});
