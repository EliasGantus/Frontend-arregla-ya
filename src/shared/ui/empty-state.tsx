import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  icon?: ReactNode;
}

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
  icon,
}: EmptyStateProps) => (
  <Card className="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-slate-200/70 md:rounded-3xl md:p-6">
    {icon ? (
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-accent-600">
        {icon}
      </div>
    ) : null}
    <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
      {description}
    </p>
    {actionLabel && onAction ? (
      <Button
        className="mt-5 w-full sm:w-auto"
        disabled={actionDisabled}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    ) : null}
  </Card>
);
