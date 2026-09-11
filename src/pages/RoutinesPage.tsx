import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, EmptyState, Skeleton, Checkbox, ProgressBar } from '@/components/ui/index';
import { cn, todayISO, formatDate, addDays, toISODate } from '@/lib/utils';
import type { Routine, RoutineItem, RoutineCompletion } from '@/types';
import { Plus, Repeat, Trash2, MoreHorizontal, Flame, Pause, Play } from 'lucide-react';

export function RoutinesPage() {
  const { params, navigate } = useRouter();
  const { showToast } = useToast();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [today, setToday] = useState(todayISO());

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('routines').select('*').order('created_at');
    const routines = (data as Routine[]) || [];

    const withItems = await Promise.all(routines.map(async r => {
      const [itemsRes, compRes] = await Promise.all([
        supabase.from('routine_items').select('*').eq('routine_id', r.id).order('sort_order'),
        supabase.from('routine_completions').select('*').eq('routine_id', r.id).eq('completion_date', today).maybeSingle(),
      ]);
      return { ...r, routine_items: (itemsRes.data as RoutineItem[]) || [], completions: compRes.data ? [compRes.data as RoutineCompletion] : [] };
    }));
    setRoutines(withItems);
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (params.new === 'true') setShowCreate(true); }, [params]);

  const toggleItem = async (routine: Routine, item: RoutineItem) => {
    const completion = routine.completions?.[0];
    if (!completion) {
      const { data } = await supabase.from('routine_completions').insert({
        routine_id: routine.id, completion_date: today, completed_items: [item.id], completed: false,
      }).select().single();
      if (data) setRoutines(prev => prev.map(r => r.id === routine.id ? { ...r, completions: [data as RoutineCompletion] } : r));
      return;
    }
    const items = completion.completed_items || [];
    const newItems = items.includes(item.id) ? items.filter(id => id !== item.id) : [...items, item.id];
    const allDone = routine.routine_items?.every(i => newItems.includes(i.id)) ?? false;
    await supabase.from('routine_completions').update({ completed_items: newItems, completed: allDone }).eq('id', completion.id);
    setRoutines(prev => prev.map(r => r.id === routine.id ? { ...r, completions: [{ ...completion, completed_items: newItems, completed: allDone }] } : r));
  };

  const togglePause = async (routine: Routine) => {
    const paused = !routine.paused;
    setRoutines(prev => prev.map(r => r.id === routine.id ? { ...r, paused } : r));
    await supabase.from('routines').update({ paused }).eq('id', routine.id);
    showToast(paused ? 'Routine paused.' : 'Routine resumed.');
  };

  const deleteRoutine = async (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
    await supabase.from('routines').delete().eq('id', id);
    showToast('Routine deleted.');
  };

  const getStreak = async (routine: Routine): Promise<number> => {
    const { data } = await supabase.from('routine_completions').select('completion_date, completed').eq('routine_id', routine.id).eq('completed', true).order('completion_date', { ascending: false });
    if (!data || data.length === 0) return 0;
    let streak = 0;
    let date = new Date();
    for (const comp of data as RoutineCompletion[]) {
      if (comp.completion_date === toISODate(date)) { streak++; date = addDays(date, -1); }
      else break;
    }
    return streak;
  };

  const [streaks, setStreaks] = useState<Record<string, number>>({});
  useEffect(() => {
    routines.forEach(async r => {
      const s = await getStreak(r);
      setStreaks(prev => ({ ...prev, [r.id]: s }));
    });
  }, [routines]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Routines</h1>
          <p className="text-body-sm text-text-secondary">{routines.filter(r => !r.paused).length} active</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New routine</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : routines.length === 0 ? (
        <Card className="p-6 animate-fade-in-up"><EmptyState icon={<Repeat className="h-6 w-6" />} title="No routines yet." description="Create a routine to build consistency in your daily life." action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New routine</Button>} /></Card>
      ) : (
        <div className="space-y-4">
          {routines.map((routine, i) => {
            const completion = routine.completions?.[0];
            const completedItems = completion?.completed_items || [];
            const items = routine.routine_items || [];
            const completedCount = completedItems.length;
            const pct = items.length > 0 ? (completedCount / items.length) * 100 : 0;
            return (
              <div key={routine.id} className={cn('rounded-xl glass-medium glass-highlight shadow-md p-5 animate-stagger-in transition-all duration-300 ease-out-quart', routine.paused && 'opacity-60')} style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl glass text-accent">
                      <Repeat className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-body font-semibold text-text-primary">{routine.name}</h3>
                      <p className="text-caption text-text-muted">{routine.schedule} · <span className="tabular-nums">{completedCount}</span> / <span className="tabular-nums">{items.length}</span> complete</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {streaks[routine.id] > 0 && (
                      <div className="flex items-center gap-1 text-caption text-warning">
                        <Flame className="h-3.5 w-3.5" /> <span className="tabular-nums">{streaks[routine.id]}</span> day streak
                      </div>
                    )}
                    <button onClick={() => togglePause(routine)} className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all duration-200 ease-out-quart">
                      {routine.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setShowMenu(showMenu === routine.id ? null : routine.id)} className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all duration-200 ease-out-quart">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {showMenu === routine.id && (
                      <div className="absolute right-8 top-16 z-20 w-36 rounded-xl glass-strong glass-highlight shadow-lg py-1 animate-scale-in">
                        <button onClick={() => { deleteRoutine(routine.id); setShowMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </div>
                    )}
                  </div>
                </div>
                {items.length > 0 && <ProgressBar value={pct} variant="brand" className="mb-3" />}
                <div className="space-y-1">
                  {items.map((item, idx) => (
                    <div key={item.id} onClick={() => !routine.paused && toggleItem(routine, item)} className={cn('flex items-center gap-2.5 rounded-lg p-2 transition-all duration-200 ease-out-quart', !routine.paused && 'cursor-pointer hover:bg-surface-hover')}>
                      <Checkbox checked={completedItems.includes(item.id)} onChange={() => {}} />
                      <span className={cn('text-body-sm', completedItems.includes(item.id) ? 'text-text-muted line-through' : 'text-text-primary')}>{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateRoutineModal open={showCreate} onClose={() => { setShowCreate(false); navigate('/routines'); }} onCreated={() => { load(); showToast('Routine created.'); }} />
    </div>
  );
}

function CreateRoutineModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('daily');
  const [items, setItems] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { data: routine } = await supabase.from('routines').insert({ name, schedule }).select().single();
    if (routine) {
      const validItems = items.filter(i => i.trim());
      if (validItems.length > 0) {
        await supabase.from('routine_items').insert(validItems.map((title, i) => ({ routine_id: routine.id, title, sort_order: i })));
      }
    }
    setLoading(false);
    setName(''); setItems(['']);
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Routine" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!name.trim()}>Create</Button></>}>
      <div className="space-y-4">
        <Input label="Routine name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning Routine" autoFocus />
        <Select label="Schedule" value={schedule} onChange={e => setSchedule(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekends">Weekends</option>
          <option value="weekly">Weekly</option>
        </Select>
        <div>
          <label className="text-body-sm font-medium text-text-secondary mb-1.5 block">Checklist items</label>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={item}
                  onChange={e => setItems(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                  placeholder={`Item ${i + 1}`}
                  className="h-9 flex-1 rounded-xl glass px-3 text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                />
                {items.length > 1 && <button onClick={() => setItems(prev => prev.filter((_, j) => j !== i))} className="text-text-muted hover:text-danger px-2 transition-colors"><Trash2 className="h-4 w-4" /></button>}
              </div>
            ))}
            <button onClick={() => setItems(prev => [...prev, ''])} className="text-body-sm text-accent font-medium hover:underline transition-colors">+ Add item</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
