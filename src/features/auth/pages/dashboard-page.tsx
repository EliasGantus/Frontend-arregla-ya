import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/auth-context';
import { Card } from '@/shared/ui/card';
import { StatusPanel } from '@/shared/ui/status-panel';

const metricsByRole = {
  cliente: [
    { label: 'Solicitudes activas', value: '03' },
    { label: 'Profesionales cotizando', value: '12' },
    { label: 'Tiempo promedio', value: '2h' },
  ],
  profesional: [
    { label: 'Cotizaciones enviadas', value: '18' },
    { label: 'Trabajos asignados', value: '3' },
    { label: 'Tasa de exito', value: '31%' },
  ],
  admin: [
    { label: 'Usuarios activos', value: '284' },
    { label: 'Solicitudes abiertas', value: '124' },
    { label: 'Alertas pendientes', value: '06' },
  ],
};

const actionByRole: Record<string, { title: string; description: string; path: string }[]> = {
  cliente: [
    {
      title: 'Nueva solicitud',
      description: 'Publica lo que necesitas',
      path: '/app/solicitudes',
    },
  ],
  profesional: [
    {
      title: 'Buscar trabajos',
      description: 'Explora solicitudes abiertas',
      path: '/app/solicitudes',
    },
    {
      title: 'Mis cotizaciones',
      description: 'Seguimiento de propuestas',
      path: '/app/cotizaciones',
    },
  ],
  admin: [
    {
      title: 'Administrar plataforma',
      description: 'Revisa usuarios y solicitudes',
      path: '/app/admin',
    },
  ],
};

const introByRole = {
  cliente:
    'Revisa tus solicitudes, compara profesionales y avanza con el servicio que necesitas.',
  profesional:
    'Encuentra nuevas oportunidades de trabajo y envia cotizaciones a clientes activos.',
  admin:
    'Supervisa usuarios, solicitudes y actividad operativa desde el panel central.',
};

const getFirstName = (name: string | undefined) =>
  name?.split(' ').filter(Boolean)[0] ?? 'usuario';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? 'cliente';
  const metrics = metricsByRole[role];
  const actions = actionByRole[role];

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="md:hidden">
        <Card className="!bg-[#07152a] text-white shadow-lg shadow-slate-900/20">
          <p className="text-2xl font-black">
            Hola, {getFirstName(user?.fullName)}
          </p>
          <p className="mt-2 text-sm text-slate-300">{introByRole[role]}</p>
        </Card>
      </div>

      <div className="hidden md:block">
        <StatusPanel
          eyebrow="Panel base"
          title="Arquitectura lista para crecer"
          description="Este panel actua como home privada. Desde aqui cuelgan rutas protegidas, sesion persistente y navegacion por rol."
        />
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="rounded-2xl p-4 text-center md:rounded-3xl md:text-left"
          >
            <p className="text-xs font-semibold text-slate-400 md:text-sm md:text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:mt-3 md:text-4xl">
              {metric.value}
            </p>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Acciones rapidas
        </p>
        {actions.map((action) => (
          <button
            key={action.path}
            className="flex min-h-20 w-full items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 text-left shadow-xl shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-2xl"
            onClick={() => void navigate(action.path)}
            type="button"
          >
            <span>
              <span className="block font-bold text-slate-950">
                {action.title}
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {action.description}
              </span>
            </span>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-accent-200 bg-accent-50 text-accent-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        ))}
      </section>
    </div>
  );
};
