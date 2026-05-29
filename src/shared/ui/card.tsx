import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

export const Card = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'min-w-0 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-6',
      className,
    )}
    {...props}
  />
);
