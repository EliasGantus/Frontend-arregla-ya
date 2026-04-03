import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow hover:from-brand-500 hover:to-brand-400',
  secondary:
    'bg-accent-500 text-white shadow-lg shadow-accent-500/30 hover:bg-accent-400',
  ghost:
    'border border-slate-200 bg-white/70 text-slate-700 hover:border-brand-300 hover:text-brand-700',
};

export const Button = ({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
      variants[variant],
      className,
    )}
    {...props}
  />
);
