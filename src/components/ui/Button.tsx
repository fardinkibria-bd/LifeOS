import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LiquidMetalButton } from '@/components/effects/LiquidMetalButton';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading = false, className, children, ...props }: ButtonProps) {
  return (
    <LiquidMetalButton
      variant={variant}
      size={size}
      loading={loading}
      className={className}
      {...props}
    >
      {children}
    </LiquidMetalButton>
  );
}
