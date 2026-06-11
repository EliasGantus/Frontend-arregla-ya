import type { ReactNode } from 'react';

import type { FlowNextStep } from '@/shared/types/api';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { StatusChip } from '@/shared/ui/status-chip';

interface NextActionPanelProps {
  eyebrow?: string;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  nextStep: FlowNextStep;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  aside?: ReactNode;
}

export const NextActionPanel = ({
  eyebrow = 'Proximo paso',
  title,
  description,
  status,
  statusLabel,
  nextStep,
  actionLabel,
  onAction,
  actionDisabled,
  aside,
}: NextActionPanelProps) => (
  <Card className="rounded-[28px] !bg-ink p-5 text-white shadow-lg shadow-slate-300/70 md:rounded-3xl md:p-6">
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase leading-tight tracking-[0.14em] text-accent-200 sm:tracking-[0.22em]">
          {eyebrow}
        </p>
        <h1 className="mt-2 break-words text-2xl font-black leading-tight md:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
          {description}
        </p>
        <div className="mt-4">
          <StatusChip
            className="bg-white/10 text-white"
            label={statusLabel}
            status={status}
          />
        </div>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
    <div className="mt-5 rounded-3xl bg-white/10 p-4">
      <p className="text-sm font-bold text-white">{nextStep.label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-200">
        {nextStep.description}
      </p>
      {actionLabel && onAction ? (
        <Button
          className="mt-4 w-full sm:w-auto"
          disabled={actionDisabled}
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  </Card>
);
