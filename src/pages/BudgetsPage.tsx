import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { GlassCard, Card, EmptyState, ProgressBar } from '@/components/ui/index';
import { cn, formatCurrency, toISODate, startOfMonth, endOfMonth, todayISO } from '@/lib/utils';
import type { Budget, Expense } from '@/types';
import { Plus, PiggyBank, Trash2, MoreHorizontal } from 'lucide-react';

const budgetCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Education', 'Entertainment', 'Health', 'Home', 'Other'];

export function BudgetsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const [bRes, eRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('active', true),
      supabase.from('expenses').select('*').eq('trashed', false).eq('archived', false).gte('expense_date', toISODate(startOfMonth(now))).lte('expense_date', toISODate(endOfMonth(now))),
    ]);
    setBudgets((bRes.data as Budget[]) || []);
    setExpenses((eRes.data as Expense[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const spent = (cat: string) => expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);

  const deleteBudget = async (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    await supabase.from('budgets').update({ active: false }).eq('id', id);
    showToast('Budget removed.');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Budgets</h1>
          <p className="text-body-sm text-text-secondary">{budgets.length} active budgets this month</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add budget</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
      ) : budgets.length === 0 ? (
        <Card className="p-6 animate-fade-in-up"><EmptyState icon={<PiggyBank className="h-6 w-6" />} title="No budgets set." description="Create category budgets to track your spending limits." action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add budget</Button>} /></Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget, i) => {
            const spentAmount = spent(budget.category);
            const pct = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;
            const remaining = budget.amount - spentAmount;
            return (
              <GlassCard key={budget.id} variant="interactive" className="p-4 animate-stagger-in" >
                <div className="flex items-center justify-between mb-2" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-body font-medium text-text-primary">{budget.category}</span>
                    <span className="text-caption text-text-muted">· {budget.period}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === budget.id ? null : budget.id); }} className="rounded-md p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {showMenu === budget.id && (
                    <div className="absolute right-2 top-12 z-20 w-36 rounded-xl glass-strong glass-highlight shadow-lg py-1 animate-scale-in" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { deleteBudget(budget.id); setShowMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover transition-colors"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                    </div>
                  )}
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-body-sm text-text-secondary tabular-nums">{formatCurrency(spentAmount, budget.currency)} of {formatCurrency(budget.amount, budget.currency)}</span>
                  <span className={cn('text-body-sm font-medium tabular-nums', remaining < 0 ? 'text-danger' : 'text-text-secondary')}>
                    {remaining < 0 ? `${formatCurrency(Math.abs(remaining), budget.currency)} over` : `${formatCurrency(remaining, budget.currency)} left`}
                  </span>
                </div>
                <ProgressBar value={pct} variant={pct > 100 ? 'danger' : pct > 80 ? 'warning' : 'success'} />
              </GlassCard>
            );
          })}
        </div>
      )}

      <CreateBudgetModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={(b) => { setBudgets(prev => [...prev, b]); showToast('Budget created.'); }} />
    </div>
  );
}

function CreateBudgetModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (b: Budget) => void }) {
  const { showToast } = useToast();
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!amount) return;
    setLoading(true);
    const { data, error } = await supabase.from('budgets').insert({
      category, amount: parseFloat(amount), period,
    }).select().single();
    setLoading(false);
    if (error) { showToast('Could not create budget.', 'error'); return; }
    onCreated(data as Budget);
    setAmount('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Budget" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!amount}>Add</Button></>}>
      <div className="space-y-4">
        <Select label="Category" value={category} onChange={e => setCategory(e.target.value)}>
          {budgetCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus />
          <Select label="Period" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </div>
      </div>
    </Modal>
  );
}
