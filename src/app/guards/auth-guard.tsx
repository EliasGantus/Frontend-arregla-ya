import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';

export const AuthGuard = () => {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="grid min-h-screen place-items-center bg-mist px-6">
        <div className="rounded-full border border-brand-100 bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-sm">
          Inicializando ArreglaYa...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
