import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

interface SuccessStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  icon?: ReactNode;
}

export const SuccessState = ({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
  icon,
}: SuccessStateProps) => (
  <Card className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 text-center shadow-lg shadow-emerald-100/70 md:rounded-3xl md:p-6">
    {icon ? (
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-emerald-700 shadow-sm">
        {icon}
      </div>
    ) : null}
    <h3 className="mt-4 text-lg font-black text-emerald-950">{title}</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-emerald-800">
      {description}
    </p>
    {actionLabel && onAction ? (
      <Button
        className="mt-5 w-full sm:w-auto"
        disabled={actionDisabled}
        onClick={onAction}
        variant="secondary"
      >
        {actionLabel}
      </Button>
    ) : null}
  </Card>
);
