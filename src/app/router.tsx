import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuthGuard } from '@/app/guards/auth-guard';
import { RoleGuard } from '@/app/guards/role-guard';
import { AppShell } from '@/app/layouts/app-shell';
import { NotFoundPage } from '@/app/not-found-page';
import { AdminPage } from '@/features/admin/pages/admin-page';
import { DashboardPage } from '@/features/auth/pages/dashboard-page';
import { LoginPage } from '@/features/auth/pages/login-page';
import { ProfilePage } from '@/features/profile/pages/profile-page';
import { QuotesPage } from '@/features/quotes/pages/quotes-page';
import { ServiceRequestsPage } from '@/features/service-requests/pages/service-requests-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'perfil',
            element: <ProfilePage />,
          },
          {
            path: 'solicitudes',
            element: <ServiceRequestsPage />,
          },
          {
            element: <RoleGuard allow={['profesional', 'admin']} />,
            children: [
              {
                path: 'cotizaciones',
                element: <QuotesPage />,
              },
            ],
          },
          {
            element: <RoleGuard allow={['admin']} />,
            children: [
              {
                path: 'admin',
                element: <AdminPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
