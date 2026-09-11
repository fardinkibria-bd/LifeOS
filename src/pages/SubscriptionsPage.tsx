import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, EmptyState, Badge, GlassCard, Skeleton } from '@/components/ui/index';
import { cn, formatCurrency, relativeDate, todayISO } from '@/lib/utils';
import type { Subscription, SubscriptionStatus } from '@/types';
import { Plus, CreditCard, Trash2, MoreHorizontal } from 'lucide-react';

export function SubscriptionsPage() {
  const { profile } = useAuth();
  const { params, navigate } = useRouter();
  const { showToast } = useToast();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('subscriptions').select('*').eq('trashed', false).eq('archived', false).order('next_billing_date', { ascending: true });
    setSubs((data as Subscription[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (params.new === 'true') setShowCreate(true); }, [params]);

  const deleteSub = async (id: string) => {
    setSubs(prev => prev.filter(s => s.id !== id));
    await supabase.from('subscriptions').update({ trashed: true }).eq('id', id);
    showToast('Subscription deleted.');
  };

  const active = subs.filter(s => s.status === 'active');
  const monthlyTotal = active.reduce((sum, s) => {
    if (s.billing_frequency === 'monthly') return sum + s.price;
    if (s.billing_frequency === 'yearly') return sum + s.price / 12;
    if (s.billing_frequency === 'quarterly') return sum + s.price / 3;
    if (s.billing_frequency === 'weekly') return sum + s.price * 4.33;
    return sum + s.price;
  }, 0);
  const annualTotal = monthlyTotal * 12;

  const statusBadge = (s: SubscriptionStatus) => {
    const map = { active: { variant: 'success' as const, label: 'Active' }, paused: { variant: 'warning' as const, label: 'Paused' }, cancelled: { variant: 'neutral' as const, label: 'Cancelled' }, expired: { variant: 'danger' as const, label: 'Expired' } };
    return map[s];
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Subscriptions</h1>
          <p className="text-body-sm text-text-secondary">{active.length} active subscriptions</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add</Button>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <GlassCard variant="highlight" className="p-5 animate-fade-in-up" >
          <div style={{ animationDelay: '60ms' }}>
            <p className="text-body-sm text-text-secondary mb-1">Monthly recurring</p>
            <p className="text-numeric text-text-primary tabular-nums">{formatCurrency(monthlyTotal, profile?.currency || 'USD')}</p>
          </div>
        </GlassCard>
        <GlassCard variant="highlight" className="p-5 animate-fade-in-up">
          <div style={{ animationDelay: '120ms' }}>
            <p className="text-body-sm text-text-secondary mb-1">Annual projected</p>
            <p className="text-numeric text-text-primary tabular-nums">{formatCurrency(annualTotal, profile?.currency || 'USD')}</p>
          </div>
        </GlassCard>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : subs.length === 0 ? (
        <Card className="p-6 animate-fade-in-up"><EmptyState icon={<CreditCard className="h-6 w-6" />} title="No subscriptions tracked." description="Track your recurring subscriptions to see what you're spending." action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add subscription</Button>} /></Card>
      ) : (
        <div className="space-y-2">
          {subs.map((sub, i) => {
            const status = statusBadge(sub.status);
            return (
              <div
                key={sub.id}
                className="relative flex items-center gap-3 rounded-xl glass glass-highlight p-4 hover:-translate-y-0.5 hover:border-border-strong transition-all duration-200 ease-out-quart group animate-stagger-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg glass shrink-0">
                  <CreditCard className="h-5 w-5 text-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-text-primary truncate">{sub.service_name}</p>
                  <p className="text-caption text-text-muted">{sub.billing_frequency} · Next: {relativeDate(sub.next_billing_date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-body font-semibold text-text-primary tabular-nums">{formatCurrency(sub.price, sub.currency)}</p>
                  <Badge variant={status.variant} dot>{status.label}</Badge>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === sub.id ? null : sub.id); }} className="rounded-lg p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {showMenu === sub.id && (
                  <div className="absolute right-2 top-16 z-20 w-36 rounded-xl glass-strong glass-highlight shadow-lg py-1 animate-scale-in" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { deleteSub(sub.id); setShowMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateSubModal open={showCreate} onClose={() => { setShowCreate(false); navigate('/subscriptions'); }} onCreated={(sub) => { setSubs(prev => [...prev, sub]); showToast('Subscription added.'); }} />
    </div>
  );
}

function CreateSubModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (s: Subscription) => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDate, setNextDate] = useState(todayISO());
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !price) return;
    setLoading(true);
    const { data, error } = await supabase.from('subscriptions').insert({
      service_name: name, price: parseFloat(price), billing_frequency: frequency,
      next_billing_date: nextDate, category: category || null,
    }).select().single();
    setLoading(false);
    if (error) { showToast('Could not add subscription.', 'error'); return; }
    onCreated(data as Subscription);
    setName(''); setPrice(''); setCategory('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Subscription" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!name.trim() || !price}>Add</Button></>}>
      <div className="space-y-4">
        <Input label="Service name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Netflix, Spotify" autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
          <Select label="Billing frequency" value={frequency} onChange={e => setFrequency(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </div>
        <Input label="Next billing date" type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} />
        <Input label="Category" value={category} onChange={e => setCategory(e.target.value)} placeholder="Entertainment, Software, etc." />
      </div>
    </Modal>
  );
}
