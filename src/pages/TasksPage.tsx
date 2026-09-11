import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { Card, EmptyState, Checkbox, Badge } from '@/components/ui/index';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { cn, isOverdue, isToday, relativeDate, formatTime, formatDate, todayISO } from '@/lib/utils';
import type { Task, Subtask, Priority, TaskStatus } from '@/types';
import {
  Plus, Search, Filter, MoreHorizontal, Trash2, Archive, Copy,
  CheckSquare, Clock, Flag, Calendar, X,
} from 'lucide-react';

type FilterType = 'all' | 'today' | 'overdue' | 'upcoming' | 'completed';

export function TasksPage() {
  const { profile } = useAuth();
  const { params, navigate } = useRouter();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('tasks').select('*').eq('trashed', false).order('due_date', { ascending: true, nullsFirst: false });

    if (filter === 'completed') query = query.eq('status', 'completed');
    else if (filter === 'today') query = query.neq('status', 'completed').eq('due_date', todayISO());
    else query = query.neq('status', 'completed');

    const { data } = await query;
    setTasks((data as Task[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (params.new === 'true') setShowCreate(true);
    if (params.id) {
      const task = tasks.find(t => t.id === params.id);
      if (task) openTask(task);
    }
  }, [params, tasks]);

  const openTask = async (task: Task) => {
    setSelectedTask(task);
    const { data } = await supabase.from('subtasks').select('*').eq('task_id', task.id).order('sort_order');
    setSubtasks((data as Subtask[]) || []);
  };

  const filteredTasks = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (filter === 'overdue') return t.due_date && isOverdue(t.due_date);
    if (filter === 'upcoming') return t.due_date && !isOverdue(t.due_date) && !isToday(t.due_date);
    return true;
  });

  const grouped = {
    overdue: filteredTasks.filter(t => t.due_date && isOverdue(t.due_date)),
    today: filteredTasks.filter(t => t.due_date && isToday(t.due_date)),
    upcoming: filteredTasks.filter(t => t.due_date && !isOverdue(t.due_date) && !isToday(t.due_date)),
    nodate: filteredTasks.filter(t => !t.due_date),
  };

  const toggleTask = async (id: string, completed: boolean) => {
    const status: TaskStatus = completed ? 'completed' : 'not_started';
    const completed_at = completed ? new Date().toISOString() : null;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, completed_at } : t));
    if (selectedTask?.id === id) setSelectedTask({ ...selectedTask, status, completed_at });
    await supabase.from('tasks').update({ status, completed_at }).eq('id', id);
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTask?.id === id) { setSelectedTask(null); navigate('/tasks'); }
    await supabase.from('tasks').update({ trashed: true }).eq('id', id);
    showToast('Task deleted.');
  };

  const archiveTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTask?.id === id) { setSelectedTask(null); navigate('/tasks'); }
    await supabase.from('tasks').update({ archived: true }).eq('id', id);
    showToast('Task archived.');
  };

  const duplicateTask = async (task: Task) => {
    const { id, created_at, updated_at, completed_at, ...rest } = task;
    const { data } = await supabase.from('tasks').insert({ ...rest, title: `${task.title} (copy)`, status: 'not_started', completed_at: null }).select().single();
    if (data) { setTasks(prev => [...prev, data as Task]); showToast('Task duplicated.'); }
  };

  const toggleSubtask = async (id: string, completed: boolean) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, completed } : s));
    await supabase.from('subtasks').update({ completed }).eq('id', id);
  };

  const addSubtask = async (title: string) => {
    if (!selectedTask || !title.trim()) return;
    const { data } = await supabase.from('subtasks').insert({ task_id: selectedTask.id, title, sort_order: subtasks.length }).select().single();
    if (data) setSubtasks(prev => [...prev, data as Subtask]);
  };

  const deleteSubtask = async (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
    await supabase.from('subtasks').delete().eq('id', id);
  };

  const updateTask = async (updates: Partial<Task>) => {
    if (!selectedTask) return;
    const updated = { ...selectedTask, ...updates };
    setSelectedTask(updated);
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? updated : t));
    await supabase.from('tasks').update(updates).eq('id', selectedTask.id);
  };

  const filters: { id: FilterType; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'today', label: 'Today', count: grouped.today.length },
    { id: 'overdue', label: 'Overdue', count: grouped.overdue.length },
    { id: 'upcoming', label: 'Upcoming', count: grouped.upcoming.length },
    { id: 'completed', label: 'Completed' },
  ];

  const priorityBadge: Record<Priority, { variant: 'danger' | 'warning' | 'neutral' | 'info'; label: string }> = {
    urgent: { variant: 'danger', label: 'Urgent' },
    high: { variant: 'warning', label: 'High' },
    medium: { variant: 'info', label: 'Medium' },
    low: { variant: 'neutral', label: 'Low' },
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Tasks</h1>
          <p className="text-body-sm text-text-secondary">{tasks.filter(t => t.status !== 'completed').length} open · {tasks.filter(t => t.status === 'completed').length} completed</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add task</Button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-2 mb-4 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="h-9 w-full rounded-xl glass-medium glass-highlight pl-9 pr-3 text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200 ease-out-quart"
          />
        </div>
        <Button variant="outline" size="md" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-thin -mx-1 px-1 animate-fade-in-up" style={{ animationDelay: '90ms' }}>
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm font-medium whitespace-nowrap transition-all duration-200 ease-out-quart',
              filter === f.id ? 'glass-medium glass-highlight text-accent shadow-glow-sm-primary' : 'text-text-secondary hover:bg-surface-hover'
            )}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && <span className={cn('text-caption', filter === f.id ? 'text-accent' : 'text-text-muted')}>{f.count}</span>}
          </button>
        ))}
      </div>

      {/* Priority filter */}
      {showFilters && (
        <div className="flex items-center gap-2 mb-4 animate-fade-in-up">
          <Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="w-auto">
            <option value="all">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="p-6 animate-fade-in-up">
          <EmptyState
            icon={<CheckSquare className="h-6 w-6" />}
            title={filter === 'completed' ? "No completed tasks yet." : "Your task list is clear."}
            description={filter === 'completed' ? "Completed tasks will show up here." : "Nothing needs your attention here."}
            action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add task</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.overdue.length > 0 && <TaskGroup label="Overdue" tasks={grouped.overdue} onToggle={toggleTask} onClick={openTask} onMenu={setShowMenu} showMenu={showMenu} onDelete={deleteTask} onArchive={archiveTask} onDuplicate={duplicateTask} overdue priorityBadge={priorityBadge} />}
          {grouped.today.length > 0 && <TaskGroup label="Today" tasks={grouped.today} onToggle={toggleTask} onClick={openTask} onMenu={setShowMenu} showMenu={showMenu} onDelete={deleteTask} onArchive={archiveTask} onDuplicate={duplicateTask} priorityBadge={priorityBadge} />}
          {grouped.upcoming.length > 0 && <TaskGroup label="Upcoming" tasks={grouped.upcoming} onToggle={toggleTask} onClick={openTask} onMenu={setShowMenu} showMenu={showMenu} onDelete={deleteTask} onArchive={archiveTask} onDuplicate={duplicateTask} priorityBadge={priorityBadge} />}
          {grouped.nodate.length > 0 && <TaskGroup label="No date" tasks={grouped.nodate} onToggle={toggleTask} onClick={openTask} onMenu={setShowMenu} showMenu={showMenu} onDelete={deleteTask} onArchive={archiveTask} onDuplicate={duplicateTask} priorityBadge={priorityBadge} />}
        </div>
      )}

      {/* Create modal */}
      <CreateTaskModal open={showCreate} onClose={() => { setShowCreate(false); navigate('/tasks'); }} onCreated={(task) => { setTasks(prev => [...prev, task]); showToast('Task created.'); }} />

      {/* Detail drawer */}
      <Drawer open={!!selectedTask} onClose={() => { setSelectedTask(null); navigate('/tasks'); }} title="Task Details" width="max-w-lg">
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            subtasks={subtasks}
            profile={profile}
            onToggle={toggleTask}
            onUpdate={updateTask}
            onToggleSubtask={toggleSubtask}
            onAddSubtask={addSubtask}
            onDeleteSubtask={deleteSubtask}
            onDelete={deleteTask}
            onArchive={archiveTask}
          />
        )}
      </Drawer>
    </div>
  );
}

