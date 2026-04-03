import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { authService } from '@/features/auth/services/auth-service';
import { configureHttpClient } from '@/shared/api/http-client';
import { sessionStorageManager } from '@/shared/lib/storage';
import type { AuthUser, LoginInput, SessionPayload } from '@/shared/types/api';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (values: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const toState = (session: SessionPayload | null) => ({
  user: session?.user ?? null,
  accessToken: session?.accessToken ?? null,
  refreshToken: session?.refreshToken ?? null,
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState(() => toState(sessionStorageManager.load()));
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const persistSession = (payload: SessionPayload) => {
    sessionStorageManager.save(payload);
    startTransition(() => {
      setSession(toState(payload));
    });
  };

  const clearSession = () => {
    sessionStorageManager.clear();
    startTransition(() => {
      setSession(toState(null));
    });
  };

  useEffect(() => {
    configureHttpClient({
      getAccessToken: () => session.accessToken,
      refreshAccessToken: async () => {
        if (!session.refreshToken || !session.user) {
          return false;
        }

        try {
          const refreshed = await authService.refreshTokens({
            refreshToken: session.refreshToken,
          });

          persistSession({
            user: session.user!,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken ?? session.refreshToken,
          });

          return true;
        } catch {
          clearSession();
          return false;
        }
      },
      onUnauthorized: clearSession,
    });
    setIsBootstrapping(false);
  }, [session.accessToken, session.refreshToken, session.user]);

  const value: AuthContextValue = {
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    isAuthenticated: Boolean(session.user && session.accessToken),
    isBootstrapping,
    login: async (values) => {
      const payload = await authService.login(values);
      persistSession(payload);
    },
    logout: async () => {
      await authService.logout(session.refreshToken);
      clearSession();
    },
    updateUser: (user) => {
      if (!session.accessToken || !session.refreshToken) {
        return;
      }

      persistSession({
        user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
};
