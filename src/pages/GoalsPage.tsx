import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Card, EmptyState, Skeleton, ProgressBar, Checkbox, Badge } from '@/components/ui/index';
import { cn, relativeDate, formatDate, todayISO } from '@/lib/utils';
import type { Goal, GoalMilestone, GoalStatus } from '@/types';
import { Plus, Target, Trash2, MoreHorizontal, Check, Calendar } from 'lucide-react';

export function GoalsPage() {
  const { params, navigate } = useRouter();
  const { showToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Record<string, GoalMilestone[]>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Goal | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('goals').select('*').eq('trashed', false).eq('archived', false).order('created_at');
    const goals = (data as Goal[]) || [];

    const msMap: Record<string, GoalMilestone[]> = {};
    await Promise.all(goals.map(async g => {
      const { data: ms } = await supabase.from('goal_milestones').select('*').eq('goal_id', g.id).order('sort_order');
      msMap[g.id] = (ms as GoalMilestone[]) || [];
    }));
    setMilestones(msMap);
    setGoals(goals);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (params.new === 'true') setShowCreate(true);
    if (params.id) { const g = goals.find(g => g.id === params.id); if (g) openGoal(g); }
  }, [params, goals]);

  const openGoal = (goal: Goal) => setSelected(goal);

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    if (selected?.id === id) { setSelected(null); navigate('/goals'); }
    await supabase.from('goals').update({ trashed: true }).eq('id', id);
    showToast('Goal deleted.');
  };

  const updateGoal = async (updates: Partial<Goal>) => {
    if (!selected) return;
    const updated = { ...selected, ...updates };
    setSelected(updated);
    setGoals(prev => prev.map(g => g.id === selected.id ? updated : g));
    await supabase.from('goals').update(updates).eq('id', selected.id);
  };

  const toggleMilestone = async (ms: GoalMilestone) => {
    if (!selected) return;
    const updated = { ...ms, completed: !ms.completed };
    setMilestones(prev => ({ ...prev, [selected.id]: (prev[selected.id] || []).map(m => m.id === ms.id ? updated : m) }));
    await supabase.from('goal_milestones').update({ completed: updated.completed }).eq('id', ms.id);
    const all = milestones[selected.id] || [];
    const completedCount = all.filter(m => m.id === ms.id ? updated.completed : m.completed).length;
    const pct = all.length > 0 ? (completedCount / all.length) * 100 : 0;
    updateGoal({ progress: pct, current_value: completedCount });
  };

  const addMilestone = async (title: string) => {
    if (!selected || !title.trim()) return;
    const { data } = await supabase.from('goal_milestones').insert({ goal_id: selected.id, title, sort_order: (milestones[selected.id] || []).length }).select().single();
    if (data) setMilestones(prev => ({ ...prev, [selected.id]: [...(prev[selected.id] || []), data as GoalMilestone] }));
  };

  const statusBadge = (s: GoalStatus) => {
    const map = { not_started: { variant: 'neutral' as const, label: 'Not started' }, active: { variant: 'info' as const, label: 'Active' }, paused: { variant: 'warning' as const, label: 'Paused' }, completed: { variant: 'success' as const, label: 'Completed' }, abandoned: { variant: 'neutral' as const, label: 'Abandoned' } };
    return map[s];
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Goals</h1>
          <p className="text-body-sm text-text-secondary"><span className="tabular-nums">{goals.filter(g => g.status === 'active').length}</span> active · <span className="tabular-nums">{goals.filter(g => g.status === 'completed').length}</span> completed</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New goal</Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : goals.length === 0 ? (
        <Card className="p-6 animate-fade-in-up"><EmptyState icon={<Target className="h-6 w-6" />} title="No goals yet." description="Set meaningful goals and track your progress." action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New goal</Button>} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {goals.map((goal, i) => {
            const ms = milestones[goal.id] || [];
            const completedMs = ms.filter(m => m.completed).length;
            const status = statusBadge(goal.status);
            return (
              <div key={goal.id} onClick={() => openGoal(goal)} className="relative rounded-xl glass-medium glass-highlight p-4 cursor-pointer hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg transition-all duration-300 ease-out-quart group animate-stagger-in" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-body font-semibold text-text-primary">{goal.name}</h3>
                  <button onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === goal.id ? null : goal.id); }} className="rounded-lg p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out-quart">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {showMenu === goal.id && (
                    <div className="absolute right-2 top-10 z-20 w-36 rounded-xl glass-strong glass-highlight shadow-lg py-1 animate-scale-in" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { deleteGoal(goal.id); setShowMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    </div>
                  )}
                </div>
                {goal.description && <p className="text-body-sm text-text-secondary mb-3 line-clamp-2">{goal.description}</p>}
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={status.variant} dot>{status.label}</Badge>
                  <span className="text-body-sm font-semibold text-text-primary tabular-nums">{Math.round(goal.progress)}%</span>
                </div>
                <ProgressBar value={goal.progress} variant={goal.progress >= 100 ? 'success' : 'brand'} />
                {ms.length > 0 && <p className="text-caption text-text-muted mt-2"><span className="tabular-nums">{completedMs}</span> / <span className="tabular-nums">{ms.length}</span> milestones · {goal.target_date ? `Target: ${relativeDate(goal.target_date)}` : 'No target date'}</p>}
              </div>
            );
          })}
        </div>
      )}

      <CreateGoalModal open={showCreate} onClose={() => { setShowCreate(false); navigate('/goals'); }} onCreated={() => { load(); showToast('Goal created.'); }} />

      <Drawer open={!!selected} onClose={() => { setSelected(null); navigate('/goals'); }} title="Goal Details" width="max-w-lg">
        {selected && (
          <GoalDetail goal={selected} milestones={milestones[selected.id] || []} onUpdate={updateGoal} onToggleMilestone={toggleMilestone} onAddMilestone={addMilestone} />
        )}
      </Drawer>
    </div>
  );
}

