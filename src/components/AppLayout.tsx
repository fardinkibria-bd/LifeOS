import { useState, useEffect, useCallback } from 'react';
import { AnimatedDock } from '@/components/effects/AnimatedDock';
import { TopBar } from '@/components/TopBar';
import { MobileNav } from '@/components/MobileNav';
import { CommandPalette } from '@/components/CommandPalette';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('lifeos-sidebar-collapsed') === 'true');
  const [searchOpen, setSearchOpen] = useState(false);
  const { route } = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    localStorage.setItem('lifeos-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const onOpenSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary shadow-glow animate-pulse-glow" />
          <div className="h-3 w-20 skeleton rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="lifeos-app-shell flex h-screen overflow-hidden">
      <AnimatedDock collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar onOpenSearch={onOpenSearch} />
        <main className={cn('flex-1 overflow-y-auto scrollbar-thin', 'pb-20 lg:pb-0')}>
          <div key={route} className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
