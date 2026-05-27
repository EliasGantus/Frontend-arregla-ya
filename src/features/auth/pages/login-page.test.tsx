import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LoginPage } from '@/features/auth/pages/login-page';
import { useAuth } from '@/features/auth/context/auth-context';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);

describe('LoginPage', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('valida email y contraseña antes de enviar', async () => {
    useAuthMock.mockReturnValue({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesion' }));

    await waitFor(() => {
      expect(screen.getByText('Ingresa un email valido.')).toBeInTheDocument();
      expect(screen.getByText('La contraseña debe tener al menos 6 caracteres.')).toBeInTheDocument();
    });
  });

  it('envía el formulario cuando los datos son válidos', async () => {
    const loginSpy = vi.fn().mockResolvedValue(undefined);

    useAuthMock.mockReturnValue({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: loginSpy,
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('nombre@arreglaya.com'), {
      target: { value: 'cliente@arreglaya.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesion' }));

    await waitFor(() =>
      expect(loginSpy).toHaveBeenCalledWith({
        email: 'cliente@arreglaya.com',
        password: '123456',
      }),
    );
  });

  it('limpia la contraseÃ±a cuando el login falla', async () => {
    const loginSpy = vi.fn().mockRejectedValue(new Error('invalid'));

    useAuthMock.mockReturnValue({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: loginSpy,
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña');

    fireEvent.change(screen.getByPlaceholderText('nombre@arreglaya.com'), {
      target: { value: 'cliente@arreglaya.com' },
    });
    fireEvent.change(passwordInput, {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesion' }));

    await waitFor(() => {
      expect(screen.getByText('No pudimos iniciar sesion.')).toBeInTheDocument();
      expect(passwordInput).toHaveValue('');
    });
  });

  it('permite registrar cliente o profesional', async () => {
    const registerSpy = vi.fn().mockResolvedValue(undefined);

    useAuthMock.mockReturnValue({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: vi.fn(),
      register: registerSpy,
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LoginPage initialMode="register" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Nombre y apellido'), {
      target: { value: 'Jose Perez' },
    });
    fireEvent.change(screen.getByPlaceholderText('nombre@arreglaya.com'), {
      target: { value: 'jose@arreglaya.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Crea una contraseña segura'), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'profesional' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() =>
      expect(registerSpy).toHaveBeenCalledWith({
        fullName: 'Jose Perez',
        email: 'jose@arreglaya.com',
        password: '123456',
        role: 'profesional',
      }),
    );
  });
});
