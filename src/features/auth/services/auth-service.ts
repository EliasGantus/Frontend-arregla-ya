import { env } from '@/shared/config/env';
import { ApiError } from '@/shared/api/api-error';
import { httpClient } from '@/shared/api/http-client';
import type { AuthUser, LoginInput, RefreshInput, SessionPayload, UserRole } from '@/shared/types/api';

interface LoginResponse extends SessionPayload {}

const demoUsers: Record<UserRole, AuthUser> = {
  cliente: {
    id: 'demo-client',
    email: 'cliente@arreglaya.com',
    fullName: 'Lucia Benitez',
    role: 'cliente',
    city: 'Buenos Aires',
    zone: 'Caballito',
  },
  profesional: {
    id: 'demo-pro',
    email: 'profesional@arreglaya.com',
    fullName: 'Carlos Mendoza',
    role: 'profesional',
    city: 'Buenos Aires',
    zone: 'Almagro',
  },
  admin: {
    id: 'demo-admin',
    email: 'admin@arreglaya.com',
    fullName: 'Sofia Herrera',
    role: 'admin',
    city: 'Buenos Aires',
    zone: 'Centro',
  },
};

const toDemoPayload = (role: UserRole): SessionPayload => ({
  user: demoUsers[role],
  accessToken: `demo-access-${role}`,
  refreshToken: `demo-refresh-${role}`,
});

const resolveRole = (email: string): UserRole => {
  if (email.includes('admin')) {
    return 'admin';
  }
  if (email.includes('pro')) {
    return 'profesional';
  }
  return 'cliente';
};

const maybeLoginWithDevMode = (credentials: LoginInput) => {
  if (!env.enableDevAuth) {
    return null;
  }

  const role = resolveRole(credentials.email);
  return Promise.resolve(toDemoPayload(role));
};

export const authService = {
  async login(credentials: LoginInput) {
    try {
      return await httpClient.post<LoginResponse>('/auth/login', credentials, { auth: false });
    } catch (error) {
      const demoSession = maybeLoginWithDevMode(credentials);
      if (demoSession) {
        return demoSession;
      }
      throw error;
    }
  },
  refreshTokens(payload: RefreshInput) {
    return httpClient.post<{ accessToken: string; refreshToken?: string }>(
      '/auth/refresh',
      payload,
      { auth: false, retry: false },
    );
  },
  me() {
    return httpClient.get<AuthUser>('/me');
  },
  async logout(refreshToken: string | null) {
    if (!refreshToken) {
      return;
    }

    try {
      await httpClient.post('/auth/logout', { refreshToken }, { auth: false, retry: false });
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        return;
      }

      throw error;
    }
  },
};
