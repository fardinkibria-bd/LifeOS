import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, EmptyState, Skeleton, ProgressBar } from '@/components/ui/index';
import { cn, todayISO, toISODate, addDays, startOfWeek, getWeekDays } from '@/lib/utils';
import type { Habit, HabitEntry } from '@/types';
import { Plus, Sparkles, Trash2, MoreHorizontal, Flame, Check } from 'lucide-react';

export function HabitsPage() {
  const { params, navigate } = useRouter();
  const { showToast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Record<string, HabitEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('habits').select('*').eq('archived', false).order('created_at');
    const habits = (data as Habit[]) || [];

    const entriesMap: Record<string, HabitEntry[]> = {};
    await Promise.all(habits.map(async h => {
      const start = toISODate(addDays(new Date(), -30));
      const { data: entRes } = await supabase.from('habit_entries').select('*').eq('habit_id', h.id).gte('entry_date', start);
      entriesMap[h.id] = (entRes as HabitEntry[]) || [];
    }));
    setEntries(entriesMap);
    setHabits(habits);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (params.new === 'true') setShowCreate(true); }, [params]);

  const toggleToday = async (habit: Habit) => {
    const today = todayISO();
    const existing = entries[habit.id]?.find(e => e.entry_date === today);
    if (existing) {
      await supabase.from('habit_entries').delete().eq('id', existing.id);
      setEntries(prev => ({ ...prev, [habit.id]: (prev[habit.id] || []).filter(e => e.id !== existing.id) }));
    } else {
      const { data } = await supabase.from('habit_entries').insert({ habit_id: habit.id, entry_date: today, value: 1, completed: true }).select().single();
      if (data) setEntries(prev => ({ ...prev, [habit.id]: [...(prev[habit.id] || []), data as HabitEntry] }));
    }
  };

  const isDoneToday = (habitId: string) => entries[habitId]?.some(e => e.entry_date === todayISO()) ?? false;

  const getStreak = (habitId: string): number => {
    const ents = entries[habitId] || [];
    if (ents.length === 0) return 0;
    let streak = 0;
    let date = new Date();
    for (;;) {
      const dateStr = toISODate(date);
      if (ents.some(e => e.entry_date === dateStr)) { streak++; date = addDays(date, -1); }
      else break;
    }
    return streak;
  };

  const deleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    await supabase.from('habits').update({ archived: true }).eq('id', id);
    showToast('Habit archived.');
  };

  const weekDays = getWeekDays(new Date());

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Habits</h1>
          <p className="text-body-sm text-text-secondary"><span className="tabular-nums">{habits.length}</span> active habits</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New habit</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : habits.length === 0 ? (
        <Card className="p-6 animate-fade-in-up"><EmptyState icon={<Sparkles className="h-6 w-6" />} title="No habits yet." description="Build consistency by tracking daily habits." action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New habit</Button>} /></Card>
      ) : (
        <div className="space-y-3">
          {habits.map((habit, i) => {
            const streak = getStreak(habit.id);
            const doneToday = isDoneToday(habit.id);
            const weekCount = weekDays.filter(d => entries[habit.id]?.some(e => e.entry_date === toISODate(d))).length;
            return (
              <div key={habit.id} className="relative rounded-xl glass-medium glass-highlight p-4 hover:-translate-y-0.5 hover:border-border-strong transition-all duration-300 ease-out-quart group animate-stagger-in" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleToday(habit)}
                      className={cn('flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-200 ease-out-quart', doneToday ? 'bg-accent border-accent text-white shadow-glow-sm-primary' : 'border-border-strong text-text-muted hover:border-accent')}
                    >
                      {doneToday ? <Check className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </button>
                    <div>
                      <h3 className="text-body font-semibold text-text-primary">{habit.name}</h3>
                      <p className="text-caption text-text-muted">
                        {habit.frequency_target > 1 ? `${habit.frequency_target}x ${habit.frequency}` : `${habit.frequency}`}
                        {streak > 0 && <span className="text-warning ml-2 flex items-center gap-0.5 inline-flex"><Flame className="h-3 w-3" /> <span className="tabular-nums">{streak}</span> day streak</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-caption text-text-muted"><span className="tabular-nums">{weekCount}</span>/7 this week</span>
                    <button onClick={() => setShowMenu(showMenu === habit.id ? null : habit.id)} className="rounded-lg p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out-quart">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {showMenu === habit.id && (
                      <div className="absolute right-2 top-12 z-20 w-36 rounded-xl glass-strong glass-highlight shadow-lg py-1 animate-scale-in">
                        <button onClick={() => { deleteHabit(habit.id); setShowMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover transition-colors"><Trash2 className="h-3.5 w-3.5" /> Archive</button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Week view */}
                <div className="flex items-center gap-1.5">
                  {weekDays.map((d, idx) => {
                    const done = entries[habit.id]?.some(e => e.entry_date === toISODate(d));
                    return (
                      <div key={idx} className="flex-1 text-center">
                        <div className={cn('h-8 rounded-lg flex items-center justify-center text-caption transition-all duration-200 ease-out-quart', done ? 'bg-accent text-white shadow-glow-sm-primary' : 'glass text-text-muted')}>
                          {done ? <Check className="h-3.5 w-3.5" /> : d.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateHabitModal open={showCreate} onClose={() => { setShowCreate(false); navigate('/habits'); }} onCreated={() => { load(); showToast('Habit created.'); }} />
    </div>
  );
}

function CreateHabitModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [target, setTarget] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('habits').insert({
      name, frequency, frequency_target: parseInt(target) || 1,
    });
    setLoading(false);
    if (error) { showToast('Could not create habit.', 'error'); return; }
    setName(''); setTarget('1');
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Habit" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!name.trim()}>Create</Button></>}>
      <div className="space-y-4">
        <Input label="Habit name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Read 20 minutes" autoFocus />
        <Select label="Frequency" value={frequency} onChange={e => setFrequency(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </Select>
        <Input label="Target (times per period)" type="number" value={target} onChange={e => setTarget(e.target.value)} />
      </div>
    </Modal>
  );
}
