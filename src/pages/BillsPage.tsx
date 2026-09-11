import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, EmptyState, Badge, GlassCard, Skeleton } from '@/components/ui/index';
import { cn, formatCurrency, relativeDate, isOverdue, daysFromNow, todayISO } from '@/lib/utils';
import type { Bill, BillStatus } from '@/types';
import { Plus, Bell, Check, Trash2, MoreHorizontal } from 'lucide-react';

export function BillsPage() {
  const { profile } = useAuth();
  const { params, navigate } = useRouter();
  const { showToast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'paid'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('bills').select('*').eq('trashed', false).eq('archived', false).order('due_date', { ascending: true });
    if (filter === 'upcoming') query = query.neq('payment_status', 'paid');
    else if (filter === 'overdue') query = query.neq('payment_status', 'paid').lt('due_date', todayISO());
    else if (filter === 'paid') query = query.eq('payment_status', 'paid');
    const { data } = await query;
    setBills((data as Bill[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (params.new === 'true') setShowCreate(true); }, [params]);

  const markPaid = async (id: string) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, payment_status: 'paid' as BillStatus, paid_date: new Date().toISOString() } : b));
    await supabase.from('bills').update({ payment_status: 'paid', paid_date: new Date().toISOString() }).eq('id', id);
    showToast('Bill marked as paid.');
  };

  const deleteBill = async (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
    await supabase.from('bills').update({ trashed: true }).eq('id', id);
    showToast('Bill deleted.');
  };

  const statusBadge = (bill: Bill): { variant: 'danger' | 'warning' | 'success' | 'neutral'; label: string } => {
    if (bill.payment_status === 'paid') return { variant: 'success', label: 'Paid' };
    if (isOverdue(bill.due_date)) return { variant: 'danger', label: 'Overdue' };
    if (daysFromNow(bill.due_date) <= 3) return { variant: 'warning', label: 'Due soon' };
    return { variant: 'neutral', label: 'Upcoming' };
  };

  const totalDue = bills.filter(b => b.payment_status !== 'paid').reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = bills.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Bills</h1>
          <p className="text-body-sm text-text-secondary"><span className="tabular-nums">{formatCurrency(totalDue, profile?.currency || 'USD')}</span> due · <span className="tabular-nums">{formatCurrency(totalPaid, profile?.currency || 'USD')}</span> paid</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add bill</Button>
      </div>

      <div className="flex items-center gap-1 mb-4 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        {(['all', 'upcoming', 'overdue', 'paid'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn('rounded-lg px-3 py-1.5 text-body-sm font-medium capitalize transition-all duration-200 ease-out-quart', filter === f ? 'glass-medium text-accent shadow-glow-sm-primary' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary')}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : bills.length === 0 ? (
        <Card className="p-6 animate-fade-in-up"><EmptyState icon={<Bell className="h-6 w-6" />} title="No bills to track." description="Add your recurring bills to stay on top of payments." action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add bill</Button>} /></Card>
      ) : (
        <div className="space-y-2">
          {bills.map((bill, i) => {
            const status = statusBadge(bill);
            return (
              <div
                key={bill.id}
                className="relative flex items-center gap-3 rounded-xl glass glass-highlight p-4 hover:-translate-y-0.5 hover:border-border-strong transition-all duration-200 ease-out-quart group animate-stagger-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0 transition-colors', status.variant === 'danger' ? 'bg-danger/10' : status.variant === 'warning' ? 'bg-warning/10' : status.variant === 'success' ? 'bg-success/10' : 'glass')}>
                  <Bell className={cn('h-5 w-5', status.variant === 'danger' ? 'text-danger' : status.variant === 'warning' ? 'text-warning' : status.variant === 'success' ? 'text-success' : 'text-text-secondary')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-text-primary truncate">{bill.name}</p>
                  <p className="text-caption text-text-muted">{bill.provider ? `${bill.provider} · ` : ''}Due {relativeDate(bill.due_date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-body font-semibold text-text-primary tabular-nums">{formatCurrency(bill.amount, bill.currency)}</p>
                  <Badge variant={status.variant} dot>{status.label}</Badge>
                </div>
                {bill.payment_status !== 'paid' && (
                  <button onClick={() => markPaid(bill.id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success hover:bg-success/20 opacity-0 group-hover:opacity-100 transition-opacity" title="Mark as paid">
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === bill.id ? null : bill.id); }} className="rounded-lg p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {showMenu === bill.id && (
                  <div className="absolute right-2 top-16 z-20 w-36 rounded-xl glass-strong glass-highlight shadow-lg py-1 animate-scale-in" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { deleteBill(bill.id); setShowMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateBillModal open={showCreate} onClose={() => { setShowCreate(false); navigate('/bills'); }} onCreated={(bill) => { setBills(prev => [...prev, bill]); showToast('Bill added.'); }} />
    </div>
  );
}

function CreateBillModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (b: Bill) => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayISO());
  const [recurrence, setRecurrence] = useState('monthly');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !amount) return;
    setLoading(true);
    const { data, error } = await supabase.from('bills').insert({
      name, provider: provider || null, amount: parseFloat(amount), due_date: dueDate,
      recurrence, category: category || null,
    }).select().single();
    setLoading(false);
    if (error) { showToast('Could not add bill.', 'error'); return; }
    onCreated(data as Bill);
    setName(''); setProvider(''); setAmount(''); setCategory('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Bill" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!name.trim() || !amount}>Add</Button></>}>
      <div className="space-y-4">
        <Input label="Bill name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Electricity" autoFocus />
        <Input label="Provider" value={provider} onChange={e => setProvider(e.target.value)} placeholder="e.g. Con Edison" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          <Input label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <Select label="Recurrence" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
          <option value="custom">Custom</option>
        </Select>
        <Input label="Category" value={category} onChange={e => setCategory(e.target.value)} placeholder="Utilities, Rent, etc." />
      </div>
    </Modal>
  );
}
