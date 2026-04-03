import type { ReactNode } from 'react';

import { Card } from '@/shared/ui/card';

interface StatusPanelProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export const StatusPanel = ({ eyebrow, title, description, actions }: StatusPanelProps) => (
  <Card className="bg-slate-950 text-white shadow-glow">
    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent-300">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-bold">{title}</h2>
    <p className="mt-3 max-w-2xl text-sm text-slate-300">{description}</p>
    {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
  </Card>
);
