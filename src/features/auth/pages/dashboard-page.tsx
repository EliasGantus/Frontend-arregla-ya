import { useAuth } from '@/features/auth/context/auth-context';
import { Card } from '@/shared/ui/card';
import { StatusPanel } from '@/shared/ui/status-panel';

const metricsByRole = {
  cliente: [
    { label: 'Solicitudes activas', value: '03' },
    { label: 'Profesionales cotizando', value: '12' },
    { label: 'Tiempo promedio estimado', value: '2h' },
  ],
  profesional: [
    { label: 'Cotizaciones enviadas', value: '18' },
    { label: 'Solicitudes abiertas', value: '42' },
    { label: 'Conversión semanal', value: '31%' },
  ],
  admin: [
    { label: 'Usuarios activos', value: '284' },
    { label: 'Solicitudes abiertas', value: '124' },
    { label: 'Alertas pendientes', value: '06' },
  ],
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const metrics = metricsByRole[user?.role ?? 'cliente'];

  return (
    <div className="space-y-6">
      <StatusPanel
        eyebrow="Panel base"
        title="Arquitectura lista para crecer"
        description="Este panel actúa como home privada. Desde aquí cuelgan rutas protegidas, sesión persistente y navegación por rol."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{metric.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
