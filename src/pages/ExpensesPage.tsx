import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { GlassCard, Card, EmptyState } from '@/components/ui/index';
import { cn, formatCurrency, formatDate, todayISO, startOfMonth, endOfMonth, toISODate } from '@/lib/utils';
import type { Expense } from '@/types';
import { Plus, TrendingDown, Trash2, MoreHorizontal } from 'lucide-react';

const expenseCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Education', 'Entertainment', 'Health', 'Home', 'Other'];

export function ExpensesPage() {
  const { profile } = useAuth();
  const { params, navigate } = useRouter();
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'week' | 'year' | 'all'>('month');

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('expenses').select('*').eq('trashed', false).eq('archived', false).order('expense_date', { ascending: false });
    const now = new Date();
    if (period === 'month') query = query.gte('expense_date', toISODate(startOfMonth(now))).lte('expense_date', toISODate(endOfMonth(now)));
    else if (period === 'week') { const start = new Date(now); start.setDate(now.getDate() - 7); query = query.gte('expense_date', toISODate(start)); }
    else if (period === 'year') query = query.gte('expense_date', `${now.getFullYear()}-01-01`);
    const { data } = await query;
    setExpenses((data as Expense[]) || []);
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (params.new === 'true') setShowCreate(true); }, [params]);

  const deleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await supabase.from('expenses').update({ trashed: true }).eq('id', id);
    showToast('Expense deleted.');
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory: Record<string, number> = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Expenses</h1>
          <p className="text-body-sm text-text-secondary tabular-nums">{formatCurrency(total, profile?.currency || 'USD')} this {period}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add expense</Button>
      </div>

      <div className="flex items-center gap-1 mb-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        {(['week', 'month', 'year', 'all'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={cn('rounded-lg px-3 py-1.5 text-body-sm font-medium capitalize transition-all duration-200 ease-out-quart', period === p ? 'glass-medium text-accent shadow-sm' : 'text-text-secondary hover:bg-surface-hover')}>This {p}</button>
        ))}
      </div>

      {/* Category breakdown */}
      {sortedCategories.length > 0 && (
        <GlassCard variant="standard" className="p-5 mb-4 animate-fade-in-up" >
          <p className="text-body-sm font-medium text-text-secondary mb-3">By category</p>
          <div className="space-y-2">
            {sortedCategories.map(([cat, amount], i) => (
              <div key={cat} className="flex items-center gap-3 animate-stagger-in" style={{ animationDelay: `${i * 30}ms` }}>
                <span className="text-body-sm text-text-primary w-24 shrink-0">{cat}</span>
                <div className="flex-1 h-2 rounded-full bg-surface-active overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all duration-400 ease-out-quart" style={{ width: `${(amount / total) * 100}%` }} />
                </div>
                <span className="text-body-sm font-medium text-text-primary w-20 text-right tabular-nums">{formatCurrency(amount, profile?.currency || 'USD')}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
      ) : expenses.length === 0 ? (
        <Card className="p-6 animate-fade-in-up"><EmptyState icon={<TrendingDown className="h-6 w-6" />} title="No expenses recorded." description="Track your spending to see where your money goes." action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add expense</Button>} /></Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp, i) => (
            <div key={exp.id} className="relative flex items-center gap-3 rounded-xl glass p-3 hover:-translate-y-0.5 hover:border-border-strong transition-all duration-200 ease-out-quart group animate-stagger-in" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg glass text-text-secondary shrink-0">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-text-primary truncate">{exp.description || exp.category}</p>
                <p className="text-caption text-text-muted">{exp.category} · {formatDate(exp.expense_date, 'MMM D')}{exp.merchant ? ` · ${exp.merchant}` : ''}</p>
              </div>
              <span className="text-body font-semibold text-text-primary shrink-0 tabular-nums">{formatCurrency(exp.amount, exp.currency)}</span>
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === exp.id ? null : exp.id); }} className="rounded-md p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu === exp.id && (
                <div className="absolute right-2 top-14 z-20 w-36 rounded-xl glass-strong glass-highlight shadow-lg py-1 animate-scale-in" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { deleteExpense(exp.id); setShowMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateExpenseModal open={showCreate} onClose={() => { setShowCreate(false); navigate('/expenses'); }} onCreated={(exp) => { setExpenses(prev => [exp, ...prev]); showToast('Expense added.'); }} />
    </div>
  );
}

function CreateExpenseModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (e: Expense) => void }) {
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!amount) return;
    setLoading(true);
    const { data, error } = await supabase.from('expenses').insert({
      amount: parseFloat(amount), category, expense_date: date,
      description: description || null, merchant: merchant || null,
    }).select().single();
    setLoading(false);
    if (error) { showToast('Could not add expense.', 'error'); return; }
    onCreated(data as Expense);
    setAmount(''); setDescription(''); setMerchant('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!amount}>Add</Button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus />
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <Select label="Category" value={category} onChange={e => setCategory(e.target.value)}>
          {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input label="Merchant" value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="Where?" />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional note" />
      </div>
    </Modal>
  );
}
