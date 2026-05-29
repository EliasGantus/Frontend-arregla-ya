import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

export const Badge = ({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'inline-flex max-w-full items-center rounded-full bg-brand-50 px-3 py-1 text-center text-xs font-semibold uppercase leading-tight tracking-[0.14em] text-brand-700 sm:tracking-[0.2em]',
      className,
    )}
    {...props}
  />
);
