import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { BrandShowcase } from '@/features/auth/components/brand-showcase';
import { useAuth } from '@/features/auth/context/auth-context';
import { ApiError } from '@/shared/api/api-error';
import { env } from '@/shared/config/env';
import { loginSchema, type LoginFormValues } from '@/shared/types/contracts';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

const seededUsers = [
  { role: 'Cliente', email: 'cliente@arreglaya.com' },
  { role: 'Profesional', email: 'pro@arreglaya.com' },
  { role: 'Admin', email: 'admin@arreglaya.com' },
];

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname || '/app';

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage('No pudimos iniciar sesión.');
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <BrandShowcase />

        <Card className="flex flex-col justify-between bg-white/95">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-600">Acceso</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Ingresa a tu operación</h1>
            <p className="mt-3 text-sm text-slate-600">
              Autenticación preparada para backend real con email y contraseña.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={(event) => void onSubmit(event)}>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <Input placeholder="nombre@arreglaya.com" error={errors.email?.message} {...register('email')} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Contraseña</span>
              <Input
                type="password"
                placeholder="Ingresa tu contraseña"
                error={errors.password?.message}
                {...register('password')}
              />
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Configuración actual</p>
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
              <p>Contraseña: <code>123456</code></p>
            </div>
            {env.enableDevAuth ? (
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Fallback local habilitado</p>
                <p>Si la API falla, el login puede entrar en modo demo según el email ingresado.</p>
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
