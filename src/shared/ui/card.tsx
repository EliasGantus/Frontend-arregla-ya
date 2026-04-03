import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/60 backdrop-blur',
      className,
    )}
    {...props}
  />
);
