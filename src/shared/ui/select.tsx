import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = ({ className, error, children, ...props }: SelectProps) => (
  <div className="space-y-1.5">
    <select
      className={cn(
        'w-full rounded-2xl border px-4 py-3 outline-none transition',
        error
          ? 'border-red-300 bg-red-50 text-red-900'
          : 'border-slate-200 bg-white text-slate-900 focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    {error ? <p className="text-sm text-red-600">{error}</p> : null}
  </div>
);
