import { ReactNode, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export { Badge } from '@/components/ui/Badge';

type GlassStrength = 'light' | 'medium' | 'strong';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  spotlight?: boolean;
  onClick?: () => void;
  glass?: GlassStrength;
}

const glassClasses: Record<GlassStrength, string> = {
  light: 'glass glass-highlight',
  medium: 'glass-medium glass-highlight shadow-md',
  strong: 'glass-strong glass-highlight shadow-lg',
};

export function Card({ children, className, hover, spotlight, onClick, glass = 'medium' }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current || !spotlight) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    ref.current.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
  }, [spotlight]);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={cn(
        'rounded-xl transition-all duration-300 ease-out-quart',
        glassClasses[glass],
        hover && 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
        spotlight && 'spotlight-border',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'standard' | 'highlight' | 'interactive' | 'floating' | 'focus';
  onClick?: () => void;
}

export function GlassCard({ children, className, variant = 'standard', onClick }: GlassCardProps) {
  const variants: Record<string, string> = {
    standard: 'glass-medium glass-highlight shadow-md',
    highlight: 'glass-strong glass-highlight shadow-lg border-accent/20',
    interactive: cn(
      'glass-medium glass-highlight shadow-md cursor-pointer',
      'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300',
      'spotlight-border'
    ),
    floating: 'glass-strong glass-highlight shadow-xl',
    focus: 'glass-strong glass-highlight shadow-lg border-accent/30 glow-sm-primary',
  };
  return (
    <div
      onClick={onClick}
      className={cn('rounded-xl transition-all duration-300 ease-out-quart', variants[variant], className)}
    >
      {children}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl glass glass-highlight text-accent">
          {icon}
        </div>
      )}
      <h3 className="text-h4 text-text-primary mb-1.5">{title}</h3>
      {description && <p className="text-body-sm text-text-secondary max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl glass glass-highlight text-danger">
        !
      </div>
      <h3 className="text-h4 text-text-primary mb-1.5">{title}</h3>
      <p className="text-body-sm text-text-secondary max-w-sm mb-5">
        {description || 'We couldn\'t load this. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg glass-medium px-4 py-2 text-body-sm font-medium text-text-primary hover:border-border-strong transition-all duration-200"
        >
          Try again
        </button>
      )}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function ProgressBar({ value, max = 100, variant = 'brand', className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    brand: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-surface-active overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-400 ease-out-quart', colors[variant])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

export function Checkbox({ checked, onChange, className, ...props }: CheckboxProps) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ease-out-quart',
        checked
          ? 'bg-accent border-accent text-bg-elevated shadow-glow scale-100'
          : 'border-border-strong hover:border-accent bg-surface/50',
        className
      )}
      {...props}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="animate-scale-in">
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
