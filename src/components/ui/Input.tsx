import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-body-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-lg glass-medium px-3.5 text-body text-text-primary',
            'placeholder:text-text-muted transition-all duration-200 ease-out-quart',
            'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
            'hover:border-border-strong',
            error && 'border-danger focus:ring-danger/30 focus:border-danger',
            className
          )}
          {...props}
        />
        {error && <span className="text-caption text-danger">{error}</span>}
        {hint && !error && <span className="text-caption text-text-muted">{hint}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-body-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-lg glass-medium px-3.5 py-2.5 text-body text-text-primary',
            'placeholder:text-text-muted transition-all duration-200 ease-out-quart resize-none',
            'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
            'hover:border-border-strong',
            error && 'border-danger',
            className
          )}
          {...props}
        />
        {error && <span className="text-caption text-danger">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-body-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-10 w-full rounded-lg glass-medium px-3.5 text-body text-text-primary',
            'transition-all duration-200 ease-out-quart cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
            'hover:border-border-strong',
            error && 'border-danger',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-caption text-danger">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';
