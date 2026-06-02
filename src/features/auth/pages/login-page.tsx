import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { BrandShowcase } from '@/features/auth/components/brand-showcase';
import { useAuth } from '@/features/auth/context/auth-context';
import { ApiError } from '@/shared/api/api-error';
import { env } from '@/shared/config/env';
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from '@/shared/types/contracts';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

interface LoginPageProps {
  initialMode?: AuthMode;
}

type AuthMode = 'login' | 'register';

const seededUsers = [
  { role: 'Cliente', email: 'cliente@arreglaya.com' },
  { role: 'Profesional', email: 'pro@arreglaya.com' },
  { role: 'Admin', email: 'admin@arreglaya.com' },
];

const authCopy: Record<
  AuthMode,
  { title: string; description: string; submit: string; busy: string }
> = {
  login: {
    title: 'Ingresa a tu cuenta',
    description: 'Gestiona tus solicitudes y servicios desde ArreglaYa.',
    submit: 'Iniciar sesion',
    busy: 'Ingresando...',
  },
  register: {
    title: 'Crea tu cuenta',
    description:
      'Registra tu perfil como cliente o profesional para empezar a operar en ArreglaYa.',
    submit: 'Crear cuenta',
    busy: 'Creando cuenta...',
  },
};

export const LoginPage = ({ initialMode = 'login' }: LoginPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, register: registerUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotMessage, setShowForgotMessage] = useState(false);
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'cliente',
    },
  });

  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname || '/app';
  const copy = authCopy[mode];

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const selectMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
  };

  const onLoginSubmit = loginForm.handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      await login(values);
      void navigate(redirectTo, { replace: true });
    } catch (error) {
      loginForm.resetField('password');

      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage('No pudimos iniciar sesion.');
    }
  });

  const onRegisterSubmit = registerForm.handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      await registerUser(values);
      void navigate('/app', { replace: true });
    } catch (error) {
      registerForm.resetField('password');

      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage('No pudimos crear tu cuenta.');
    }
  });

  return (
    <div className="min-h-screen overflow-x-clip bg-[#07152a] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-500 text-lg font-black text-white">
            AY
          </div>
          <div>
            <p className="font-display text-xl font-black">
              <span className="text-white">Arregla</span>
              <span className="text-accent-400">Ya</span>
            </p>
            <p className="text-xs text-slate-300">Soluciones a tu alcance</p>
          </div>
        </div>

        <div className="hidden lg:block">
          <BrandShowcase />
        </div>

        <Card className="flex flex-col rounded-[28px] !bg-white p-5 shadow-2xl shadow-slate-950/30 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-600 sm:tracking-[0.35em]">
              Acceso
            </p>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {copy.title}
            </h1>
            <p className="mt-3 text-sm text-slate-600">{copy.description}</p>

            <div className="mt-6 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1">
              <button
                className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === 'login'
                    ? 'bg-white text-accent-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                type="button"
                onClick={() => selectMode('login')}
              >
                Tengo cuenta
              </button>
              <button
                className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === 'register'
                    ? 'bg-white text-accent-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                type="button"
                onClick={() => selectMode('register')}
              >
                Soy nuevo
              </button>
            </div>
          </div>

          {mode === 'login' ? (
            <form
              className="mt-8 space-y-4"
              onSubmit={(event) => void onLoginSubmit(event)}
            >
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Email
                </span>
                <Input
                  placeholder="nombre@arreglaya.com"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register('email')}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Contraseña
                </span>
                <Input
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register('password')}
                />
              </label>

              <div className="text-right">
                <button
                  type="button"
                  className="text-xs text-slate-400 transition hover:text-slate-600"
                  onClick={() => setShowForgotMessage((prev) => !prev)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
                {showForgotMessage ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Esta función no está disponible aún. Contactá al administrador.
                  </p>
                ) : null}
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <Button
                className="w-full"
                variant="secondary"
                type="submit"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting ? copy.busy : copy.submit}
              </Button>
            </form>
          ) : (
            <form
              className="mt-8 space-y-4"
              onSubmit={(event) => void onRegisterSubmit(event)}
            >
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Nombre completo
                </span>
                <Input
                  placeholder="Nombre y apellido"
                  error={registerForm.formState.errors.fullName?.message}
                  {...registerForm.register('fullName')}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Email
                </span>
                <Input
                  placeholder="nombre@arreglaya.com"
                  error={registerForm.formState.errors.email?.message}
                  {...registerForm.register('email')}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Contraseña
                </span>
                <Input
                  type="password"
                  placeholder="Crea una contraseña segura"
                  error={registerForm.formState.errors.password?.message}
                  {...registerForm.register('password')}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Tipo de cuenta
                </span>
                <Select
                  error={registerForm.formState.errors.role?.message}
                  {...registerForm.register('role')}
                >
                  <option value="cliente">Cliente</option>
                  <option value="profesional">Profesional</option>
                </Select>
              </label>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <Button
                className="w-full"
                variant="secondary"
                type="submit"
                disabled={registerForm.formState.isSubmitting}
              >
                {registerForm.formState.isSubmitting ? copy.busy : copy.submit}
              </Button>
            </form>
          )}

          <div className="mt-6 hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 md:block">
            <p className="text-sm font-semibold text-slate-900">
              Configuracion actual
            </p>
            <p className="mt-2 text-sm text-slate-600">
              API: <code>{env.apiUrl}</code>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Dev auth:{' '}
              <code>{env.enableDevAuth ? 'habilitado' : 'deshabilitado'}</code>
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">
                Usuarios seed del backend
              </p>
              {seededUsers.map((hint) => (
                <p key={hint.role}>
                  {hint.role}: <code>{hint.email}</code>
                </p>
              ))}
              <p>
                Contraseña: <code>123456</code>
              </p>
            </div>
            {env.enableDevAuth ? (
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">
                  Fallback local habilitado
                </p>
                <p>
                  Si la API falla, login y registro pueden entrar en modo demo.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Si quieres un fallback sin backend, activa{' '}
                <code>VITE_ENABLE_DEV_AUTH=true</code>.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
