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

const authCopy: Record<AuthMode, { title: string; description: string; submit: string; busy: string }> = {
  login: {
    title: 'Ingresa a tu operacion',
    description: 'Accede con tus credenciales para continuar con tu dashboard personalizado.',
    submit: 'Iniciar sesion',
    busy: 'Ingresando...',
  },
  register: {
    title: 'Crea tu cuenta',
    description: 'Registra tu perfil como cliente o profesional para empezar a operar en ArreglaYa.',
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
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <BrandShowcase />

        <Card className="flex flex-col justify-between bg-white/95">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-600">Acceso</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{copy.title}</h1>
            <p className="mt-3 text-sm text-slate-600">{copy.description}</p>

            <div className="mt-6 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1">
              <button
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === 'login'
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                type="button"
                onClick={() => selectMode('login')}
              >
                Tengo cuenta
              </button>
              <button
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === 'register'
                    ? 'bg-white text-brand-700 shadow-sm'
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
            <form className="mt-8 space-y-4" onSubmit={(event) => void onLoginSubmit(event)}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <Input
                  placeholder="nombre@arreglaya.com"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register('email')}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Contraseña</span>
                <Input
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register('password')}
                />
              </label>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <Button className="w-full" type="submit" disabled={loginForm.formState.isSubmitting}>
                {loginForm.formState.isSubmitting ? copy.busy : copy.submit}
              </Button>
            </form>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={(event) => void onRegisterSubmit(event)}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Nombre completo</span>
                <Input
                  placeholder="Nombre y apellido"
                  error={registerForm.formState.errors.fullName?.message}
                  {...registerForm.register('fullName')}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <Input
                  placeholder="nombre@arreglaya.com"
                  error={registerForm.formState.errors.email?.message}
                  {...registerForm.register('email')}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Contraseña</span>
                <Input
                  type="password"
                  placeholder="Crea una contraseña segura"
                  error={registerForm.formState.errors.password?.message}
                  {...registerForm.register('password')}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Tipo de cuenta</span>
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

              <Button className="w-full" type="submit" disabled={registerForm.formState.isSubmitting}>
                {registerForm.formState.isSubmitting ? copy.busy : copy.submit}
              </Button>
            </form>
          )}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Configuracion actual</p>
            <p className="mt-2 text-sm text-slate-600">
              API: <code>{env.apiUrl}</code>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Dev auth: <code>{env.enableDevAuth ? 'habilitado' : 'deshabilitado'}</code>
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Usuarios seed del backend</p>
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
                <p className="font-semibold text-slate-800">Fallback local habilitado</p>
                <p>Si la API falla, login y registro pueden entrar en modo demo.</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Si quieres un fallback sin backend, activa <code>VITE_ENABLE_DEV_AUTH=true</code>.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
