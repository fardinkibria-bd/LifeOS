import { useRef, useEffect, useState, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface LiquidMetalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: 'text-bg-elevated font-semibold',
  secondary: 'glass-medium text-text-primary font-medium',
  ghost: 'text-text-secondary hover:text-text-primary',
  danger: 'text-white font-semibold',
  outline: 'border border-border text-text-primary font-medium',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-body-sm gap-1.5 rounded-md',
  md: 'h-9 px-4 text-body-sm gap-2 rounded-lg',
  lg: 'h-11 px-6 text-body gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
};

export function LiquidMetalButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: LiquidMetalButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const handleMove = (e: PointerEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      btn.style.setProperty('--lm-x', `${x}px`);
      btn.style.setProperty('--lm-y', `${y}px`);
    };

    btn.addEventListener('pointermove', handleMove);
    return () => btn.removeEventListener('pointermove', handleMove);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || loading) return;
    const btn = btnRef.current;
    const ripple = rippleRef.current;
    if (!btn || !ripple) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.remove('lm-ripple-active');
    void ripple.offsetWidth;
    ripple.classList.add('lm-ripple-active');
    setIsPressed(true);
  };

  const variantBg: Record<Variant, string> = {
    primary: 'lm-primary',
    secondary: 'lm-secondary',
    ghost: 'lm-ghost',
    danger: 'lm-danger',
    outline: 'lm-outline',
  };

  return (
    <button
      ref={btnRef}
      className={cn(
        'lm-btn relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-out-quart overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-50 disabled:pointer-events-none',
        'hover:-translate-y-0.5 active:translate-y-0',
        variantBg[variant],
        variantStyles[variant],
        sizeStyles[size],
        `lm-size-${size}`,
        className,
      )}
      disabled={disabled || loading}
      onPointerDown={handlePointerDown}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      {...props}
    >
      <span ref={glowRef} className="lm-glow" />
      <span className="lm-shine" data-pressed={isPressed} />
      <span ref={rippleRef} className="lm-ripple" />
      <span className="relative z-10 inline-flex items-center gap-2">
        {loading && <span className="lm-spinner" />}
        {children}
      </span>
    </button>
  );
}
