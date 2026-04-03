import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = ({ className, error, ...props }: TextareaProps) => (
  <div className="space-y-1.5">
    <textarea
      className={cn(
        'min-h-32 w-full rounded-2xl border px-4 py-3 outline-none transition',
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
