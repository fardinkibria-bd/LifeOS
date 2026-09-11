import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }[size];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn(
        'relative w-full glass-strong glass-highlight rounded-2xl shadow-2xl animate-scale-in',
        'max-h-[90vh] flex flex-col',
        sizeClass
      )}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <h2 className="text-h4 text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
