import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700',
      className,
    )}
    {...props}
  />
);
