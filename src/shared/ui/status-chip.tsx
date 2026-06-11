import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

const statusTones: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  open: 'bg-brand-50 text-brand-700',
  quoted: 'bg-accent-50 text-accent-700',
  assigned: 'bg-indigo-50 text-indigo-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
  pending: 'bg-accent-50 text-accent-700',
  confirmed: 'bg-brand-50 text-brand-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  withdrawn: 'bg-slate-100 text-slate-600',
  approved: 'bg-emerald-50 text-emerald-700',
  refunded: 'bg-slate-100 text-slate-600',
};

interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  status: string;
}

export const StatusChip = ({
  className,
  label,
  status,
  ...props
}: StatusChipProps) => (
  <span
    className={cn(
      'inline-flex max-w-full shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold leading-tight',
      statusTones[status.toLowerCase()] ?? 'bg-slate-100 text-slate-600',
      className,
    )}
    {...props}
  >
    {label}
  </span>
);
