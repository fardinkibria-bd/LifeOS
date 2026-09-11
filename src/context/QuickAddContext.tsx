import { createContext, useContext, useState, ReactNode } from 'react';
import {
  CheckSquare, Calendar, Bell, StickyNote, Repeat,
  ShoppingCart, CreditCard, TrendingDown, Target, FileText, Plus,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useRouter } from '@/context/RouterContext';

type QuickAddType = 'task' | 'event' | 'reminder' | 'note' | 'routine' | 'shopping' | 'bill' | 'subscription' | 'expense' | 'goal' | 'document';

interface QuickAddItem {
  type: QuickAddType;
  label: string;
  icon: ReactNode;
  route: string;
}

const quickAddItems: QuickAddItem[] = [
  { type: 'task', label: 'Task', icon: <CheckSquare className="h-5 w-5" />, route: '/tasks?new=true' },
  { type: 'event', label: 'Event', icon: <Calendar className="h-5 w-5" />, route: '/calendar?new=true' },
  { type: 'reminder', label: 'Reminder', icon: <Bell className="h-5 w-5" />, route: '/tasks?new=true&type=reminder' },
  { type: 'note', label: 'Note', icon: <StickyNote className="h-5 w-5" />, route: '/notes?new=true' },
  { type: 'routine', label: 'Routine', icon: <Repeat className="h-5 w-5" />, route: '/routines?new=true' },
  { type: 'shopping', label: 'Shopping item', icon: <ShoppingCart className="h-5 w-5" />, route: '/shopping?new=true' },
  { type: 'bill', label: 'Bill', icon: <CreditCard className="h-5 w-5" />, route: '/bills?new=true' },
  { type: 'subscription', label: 'Subscription', icon: <FileText className="h-5 w-5" />, route: '/subscriptions?new=true' },
  { type: 'expense', label: 'Expense', icon: <TrendingDown className="h-5 w-5" />, route: '/expenses?new=true' },
  { type: 'goal', label: 'Goal', icon: <Target className="h-5 w-5" />, route: '/goals?new=true' },
];

interface QuickAddContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue | undefined>(undefined);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { navigate } = useRouter();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const handleSelect = (route: string) => {
    close();
    navigate(route);
  };

  return (
    <QuickAddContext.Provider value={{ isOpen, open, close }}>
      {children}
      <Modal open={isOpen} onClose={close} title="Quick Add" size="md">
        <div className="grid grid-cols-2 gap-2.5">
          {quickAddItems.map((item, i) => (
            <button
              key={item.type}
              onClick={() => handleSelect(item.route)}
              className="flex items-center gap-3 rounded-xl glass-medium p-3.5 text-left transition-all duration-200 ease-out-quart hover:border-accent hover:bg-accent/5 hover:-translate-y-0.5 animate-stagger-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg glass text-accent">
                {item.icon}
              </div>
              <span className="text-body font-medium text-text-primary">{item.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error('useQuickAdd must be used within QuickAddProvider');
  return ctx;
}

export function QuickAddButton({ className }: { className?: string }) {
  const { open } = useQuickAdd();
  return (
    <button
      onClick={open}
      className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-body-sm font-semibold text-bg-elevated shadow-glow transition-all duration-200 ease-out-quart hover:shadow-glow-lg hover:bg-accent-primary-light hover:-translate-y-0.5 active:translate-y-0"
    >
      <Plus className="h-4 w-4" />
      Add
    </button>
  );
}
