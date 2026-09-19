import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { navGroups, navItems } from '@/config/navigation';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useQuickAdd } from '@/context/QuickAddContext';
import { getInitials } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { LifeOSLogo } from '@/components/brand/LifeOSLogo';

export function Sidebar({ collapsed, onToggleCollapse }: { collapsed: boolean; onToggleCollapse: () => void }) {
  const { route, navigate } = useRouter();
  const { profile } = useAuth();
  const { open } = useQuickAdd();

  const isActive = (id: string) => route.startsWith(`/${id}`);

  return (
    <aside className={cn(
      'hidden lg:flex flex-col glass-strong glass-highlight border-r border-border/50 transition-all duration-300 ease-out-quart shrink-0 z-20',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo with collapse button */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-border/40 shrink-0">
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-all duration-200 shrink-0"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <LifeOSLogo
          className={cn(
            "h-8 w-8 shrink-0 shadow-glow transition-shadow duration-200",
            collapsed && "cursor-pointer hover:shadow-glow-lg"
          )}
        />
        {!collapsed && (
          <>
            <div className="flex flex-col">
              <span className="text-h4 text-text-primary font-bold tracking-tight leading-none">LifeOS</span>
            </div>
            <button
              onClick={onToggleCollapse}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-all duration-200 ml-auto shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Quick Add + Search */}
      <div className="flex flex-col gap-2 p-3 border-b border-border/40">
        <button
          onClick={open}
          aria-label="Create new item"
          title={collapsed ? "Create new" : undefined}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl bg-accent text-bg-elevated font-medium text-body-sm transition-all duration-200 ease-out-quart shadow-glow',
            'hover:shadow-glow-lg hover:-translate-y-0.5 active:translate-y-0',
            'hover:bg-accent-primary-light',
            collapsed ? 'h-9 w-9' : 'h-9 px-3'
          )}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Create new</span>}
        </button>
        <button
          onClick={() => navigate('/search')}
          aria-label="Search or run command"
          aria-keyshortcuts="Meta+K Control+K"
          title={collapsed ? "Search (⌘K)" : undefined}
          className={cn(
            'flex items-center rounded-lg glass text-text-muted hover:text-text-secondary transition-all duration-200',
            collapsed ? 'h-9 w-9 justify-center' : 'h-9 px-3 gap-2 justify-start'
          )}
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="text-body-sm">Search...</span>}
          {!collapsed && <kbd className="ml-auto text-caption text-text-muted select-none" aria-hidden="true">⌘K</kbd>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {navGroups.map(group => (
          <div key={group.id} className="mb-1">
            {!collapsed && (
              <p className="px-4 py-1.5 text-caption text-text-muted font-semibold uppercase tracking-wider">
                {group.label}
              </p>
            )}
            {group.items.map(item => {
              const active = isActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/${item.id}`)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg mx-2 px-2.5 py-2 text-body-sm font-medium transition-all duration-200 relative group',
                    'hover:bg-surface-hover',
                    active
                      ? 'text-accent bg-accent/10 shadow-glow-sm-primary'
                      : 'text-text-secondary',
                    collapsed && 'justify-center w-[calc(100%-16px)]'
                  )}
                  style={{ width: 'calc(100% - 16px)' }}
                >
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-accent shadow-glow-sm-primary" />}
                  <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div className="border-t border-border/40 p-3 flex items-center gap-2">
        <button
          onClick={() => navigate('/settings')}
          className={cn(
            'flex items-center gap-2 rounded-lg hover:bg-surface-hover transition-all duration-200 min-w-0',
            collapsed ? 'h-9 w-9 justify-center' : 'px-2 py-1.5 flex-1'
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-secondary text-bg-elevated text-caption font-semibold shadow-glow-sm-primary">
            {getInitials(profile?.display_name || 'User')}
          </div>
          {!collapsed && (
            <span className="text-body-sm text-text-primary truncate">{profile?.display_name || 'User'}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
