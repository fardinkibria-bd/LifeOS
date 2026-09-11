import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, EmptyState, Badge, Skeleton } from '@/components/ui/index';
import { cn, relativeDate, formatDate, daysFromNow, todayISO, addDays, toISODate } from '@/lib/utils';
import type { ImportantDate } from '@/types';
import { Plus, Cake, Trash2, MoreHorizontal, Calendar } from 'lucide-react';

export function ImportantDatesPage() {
  const { params, navigate } = useRouter();
  const { showToast } = useToast();
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('important_dates').select('*').order('date', { ascending: true });
    const dates = (data as ImportantDate[]) || [];
    const now = new Date();
    const withNext: (ImportantDate & { nextDate: string; daysUntil: number })[] = dates.map(d => {
      const base = new Date(d.date + 'T00:00:00');
      let next = new Date(base);
      if (d.recurrence === 'yearly') {
        next = new Date(now.getFullYear(), base.getMonth(), base.getDate());
        if (next < now) next = new Date(now.getFullYear() + 1, base.getMonth(), base.getDate());
      } else if (d.recurrence === 'monthly') {
        next = new Date(now.getFullYear(), now.getMonth(), base.getDate());
        if (next < now) next = new Date(now.getFullYear(), now.getMonth() + 1, base.getDate());
      }
      return { ...d, nextDate: toISODate(next), daysUntil: daysFromNow(next) };
    });
    withNext.sort((a, b) => a.daysUntil - b.daysUntil);
    setDates(withNext as any);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (params.new === 'true') setShowCreate(true); }, [params]);

  const deleteDate = async (id: string) => {
    setDates(prev => prev.filter(d => d.id !== id));
    await supabase.from('important_dates').delete().eq('id', id);
    showToast('Date deleted.');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Important Dates</h1>
          <p className="text-body-sm text-text-secondary"><span className="tabular-nums">{dates.length}</span> tracked dates</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add date</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : dates.length === 0 ? (
        <Card className="p-6 animate-fade-in-up"><EmptyState icon={<Cake className="h-6 w-6" />} title="No important dates yet." description="Track birthdays, anniversaries, renewals, and deadlines." action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add date</Button>} /></Card>
      ) : (
        <div className="space-y-2">
          {(dates as any[]).map((d, i) => (
            <div key={d.id} className={cn('group relative flex items-center gap-3 rounded-xl glass-medium glass-highlight p-4 hover:-translate-y-0.5 hover:border-border-strong transition-all duration-200 ease-out-quart animate-stagger-in')} style={{ animationDelay: `${i * 30}ms` }}>
              <div className={cn('flex h-12 w-12 flex-col items-center justify-center rounded-lg shrink-0', d.daysUntil <= 7 ? 'bg-warning/10 text-warning' : 'glass text-accent')}>
                <span className="text-caption font-semibold text-text-muted">{formatDate(d.nextDate, 'MMM').toUpperCase()}</span>
                <span className={cn('text-body font-bold tabular-nums', d.daysUntil <= 7 ? 'text-warning' : 'text-accent')}>{new Date(d.nextDate + 'T00:00:00').getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-text-primary truncate">{d.label}</p>
                <p className="text-caption text-text-muted">{d.recurrence === 'yearly' ? 'Every year' : d.recurrence === 'monthly' ? 'Every month' : 'One-time'} · {relativeDate(d.nextDate)}</p>
              </div>
              {d.daysUntil === 0 && <Badge variant="warning" dot>Today</Badge>}
              {d.daysUntil > 0 && d.daysUntil <= 7 && <Badge variant="warning" dot>Soon</Badge>}
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === d.id ? null : d.id); }} className="rounded-md p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu === d.id && (
                <div className="absolute right-2 top-16 z-20 w-36 rounded-xl glass-strong glass-highlight shadow-lg py-1 animate-scale-in" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { deleteDate(d.id); setShowMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover rounded-lg"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateDateModal open={showCreate} onClose={() => { setShowCreate(false); navigate('/important-dates'); }} onCreated={() => { load(); showToast('Date added.'); }} />
    </div>
  );
}

function CreateDateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToast();
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(todayISO());
  const [recurrence, setRecurrence] = useState('yearly');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!label.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('important_dates').insert({ label, date, recurrence, description: description || null });
    setLoading(false);
    if (error) { showToast('Could not add date.', 'error'); return; }
    setLabel(''); setDescription('');
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Important Date" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!label.trim()}>Add</Button></>}>
      <div className="space-y-4">
        <Input label="Label" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Mom's Birthday" autoFocus />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Select label="Recurrence" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
          <option value="none">One-time</option>
          <option value="yearly">Every year</option>
          <option value="monthly">Every month</option>
        </Select>
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional notes" />
      </div>
    </Modal>
  );
}
