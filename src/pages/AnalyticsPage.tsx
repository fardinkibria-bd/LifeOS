import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { GlassCard, Card } from '@/components/ui/index';
import { cn, formatCurrency, toISODate, startOfMonth, endOfMonth, addDays, todayISO } from '@/lib/utils';
import { BarChart3, TrendingDown, CheckSquare, Repeat, Sparkles } from 'lucide-react';

export function AnalyticsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tasksCompleted: 0, tasksTotal: 0, overdue: 0, completionRate: 0,
    expensesTotal: 0, billsPaid: 0, billsTotal: 0,
    activeHabits: 0, habitCompletions: 0, activeRoutines: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const weekStart = toISODate(addDays(now, -7));
    const monthStart = toISODate(startOfMonth(now));
    const monthEnd = toISODate(endOfMonth(now));

    const [tasksRes, expensesRes, billsRes, habitsRes, routinesRes, habitEntriesRes] = await Promise.all([
      supabase.from('tasks').select('status, due_date, completed_at').eq('trashed', false),
      supabase.from('expenses').select('amount').eq('trashed', false).gte('expense_date', monthStart).lte('expense_date', monthEnd),
      supabase.from('bills').select('payment_status, amount').eq('trashed', false).eq('archived', false),
      supabase.from('habits').select('id').eq('active', true).eq('archived', false),
      supabase.from('routines').select('id').eq('active', true).eq('paused', false),
      supabase.from('habit_entries').select('id').gte('entry_date', weekStart),
    ]);

    const tasks = tasksRes.data || [];
    const completed = tasks.filter((t: any) => t.status === 'completed').length;
    const overdue = tasks.filter((t: any) => t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date()).length;
    const expenses = (expensesRes.data || []).reduce((s: number, e: any) => s + e.amount, 0);
    const bills = billsRes.data || [];
    const billsPaid = bills.filter((b: any) => b.payment_status === 'paid').length;
    const billsTotal = bills.length;

    setStats({
      tasksCompleted: completed, tasksTotal: tasks.length, overdue, completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
      expensesTotal: expenses, billsPaid, billsTotal,
      activeHabits: (habitsRes.data || []).length, habitCompletions: (habitEntriesRes.data || []).length,
      activeRoutines: (routinesRes.data || []).length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6 space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 skeleton rounded-xl" />)}</div>;
  }

  const cur = profile?.currency || 'USD';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-h1 text-text-primary font-bold mb-6 animate-fade-in-up">Analytics</h1>

      {/* Life Overview */}
      <div className="mb-6">
        <h2 className="text-h4 text-text-primary font-semibold mb-3 animate-fade-in-up">This Month</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<CheckSquare className="h-4 w-4" />} label="Tasks completed" value={String(stats.tasksCompleted)} sub={`${stats.completionRate}% completion rate`} variant="accent" index={0} />
          <StatCard icon={<TrendingDown className="h-4 w-4" />} label="Expenses" value={formatCurrency(stats.expensesTotal, cur)} sub="This month" variant="info" index={1} />
          <StatCard icon={<Sparkles className="h-4 w-4" />} label="Habit check-ins" value={String(stats.habitCompletions)} sub={`${stats.activeHabits} active habits`} variant="success" index={2} />
          <StatCard icon={<Repeat className="h-4 w-4" />} label="Active routines" value={String(stats.activeRoutines)} sub="Currently tracking" variant="warning" index={3} />
        </div>
      </div>

      {/* Productivity */}
      <div className="mb-6">
        <h2 className="text-h4 text-text-primary font-semibold mb-3 animate-fade-in-up">Productivity</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <GlassCard variant="standard" className="p-5 animate-stagger-in" ><p className="text-body-sm text-text-secondary mb-1">Completion rate</p><p className="text-numeric text-text-primary tabular-nums">{stats.completionRate}%</p></GlassCard>
          <GlassCard variant="standard" className="p-5 animate-stagger-in" style={{ animationDelay: '30ms' }}><p className="text-body-sm text-text-secondary mb-1">Overdue</p><p className="text-numeric text-text-primary tabular-nums">{stats.overdue}</p></GlassCard>
          <GlassCard variant="standard" className="p-5 animate-stagger-in" style={{ animationDelay: '60ms' }}><p className="text-body-sm text-text-secondary mb-1">Total tasks</p><p className="text-numeric text-text-primary tabular-nums">{stats.tasksTotal}</p></GlassCard>
        </div>
      </div>

      {/* Finance */}
      <div className="mb-6">
        <h2 className="text-h4 text-text-primary font-semibold mb-3 animate-fade-in-up">Finance</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <GlassCard variant="standard" className="p-5 animate-stagger-in"><p className="text-body-sm text-text-secondary mb-1">Monthly expenses</p><p className="text-numeric text-text-primary tabular-nums">{formatCurrency(stats.expensesTotal, cur)}</p></GlassCard>
          <GlassCard variant="standard" className="p-5 animate-stagger-in" style={{ animationDelay: '30ms' }}><p className="text-body-sm text-text-secondary mb-1">Bills paid</p><p className="text-numeric text-text-primary tabular-nums">{stats.billsPaid} / {stats.billsTotal}</p></GlassCard>
          <GlassCard variant="standard" className="p-5 animate-stagger-in" style={{ animationDelay: '60ms' }}><p className="text-body-sm text-text-secondary mb-1">Pending bills</p><p className="text-numeric text-text-primary tabular-nums">{stats.billsTotal - stats.billsPaid}</p></GlassCard>
        </div>
      </div>

      <GlassCard variant="standard" className="p-5 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4 text-text-muted" />
          <p className="text-body-sm font-medium text-text-secondary">Life overview</p>
        </div>
        <p className="text-body-sm text-text-secondary">
          This month you've completed {stats.tasksCompleted} tasks at a {stats.completionRate}% rate,
          spent {formatCurrency(stats.expensesTotal, cur)}, paid {stats.billsPaid} bills,
          and logged {stats.habitCompletions} habit check-ins across {stats.activeHabits} active habits.
        </p>
      </GlassCard>
    </div>
  );
}

function StatCard({ icon, label, value, sub, variant, index }: { icon: React.ReactNode; label: string; value: string; sub?: string; variant: 'accent' | 'success' | 'warning' | 'info' | 'danger'; index: number }) {
  const colors = { accent: 'text-accent', success: 'text-success', warning: 'text-warning', info: 'text-info', danger: 'text-danger' };
  return (
    <GlassCard variant="interactive" className="p-5 animate-stagger-in" >
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg glass text-text-secondary mb-3', colors[variant])} style={{ animationDelay: `${index * 30}ms` }}>{icon}</div>
      <p className="text-body-sm text-text-secondary mb-1">{label}</p>
      <p className="text-numeric text-text-primary tabular-nums">{value}</p>
      {sub && <p className="text-caption text-text-muted mt-1">{sub}</p>}
    </GlassCard>
  );
}
