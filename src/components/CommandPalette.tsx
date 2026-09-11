import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ArrowRight, CheckSquare, Calendar, StickyNote, Bell, CreditCard, FileText, Target, ShoppingCart, TrendingDown, Cake } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';

interface SearchResult {
  id: string;
  title: string;
  type: string;
  route: string;
  icon: React.ReactNode;
  meta?: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; route: string; label: string }> = {
  tasks: { icon: <CheckSquare className="h-4 w-4" />, route: '/tasks', label: 'Task' },
  events: { icon: <Calendar className="h-4 w-4" />, route: '/calendar', label: 'Event' },
  notes: { icon: <StickyNote className="h-4 w-4" />, route: '/notes', label: 'Note' },
  bills: { icon: <Bell className="h-4 w-4" />, route: '/bills', label: 'Bill' },
  subscriptions: { icon: <CreditCard className="h-4 w-4" />, route: '/subscriptions', label: 'Subscription' },
  documents: { icon: <FileText className="h-4 w-4" />, route: '/documents', label: 'Document' },
  goals: { icon: <Target className="h-4 w-4" />, route: '/goals', label: 'Goal' },
  shopping_items: { icon: <ShoppingCart className="h-4 w-4" />, route: '/shopping', label: 'Shopping' },
  expenses: { icon: <TrendingDown className="h-4 w-4" />, route: '/expenses', label: 'Expense' },
  important_dates: { icon: <Cake className="h-4 w-4" />, route: '/important-dates', label: 'Important Date' },
};

const navCommands = [
  { title: 'Go to Dashboard', route: '/dashboard', type: 'Navigation', icon: <Search className="h-4 w-4" /> },
  { title: 'Go to Tasks', route: '/tasks', type: 'Navigation', icon: <CheckSquare className="h-4 w-4" /> },
  { title: 'Go to Calendar', route: '/calendar', type: 'Navigation', icon: <Calendar className="h-4 w-4" /> },
  { title: 'Go to Notes', route: '/notes', type: 'Navigation', icon: <StickyNote className="h-4 w-4" /> },
  { title: 'Go to Bills', route: '/bills', type: 'Navigation', icon: <Bell className="h-4 w-4" /> },
  { title: 'Go to Settings', route: '/settings', type: 'Navigation', icon: <Search className="h-4 w-4" /> },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[selectedIndex]) {
        navigate(results[selectedIndex].route);
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, results, selectedIndex, navigate, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (query.startsWith('>')) {
      const navQuery = query.slice(1).trim().toLowerCase();
      const filtered = navCommands
        .filter(c => c.title.toLowerCase().includes(navQuery))
        .map(c => ({ id: c.title, title: c.title, type: c.type, route: c.route, icon: c.icon }));
      setResults(filtered);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    const tables = Object.keys(typeConfig);
    const delay = setTimeout(async () => {
      const all: SearchResult[] = [];
      await Promise.all(
        tables.map(async (table) => {
          const cfg = typeConfig[table];
          const textCol = table === 'expenses' ? 'description' : table === 'shopping_items' ? 'name' : table === 'important_dates' ? 'label' : 'title';
          const { data } = await supabase
            .from(table)
            .select(`id, ${textCol}`)
            .ilike(textCol, `%${query}%`)
            .limit(5);
          if (data) {
            data.forEach((row: any) => {
              all.push({
                id: row.id,
                title: row[textCol] || 'Untitled',
                type: cfg.label,
                route: `${cfg.route}?id=${row.id}`,
                icon: cfg.icon,
              });
            });
          }
        })
      );
      setResults(all);
      setLoading(false);
      setSelectedIndex(0);
    }, 200);

    return () => clearTimeout(delay);
  }, [query]);

  const displayResults = useMemo(() => {
    if (query.trim() && !query.startsWith('>')) return results;
    if (query.startsWith('>')) return results;
    return [];
  }, [query, results]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[15vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-strong glass-highlight rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
          <Search className="h-5 w-5 text-text-muted shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search LifeOS...  (type > for commands)"
            className="flex-1 bg-transparent text-body text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded-md glass px-1.5 py-0.5 text-caption text-text-muted">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto scrollbar-thin">
          {!query && (
            <div className="p-4">
              <p className="text-caption text-text-muted mb-3 font-medium uppercase tracking-wide">Quick Navigation</p>
              <div className="flex flex-col gap-1">
                {navCommands.map((cmd, i) => (
                  <button
                    key={cmd.route}
                    onClick={() => { navigate(cmd.route); onClose(); }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover transition-all duration-200 group"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span className="text-text-muted group-hover:text-accent transition-colors duration-200">{cmd.icon}</span>
                    <span className="text-body-sm text-text-primary">{cmd.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {query && displayResults.length === 0 && !loading && (
            <div className="p-8 text-center">
              <p className="text-body-sm text-text-secondary">No results for "{query}"</p>
            </div>
          )}
          {loading && (
            <div className="p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="h-4 w-4 skeleton rounded" />
                  <div className="h-4 w-full skeleton rounded" />
                </div>
              ))}
            </div>
          )}
          {displayResults.length > 0 && (
            <div className="p-2">
              {displayResults.map((result, i) => (
                <button
                  key={result.id + i}
                  onClick={() => { navigate(result.route); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                    i === selectedIndex ? 'bg-accent/10 text-accent' : 'hover:bg-surface-hover/50'
                  }`}
                >
                  <span className={i === selectedIndex ? 'text-accent' : 'text-text-muted'} style={{ shrink: 0 }}>{result.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm text-text-primary truncate">{result.title}</p>
                  </div>
                  <span className="text-caption text-text-muted shrink-0">{result.type}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
