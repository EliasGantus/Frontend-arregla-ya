import { Badge } from '@/shared/ui/badge';

const highlights = [
  'Solicitud y cotización por oficio',
  'Clientes, profesionales y administradores',
  'Preparado para API real y roles',
];

export const BrandShowcase = () => (
  <section className="relative overflow-hidden rounded-[32px] bg-slate-950 p-8 text-white shadow-glow">
    <div className="absolute inset-0 bg-hero-grid bg-[size:32px_32px] opacity-10" />
    <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-accent-500/35 blur-3xl" />
    <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl" />

    <div className="relative">
      <Badge className="bg-white/10 text-accent-200">Soluciones a tu alcance</Badge>
      <div className="mt-6 flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-[26px] bg-gradient-to-br from-accent-400 via-accent-500 to-brand-700 text-center shadow-lg shadow-black/30">
          <span className="text-lg font-black uppercase tracking-[0.35em] text-white">AY</span>
        </div>
        <div>
          <p className="font-display text-4xl font-black tracking-tight">
            <span className="text-brand-300">Arregla</span>
            <span className="text-accent-400">Ya</span>
          </p>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Marketplace de oficios</p>
        </div>
      </div>

      <p className="mt-8 max-w-xl text-lg text-slate-200">
        Una base frontend preparada para conectar clientes con profesionales confiables, con foco en velocidad,
        claridad y crecimiento ordenado.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {highlights.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-200">{item}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
