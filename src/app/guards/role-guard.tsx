import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import type { UserRole } from '@/shared/types/api';

interface RoleGuardProps {
  allow: UserRole[];
}

export const RoleGuard = ({ allow }: RoleGuardProps) => {
  const { user } = useAuth();

  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};
