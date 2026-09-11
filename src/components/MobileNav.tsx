import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from '@/context/RouterContext';
import { useQuickAdd } from '@/context/QuickAddContext';
import { navGroups, mobileNavItems } from '@/config/navigation';
import { Home, CheckSquare, Calendar, LayoutGrid, Plus, X } from 'lucide-react';

export function MobileNav() {
  const { route, navigate } = useRouter();
  const { open } = useQuickAdd();
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setShowMore(false);
  }, [route]);

  const isActive = (id: string) => route.startsWith(`/${id}`);

  const icons: Record<string, React.ReactNode> = {
    dashboard: <Home className="h-5 w-5" />,
    tasks: <CheckSquare className="h-5 w-5" />,
    calendar: <Calendar className="h-5 w-5" />,
    more: <LayoutGrid className="h-5 w-5" />,
  };

  return (
    <>
      {showMore && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-0 left-0 right-0 glass-strong glass-highlight border-t border-border/50 rounded-t-2xl animate-slide-in-bottom max-h-[70vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 sticky top-0">
              <h2 className="text-h4 text-text-primary">All Modules</h2>
              <button onClick={() => setShowMore(false)} className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all duration-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 pb-8">
              {navGroups.map(group => (
                <div key={group.id} className="mb-4">
                  <p className="text-caption text-text-muted font-semibold uppercase tracking-wider mb-2 px-1">{group.label}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/${item.id}`)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl glass-medium p-3 transition-all duration-200',
                          isActive(item.id)
                            ? 'border-accent bg-accent/10 text-accent shadow-glow-sm-primary'
                            : 'text-text-secondary hover:border-border-strong'
                        )}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <span className="text-body-sm font-medium truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass-strong glass-highlight border-t border-border/50">
        <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
          {mobileNavItems.slice(0, 2).map(item => (
            <NavButton key={item.id} active={isActive(item.id)} onClick={() => navigate(`/${item.id}`)} icon={icons[item.id]} label={item.label} />
          ))}

          <button
            onClick={open}
            className="flex h-12 w-12 -mt-6 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-secondary text-bg-elevated shadow-glow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>

          {mobileNavItems.slice(2, 3).map(item => (
            <NavButton key={item.id} active={isActive(item.id)} onClick={() => navigate(`/${item.id}`)} icon={icons[item.id]} label={item.label} />
          ))}
          <NavButton active={false} onClick={() => setShowMore(true)} icon={icons.more} label="More" />
        </div>
      </nav>
    </>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 min-w-[60px]',
        active ? 'text-accent' : 'text-text-muted'
      )}
    >
      {icon}
      <span className="text-caption font-medium">{label}</span>
    </button>
  );
}
