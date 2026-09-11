import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const variants: Record<Variant, string> = {
  neutral: 'glass text-text-secondary border-border',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
  brand: 'bg-accent/10 text-accent border-accent/20',
};

const dotColors: Record<Variant, string> = {
  neutral: 'bg-text-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  brand: 'bg-accent',
};

export function Badge({ variant = 'neutral', children, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-medium',
      variants[variant],
      className
    )}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
