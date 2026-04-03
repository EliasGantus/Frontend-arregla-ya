import { Link } from 'react-router-dom';

import { Card } from '@/shared/ui/card';

export const NotFoundPage = () => (
  <div className="grid min-h-screen place-items-center bg-mist px-4">
    <Card className="max-w-xl text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-600">404</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Ruta no encontrada</h1>
      <p className="mt-4 text-sm text-slate-600">
        La navegación base está lista, pero esta URL no forma parte del shell inicial de ArreglaYa.
      </p>
      <Link
        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-glow"
        to="/app"
      >
        Volver al panel
      </Link>
    </Card>
  </div>
);
