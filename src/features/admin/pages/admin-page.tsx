import { useQuery } from '@tanstack/react-query';

import { adminService } from '@/features/admin/services/admin-service';
import { ApiError } from '@/shared/api/api-error';
import { Card } from '@/shared/ui/card';
import { StatusPanel } from '@/shared/ui/status-panel';

const adminCards = [
  {
    label: 'Usuarios',
    description: 'Listado, moderación, bloqueos y validación de profesionales.',
  },
  {
    label: 'Solicitudes',
    description: 'Supervisión global del marketplace y soporte operativo.',
  },
  {
    label: 'Observabilidad',
    description: 'Lugar natural para métricas, alertas y estados del backend futuro.',
  },
];

export const AdminPage = () => <AdminContent />;

const AdminContent = () => {
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminService.users,
  });
  const serviceRequestsQuery = useQuery({
    queryKey: ['admin', 'service-requests'],
    queryFn: adminService.serviceRequests,
  });

  return (
    <div className="space-y-6">
      <StatusPanel
        eyebrow="Admin"
        title="Zona reservada para administración"
        description="La ruta ya está protegida por rol. Solo administradores pueden navegar este módulo en la base actual."
      />

      {usersQuery.error instanceof ApiError || serviceRequestsQuery.error instanceof ApiError ? (
        <Card className="border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">Panel en modo desacoplado</p>
          <p className="mt-2 text-sm text-amber-700">
            {(usersQuery.error instanceof ApiError && usersQuery.error.message) ||
              (serviceRequestsQuery.error instanceof ApiError && serviceRequestsQuery.error.message)}
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {adminCards.map((card) => (
          <Card key={card.label}>
            <p className="text-lg font-bold text-slate-950">{card.label}</p>
            <p className="mt-3 text-sm text-slate-600">{card.description}</p>
            <p className="mt-4 text-sm font-semibold text-brand-700">
              {card.label === 'Usuarios' && usersQuery.data
                ? `${usersQuery.data.length} usuarios listos para administrar.`
                : card.label === 'Solicitudes' && serviceRequestsQuery.data
                  ? `${serviceRequestsQuery.data.length} solicitudes visibles.`
                  : 'Esperando datos reales.'}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-xl font-bold text-slate-950">Usuarios</h2>
        <div className="mt-4 grid gap-3">
          {(usersQuery.data ?? []).map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="font-semibold text-slate-900">{user.fullName}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <p className="mt-2 text-sm text-brand-700">Rol: {user.role}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-slate-950">Solicitudes globales</h2>
        <div className="mt-4 grid gap-3">
          {(serviceRequestsQuery.data ?? []).map((request) => (
            <div key={request.id} className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="font-semibold text-slate-900">{request.title}</p>
              <p className="text-sm text-slate-500">
                {request.category.name} · {request.city} / {request.zone}
              </p>
              <p className="mt-2 text-sm text-brand-700">Estado: {request.status}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