function GoalDetail({ goal, milestones, onUpdate, onToggleMilestone, onAddMilestone }: {
  goal: Goal; milestones: GoalMilestone[]; onUpdate: (u: Partial<Goal>) => void; onToggleMilestone: (m: GoalMilestone) => void; onAddMilestone: (t: string) => void;
}) {
  const [newMs, setNewMs] = useState('');
  const completedMs = milestones.filter(m => m.completed).length;
  const pct = milestones.length > 0 ? (completedMs / milestones.length) * 100 : goal.progress;

  return (
    <div className="space-y-5">
      <input value={goal.name} onChange={e => onUpdate({ name: e.target.value })} className="w-full bg-transparent text-h4 font-semibold text-text-primary focus:outline-none" />
      <Textarea label="Description" value={goal.description || ''} onChange={e => onUpdate({ description: e.target.value })} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Target date" type="date" value={goal.target_date || ''} onChange={e => onUpdate({ target_date: e.target.value || null })} />
        <Select label="Status" value={goal.status} onChange={e => onUpdate({ status: e.target.value as GoalStatus })}>
          <option value="not_started">Not started</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="abandoned">Abandoned</option>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-body-sm font-medium text-text-secondary">Progress</label>
          <span className="text-body-sm font-semibold text-text-primary tabular-nums">{Math.round(pct)}%</span>
        </div>
        <ProgressBar value={pct} variant={pct >= 100 ? 'success' : 'brand'} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-body-sm font-medium text-text-secondary">Milestones</label>
          {milestones.length > 0 && <span className="text-caption text-text-muted"><span className="tabular-nums">{completedMs}</span> / <span className="tabular-nums">{milestones.length}</span> done</span>}
        </div>
        <div className="space-y-1">
          {milestones.map((ms, i) => (
            <div key={ms.id} className="flex items-center gap-2 rounded-xl glass p-2 cursor-pointer hover:bg-surface-hover hover:-translate-y-0.5 transition-all duration-200 ease-out-quart animate-stagger-in" style={{ animationDelay: `${i * 30}ms` }} onClick={() => onToggleMilestone(ms)}>
              <Checkbox checked={ms.completed} onChange={() => {}} />
              <span className={cn('flex-1 text-body-sm', ms.completed ? 'text-text-muted line-through' : 'text-text-primary')}>{ms.title}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input value={newMs} onChange={e => setNewMs(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { onAddMilestone(newMs); setNewMs(''); } }} placeholder="Add milestone..." className="h-8 flex-1 rounded-xl glass px-2.5 text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200" />
            {newMs && <Button size="sm" variant="secondary" onClick={() => { onAddMilestone(newMs); setNewMs(''); }}>Add</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateGoalModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('goals').insert({
      name, description: description || null, target_date: targetDate || null, status: 'active',
    });
    setLoading(false);
    if (error) { showToast('Could not create goal.', 'error'); return; }
    setName(''); setDescription(''); setTargetDate('');
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Goal" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!name.trim()}>Create</Button></>}>
      <div className="space-y-4">
        <Input label="Goal name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Learn Spanish" autoFocus />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Why does this goal matter?" />
        <Input label="Target date" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
      </div>
    </Modal>
  );
}