function TaskGroup({ label, tasks, onToggle, onClick, onMenu, showMenu, onDelete, onArchive, onDuplicate, overdue, priorityBadge }: {
  label: string; tasks: Task[]; onToggle: (id: string, c: boolean) => void; onClick: (t: Task) => void;
  onMenu: (id: string | null) => void; showMenu: string | null; onDelete: (id: string) => void; onArchive: (id: string) => void; onDuplicate: (t: Task) => void;
  overdue?: boolean; priorityBadge: Record<Priority, { variant: any; label: string }>;
}) {
  return (
    <div>
      <h2 className="text-body-sm font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">{label} · {tasks.length}</h2>
      <div className="space-y-1">
        {tasks.map((task, i) => (
          <div key={task.id} style={{ animationDelay: `${i * 30}ms` }} className="relative flex items-center gap-3 rounded-xl glass p-3 hover:-translate-y-0.5 hover:border-border-strong transition-all duration-200 ease-out-quart group animate-stagger-in">
            <Checkbox checked={task.status === 'completed'} onChange={(c) => onToggle(task.id, c)} />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick(task)}>
              <p className={cn('text-body-sm font-medium truncate', task.status === 'completed' ? 'text-text-muted line-through' : 'text-text-primary')}>{task.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {task.due_date && <span className={cn('text-caption', overdue ? 'text-danger' : 'text-text-muted')}>{relativeDate(task.due_date)}{task.due_time ? ` · ${formatTime(task.due_time)}` : ''}</span>}
                {task.category && <span className="text-caption text-text-muted">· {task.category}</span>}
              </div>
            </div>
            <Badge variant={priorityBadge[task.priority].variant} dot>{priorityBadge[task.priority].label}</Badge>
            <button onClick={(e) => { e.stopPropagation(); onMenu(showMenu === task.id ? null : task.id); }} className="rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-surface-hover opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out-quart">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showMenu === task.id && (
              <div className="absolute right-2 top-12 z-20 w-44 rounded-xl glass-strong shadow-lg py-1 animate-scale-in" onClick={e => e.stopPropagation()}>
                <button onClick={() => { onDuplicate(task); onMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-text-secondary hover:bg-surface-hover transition-colors"><Copy className="h-3.5 w-3.5" /> Duplicate</button>
                <button onClick={() => { onArchive(task.id); onMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-text-secondary hover:bg-surface-hover transition-colors"><Archive className="h-3.5 w-3.5" /> Archive</button>
                <button onClick={() => { onDelete(task.id); onMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskDetail({ task, subtasks, profile, onToggle, onUpdate, onToggleSubtask, onAddSubtask, onDeleteSubtask, onDelete, onArchive }: {
  task: Task; subtasks: Subtask[]; profile: any; onToggle: (id: string, c: boolean) => void; onUpdate: (u: Partial<Task>) => void;
  onToggleSubtask: (id: string, c: boolean) => void; onAddSubtask: (t: string) => void; onDeleteSubtask: (id: string) => void;
  onDelete: (id: string) => void; onArchive: (id: string) => void;
}) {
  const [newSubtask, setNewSubtask] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const completedSubs = subtasks.filter(s => s.completed).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Checkbox checked={task.status === 'completed'} onChange={(c) => onToggle(task.id, c)} className="mt-1" />
        <input
          value={task.title}
          onChange={e => onUpdate({ title: e.target.value })}
          className={cn('flex-1 bg-transparent text-h4 font-semibold text-text-primary focus:outline-none', task.status === 'completed' && 'line-through text-text-muted')}
        />
      </div>

      <Textarea label="Description" value={task.description || ''} onChange={e => onUpdate({ description: e.target.value })} placeholder="Add details..." rows={3} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Due date" type="date" value={task.due_date || ''} onChange={e => onUpdate({ due_date: e.target.value || null })} />
        <Input label="Due time" type="time" value={task.due_time || ''} onChange={e => onUpdate({ due_time: e.target.value || null })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="Priority" value={task.priority} onChange={e => onUpdate({ priority: e.target.value as Priority })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
        <Select label="Status" value={task.status} onChange={e => onUpdate({ status: e.target.value as TaskStatus })}>
          <option value="not_started">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      <Input label="Category" value={task.category || ''} onChange={e => onUpdate({ category: e.target.value || null })} placeholder="e.g. Personal, Work" />

      <Select label="Repeat" value={task.recurrence_rule || ''} onChange={e => onUpdate({ recurrence_rule: e.target.value || null })}>
        <option value="">Does not repeat</option>
        <option value="daily">Daily</option>
        <option value="weekdays">Every weekday</option>
        <option value="weekly">Weekly</option>
        <option value="biweekly">Biweekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </Select>

      {/* Subtasks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-body-sm font-medium text-text-secondary">Subtasks</label>
          {subtasks.length > 0 && <span className="text-caption text-text-muted">{completedSubs} / {subtasks.length} done</span>}
        </div>
        <div className="space-y-1">
          {subtasks.map(sub => (
            <div key={sub.id} className="flex items-center gap-2 rounded-lg glass p-2 group transition-all duration-200 ease-out-quart">
              <Checkbox checked={sub.completed} onChange={(c) => onToggleSubtask(sub.id, c)} />
              <span className={cn('flex-1 text-body-sm', sub.completed ? 'text-text-muted line-through' : 'text-text-primary')}>{sub.title}</span>
              <button onClick={() => onDeleteSubtask(sub.id)} className="text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out-quart"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onAddSubtask(newSubtask); setNewSubtask(''); } }}
              placeholder="Add subtask..."
              className="h-8 flex-1 rounded-lg glass-medium glass-highlight px-2.5 text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200 ease-out-quart"
            />
            {newSubtask && <Button size="sm" variant="secondary" onClick={() => { onAddSubtask(newSubtask); setNewSubtask(''); }}>Add</Button>}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Button variant="outline" size="sm" onClick={() => onArchive(task.id)}><Archive className="h-3.5 w-3.5" /> Archive</Button>
        <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
      </div>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete task?" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button><Button variant="danger" onClick={() => { onDelete(task.id); setShowDelete(false); }}>Delete</Button></>}
      >
        <p className="text-body-sm text-text-secondary">This task will be moved to trash. You can restore it later.</p>
      </Modal>
    </div>
  );
}

function CreateTaskModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (task: Task) => void }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => { setTitle(''); setDueDate(''); setDueTime(''); setPriority('medium'); setCategory(''); setDescription(''); setShowAdvanced(false); };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from('tasks').insert({
      title, description: description || null, due_date: dueDate || null, due_time: dueTime || null,
      priority, category: category || null,
    }).select().single();
    setLoading(false);
    if (error) { showToast('Could not create task.', 'error'); return; }
    onCreated(data as Task);
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Task" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!title.trim()}>Create task</Button></>}
    >
      <div className="space-y-4">
        <Input label="Task name" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <Select label="Priority" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>
        {showAdvanced ? (
          <div className="space-y-4 animate-fade-in-up">
            <Input label="Due time" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
            <Input label="Category" value={category} onChange={e => setCategory(e.target.value)} placeholder="Personal, Work, etc." />
            <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Add more details..." rows={3} />
          </div>
        ) : (
          <button onClick={() => setShowAdvanced(true)} className="text-body-sm text-accent font-medium hover:underline transition-colors">+ More options</button>
        )}
      </div>
    </Modal>
  );
}
