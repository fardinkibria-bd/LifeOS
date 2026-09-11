import { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon, Monitor, Plus } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useQuickAdd } from '@/context/QuickAddContext';
import { navItems } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';
import { LifeOSLogo } from '@/components/brand/LifeOSLogo';

export function TopBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { route, navigate } = useRouter();
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { open: openQuickAdd } = useQuickAdd();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  const currentNav = navItems.find(n => route.startsWith(`/${n.id}`));
  const pageTitle = currentNav?.label || 'Dashboard';

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('notifications')
      .select('*')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => data && setNotifications(data as Notification[]));
  }, [profile, route]);

  useEffect(() => {
    const handler = () => { setShowNotif(false); setShowProfile(false); setShowTheme(false); };
    if (showNotif || showProfile || showTheme) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [showNotif, showProfile, showTheme]);

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('read', false);
    setNotifications([]);
  };

  const themeIcons = { light: <Sun className="h-4 w-4" />, dark: <Moon className="h-4 w-4" />, system: <Monitor className="h-4 w-4" /> };

  return (
    <header className="lifeos-topbar sticky top-3 lg:top-4 z-30 flex h-14 mx-3 mt-3 lg:mx-4 lg:mt-4 items-center gap-3 glass-strong glass-highlight px-4 lg:px-6 shrink-0">
      <h1 className="text-h4 text-text-primary font-semibold hidden sm:block">{pageTitle}</h1>

      <div className="flex-1" />

      {/* Search */}
      <button
        onClick={onOpenSearch}
        className="flex items-center gap-2 rounded-lg glass px-3 py-1.5 text-text-muted hover:text-text-secondary hover:border-border-strong transition-all duration-200 w-40 sm:w-56"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="text-body-sm hidden sm:inline">Search...</span>
        <kbd className="ml-auto hidden sm:inline text-caption text-text-muted">⌘K</kbd>
      </button>

      {/* Quick Add (mobile) */}
      <button
        onClick={openQuickAdd}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-bg-elevated shadow-glow hover:shadow-glow-lg hover:bg-accent-primary-light transition-all duration-200 active:scale-95 lg:hidden"
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Theme toggle */}
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowTheme(!showTheme); setShowNotif(false); setShowProfile(false); }}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-hover transition-all duration-200"
        >
          {themeIcons[theme]}
        </button>
        {showTheme && (
          <div className="absolute right-0 top-11 w-40 rounded-xl glass-strong glass-highlight shadow-xl py-1 animate-scale-in z-50">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={(e) => { e.stopPropagation(); setTheme(t); setShowTheme(false); }}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-body-sm hover:bg-surface-hover transition-all duration-200',
                  theme === t ? 'text-accent font-medium' : 'text-text-secondary'
                )}
              >
                {themeIcons[t]}
                <span className="capitalize">{t}</span>
                {theme === t && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent shadow-glow-sm-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowNotif(!showNotif); setShowTheme(false); setShowProfile(false); }}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-hover transition-all duration-200"
        >
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface-glass-strong" />
          )}
        </button>
        {showNotif && (
          <div className="absolute right-0 top-11 w-80 rounded-xl glass-strong glass-highlight shadow-xl animate-scale-in z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <span className="text-body-sm font-semibold text-text-primary">Notifications</span>
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-caption text-accent hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-body-sm text-text-secondary">You're all caught up.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="flex gap-3 px-4 py-3 border-b border-border/30 last:border-0 hover:bg-surface-hover/50 transition-all duration-200">
                    <div className="h-2 w-2 rounded-full bg-accent shadow-glow-sm-primary mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium text-text-primary">{n.title}</p>
                      {n.message && <p className="text-caption text-text-secondary truncate">{n.message}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowProfile(!showProfile); setShowTheme(false); setShowNotif(false); }}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-secondary text-bg-elevated text-body-sm font-semibold shadow-glow-sm-primary hover:shadow-glow transition-all duration-200"
        >
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full rounded-lg object-cover" /> : <LifeOSLogo className="h-7 w-7" />}
        </button>
        {showProfile && (
          <div className="absolute right-0 top-11 w-52 rounded-xl glass-strong glass-highlight shadow-xl py-1 animate-scale-in z-50">
            <div className="px-3 py-2 border-b border-border/40">
              <p className="text-body-sm font-medium text-text-primary truncate">{profile?.display_name || 'User'}</p>
            </div>
            <button onClick={() => { navigate('/settings'); setShowProfile(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-text-secondary hover:bg-surface-hover transition-all duration-200">
              Settings
            </button>
            <button onClick={() => signOut()} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover transition-all duration-200">
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
