import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Drawer({ open, onClose, title, children, footer, width = 'max-w-md' }: DrawerProps) {
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn(
        'relative h-full w-full glass-strong glass-highlight border-l border-border/60 animate-slide-in-right',
        'flex flex-col shadow-2xl',
        width
      )}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
            <h2 className="text-h4 text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/60 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
