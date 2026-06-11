import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

export interface FlowProgressStep {
  key: string;
  label: string;
  description?: string;
  state: 'done' | 'current' | 'upcoming';
}

interface FlowProgressProps extends HTMLAttributes<HTMLOListElement> {
  steps: FlowProgressStep[];
}

const stateCopy: Record<FlowProgressStep['state'], string> = {
  done: 'Completado',
  current: 'Actual',
  upcoming: 'Pendiente',
};

export const FlowProgress = ({
  className,
  steps,
  ...props
}: FlowProgressProps) => (
  <ol
    className={cn(
      'grid gap-3 rounded-[28px] bg-white p-4 shadow-lg shadow-slate-200/70 sm:grid-cols-2 md:rounded-3xl md:p-5 lg:grid-cols-4',
      className,
    )}
    {...props}
  >
    {steps.map((step, index) => (
      <li
        aria-current={step.state === 'current' ? 'step' : undefined}
        className={cn(
          'flex min-w-0 items-start gap-3 rounded-2xl border p-3',
          step.state === 'done' && 'border-emerald-100 bg-emerald-50',
          step.state === 'current' && 'border-accent-200 bg-accent-50',
          step.state === 'upcoming' && 'border-slate-100 bg-slate-50',
        )}
        key={step.key}
      >
        <span
          className={cn(
            'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black',
            step.state === 'done' && 'bg-emerald-100 text-emerald-700',
            step.state === 'current' && 'bg-accent-500 text-white',
            step.state === 'upcoming' && 'bg-white text-slate-400',
          )}
        >
          {index + 1}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              'block text-[11px] font-semibold uppercase tracking-[0.12em]',
              step.state === 'done' && 'text-emerald-700',
              step.state === 'current' && 'text-accent-700',
              step.state === 'upcoming' && 'text-slate-400',
            )}
          >
            {stateCopy[step.state]}
          </span>
          <span className="mt-1 block text-sm font-bold leading-tight text-slate-950">
            {step.label}
          </span>
          {step.description ? (
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              {step.description}
            </span>
          ) : null}
        </span>
      </li>
    ))}
  </ol>
);
