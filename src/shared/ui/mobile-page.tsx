import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Card } from '@/shared/ui/card';

type MobilePageProps = HTMLAttributes<HTMLDivElement>;

type MobileHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
};

type MobileSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
};

type MobileStatsProps = {
  stats: Array<{
    label: string;
    value: ReactNode;
  }>;
  className?: string;
};

export const MobilePage = ({ className, ...props }: MobilePageProps) => (
  <div className={cn('space-y-4 pb-24 md:space-y-6 md:pb-0', className)} {...props} />
);

export const MobileHero = ({
  eyebrow,
  title,
  description,
  badge,
  action,
  className,
}: MobileHeroProps) => (
  <Card className={cn('md:hidden !bg-[#07152a] text-white', className)}>
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-cyan-100">{eyebrow}</p>
        {badge ? (
          <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-50">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold leading-tight">{title}</h1>
        <p className="text-sm leading-6 text-slate-200">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  </Card>
);

export const MobileSection = ({
  eyebrow,
  title,
  description,
  badge,
  action,
  children,
  className,
}: MobileSectionProps) => (
  <section className={cn('space-y-3', className)}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase text-cyan-700">{eyebrow}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          {badge ? (
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
              {badge}
            </span>
          ) : null}
        </div>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    {children}
  </section>
);

export const MobileStats = ({ stats, className }: MobileStatsProps) => (
  <div className={cn('grid grid-cols-2 gap-3', className)}>
    {stats.map((stat) => (
      <div key={stat.label} className="rounded-lg bg-white/80 p-3 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-medium text-slate-500">{stat.label}</p>
        <p className="mt-1 text-lg font-bold text-slate-950">{stat.value}</p>
      </div>
    ))}
  </div>
);
