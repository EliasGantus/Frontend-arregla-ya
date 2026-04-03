import type { InputHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = ({ className, error, ...props }: InputProps) => (
  <div className="space-y-1.5">
    <input
      className={cn(
        'w-full rounded-2xl border px-4 py-3 outline-none transition',
        error
          ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-400'
          : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
        className,
      )}
      {...props}
    />
    {error ? <p className="text-sm text-red-600">{error}</p> : null}
  </div>
);
