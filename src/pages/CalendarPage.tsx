import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Card, EmptyState, Checkbox } from '@/components/ui/index';
import { cn, sameDay, toISODate, formatTime, formatDate, getMonthGrid, getWeekDays, startOfWeek, addDays, addMonths, todayISO } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import {
  Plus, ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, MapPin, Trash2, X,
} from 'lucide-react';

type View = 'month' | 'week' | 'day' | 'agenda';

export function CalendarPage() {
  const { profile } = useAuth();
  const { params, navigate } = useRouter();
  const { showToast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createDate, setCreateDate] = useState<string>(todayISO());

  const load = useCallback(async () => {
    setLoading(true);
    const start = toISODate(addDays(startOfWeek(currentDate, profile?.week_start === 'monday' ? 'monday' : 'sunday'), -7));
    const end = toISODate(addDays(currentDate, 35));
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('trashed', false)
      .eq('archived', false)
      .gte('start_date', start)
      .lte('start_date', end)
      .order('start_date, start_time');
    setEvents((data as CalendarEvent[]) || []);
    setLoading(false);
  }, [currentDate, profile?.week_start]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (params.new === 'true') { setCreateDate(params.date || todayISO()); setShowCreate(true); }
    if (params.id) {
      const event = events.find(e => e.id === params.id);
      if (event) setSelectedEvent(event);
    }
  }, [params, events]);

  const eventsForDay = (date: Date) => events.filter(e => sameDay(new Date(e.start_date + 'T00:00:00'), date));

  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (selectedEvent?.id === id) { setSelectedEvent(null); navigate('/calendar'); }
    await supabase.from('events').update({ trashed: true }).eq('id', id);
    showToast('Event deleted.');
  };

  const updateEvent = async (updates: Partial<CalendarEvent>) => {
    if (!selectedEvent) return;
    const updated = { ...selectedEvent, ...updates };
    setSelectedEvent(updated);
    setEvents(prev => prev.map(e => e.id === selectedEvent.id ? updated : e));
    await supabase.from('events').update(updates).eq('id', selectedEvent.id);
  };

  const navigateDate = (dir: number) => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, dir));
    else if (view === 'week') setCurrentDate(addDays(currentDate, dir * 7));
    else if (view === 'day') setCurrentDate(addDays(currentDate, dir));
    else setCurrentDate(addDays(currentDate, dir * 7));
  };

  const weekStart = profile?.week_start === 'monday' ? 'monday' : 'sunday';
  const today = new Date();
  const isToday = (d: Date) => sameDay(d, today);

  const headerLabel = (() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (view === 'month' || view === 'agenda') return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'week') {
      const days = getWeekDays(currentDate, weekStart);
      return `${formatDate(days[0], 'MMM D')} – ${formatDate(days[6], 'MMM D, YYYY')}`;
    }
    return formatDate(currentDate, 'dddd, MMMM D');
  })();

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-primary font-bold">Calendar</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => navigateDate(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-hover transition-all duration-200 ease-out-quart"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="rounded-lg px-3 py-1 text-body-sm font-medium text-text-secondary hover:bg-surface-hover transition-all duration-200 ease-out-quart">Today</button>
            <button onClick={() => navigateDate(1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-hover transition-all duration-200 ease-out-quart"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl glass p-0.5">
            {(['month', 'week', 'day', 'agenda'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)} className={cn('rounded-lg px-3 py-1.5 text-body-sm font-medium capitalize transition-all duration-200 ease-out-quart', view === v ? 'glass-medium glass-highlight text-accent shadow-glow-sm-primary' : 'text-text-secondary hover:bg-surface-hover')}>{v}</button>
            ))}
          </div>
          <Button onClick={() => { setCreateDate(toISODate(currentDate)); setShowCreate(true); }}><Plus className="h-4 w-4" /> Event</Button>
        </div>
      </div>

      <p className="text-h3 text-text-primary font-semibold mb-4 animate-fade-in-up" style={{ animationDelay: '60ms' }}>{headerLabel}</p>

      {loading ? (
        <div className="h-96 skeleton rounded-xl" />
      ) : view === 'month' ? (
        <MonthView currentDate={currentDate} weekStart={weekStart} eventsForDay={eventsForDay} isToday={isToday} onDayClick={(d: Date) => { setCreateDate(toISODate(d)); setShowCreate(true); }} onEventClick={setSelectedEvent} />
      ) : view === 'week' ? (
        <WeekView currentDate={currentDate} weekStart={weekStart} eventsForDay={eventsForDay} isToday={isToday} onEventClick={setSelectedEvent} />
      ) : view === 'day' ? (
        <DayView currentDate={currentDate} events={eventsForDay(currentDate)} onEventClick={setSelectedEvent} onCreate={() => { setCreateDate(toISODate(currentDate)); setShowCreate(true); }} />
      ) : (
        <AgendaView events={events} currentDate={currentDate} onEventClick={setSelectedEvent} />
      )}

      <CreateEventModal open={showCreate} onClose={() => { setShowCreate(false); navigate('/calendar'); }} initialDate={createDate} onCreated={(event) => { setEvents(prev => [...prev, event]); showToast('Event created.'); }} />
      <Drawer open={!!selectedEvent} onClose={() => { setSelectedEvent(null); navigate('/calendar'); }} title="Event Details" width="max-w-lg">
        {selectedEvent && <EventDetail event={selectedEvent} onUpdate={updateEvent} onDelete={deleteEvent} profile={profile} />}
      </Drawer>
    </div>
  );
}

function MonthView({ currentDate, weekStart, eventsForDay, isToday, onDayClick, onEventClick }: any) {
  const grid = getMonthGrid(currentDate, weekStart);
  const dayLabels = weekStart === 'monday' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentMonth = currentDate.getMonth();

  return (
    <div className="rounded-xl glass overflow-hidden animate-fade-in-up" style={{ animationDelay: '90ms' }}>
      <div className="grid grid-cols-7 border-b border-border bg-surface-hover/50">
        {dayLabels.map(d => <div key={d} className="px-2 py-2 text-center text-caption font-semibold text-text-muted uppercase">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((date: Date, i: number) => {
          const dayEvents = eventsForDay(date);
          const inMonth = date.getMonth() === currentMonth;
          return (
            <div
              key={i}
              onClick={() => onDayClick(date)}
              className={cn('min-h-[80px] sm:min-h-[100px] border-r border-b border-border p-1.5 cursor-pointer hover:bg-surface-hover transition-all duration-200 ease-out-quart', !inMonth && 'opacity-40', i % 7 === 6 && 'border-r-0')}
            >
              <div className={cn('flex h-6 w-6 items-center justify-center rounded-full text-caption transition-all duration-200 ease-out-quart', isToday(date) ? 'bg-accent text-white font-semibold shadow-glow-sm-primary' : 'text-text-secondary')}>{date.getDate()}</div>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((e: CalendarEvent) => (
                  <div key={e.id} onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }} className={cn('truncate rounded px-1.5 py-0.5 text-caption transition-all duration-200 ease-out-quart', e.all_day ? 'bg-accent/10 text-accent' : 'bg-info/10 text-info')}>
                    {e.all_day ? e.title : `${formatTime(e.start_time)} ${e.title}`}
                  </div>
                ))}
                {dayEvents.length > 3 && <div className="text-caption text-text-muted px-1.5">+{dayEvents.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, weekStart, eventsForDay, isToday, onEventClick }: any) {
  const days = getWeekDays(currentDate, weekStart);
  const dayLabels = weekStart === 'monday' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-xl glass overflow-hidden animate-fade-in-up" style={{ animationDelay: '90ms' }}>
      <div className="grid grid-cols-7 border-b border-border bg-surface-hover/50">
        {days.map((d: Date, i: number) => (
          <div key={i} className="px-2 py-2 text-center border-r border-border last:border-r-0">
            <div className="text-caption font-semibold text-text-muted uppercase">{dayLabels[i]}</div>
            <div className={cn('text-body-sm font-semibold mt-0.5', isToday(d) ? 'text-accent' : 'text-text-primary')}>{d.getDate()}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date: Date, i: number) => {
          const dayEvents = eventsForDay(date);
          return (
            <div key={i} className={cn('min-h-[200px] border-r border-border last:border-r-0 p-1.5 space-y-1 transition-all duration-200 ease-out-quart', isToday(date) && 'bg-accent/5')}>
              {dayEvents.length === 0 ? (
                <div className="h-full" />
              ) : dayEvents.map((e: CalendarEvent) => (
                <div key={e.id} onClick={() => onEventClick(e)} className={cn('rounded-lg border p-2 cursor-pointer transition-all duration-200 ease-out-quart hover:-translate-y-0.5 hover:shadow-md', e.all_day ? 'border-accent/20 bg-accent/10' : 'border-border glass hover:border-border-strong')}>
                  <p className="text-body-sm font-medium text-text-primary truncate">{e.title}</p>
                  <p className="text-caption text-text-muted">{e.all_day ? 'All day' : formatTime(e.start_time)}</p>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ currentDate, events, onEventClick, onCreate }: any) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="rounded-xl glass overflow-hidden animate-fade-in-up" style={{ animationDelay: '90ms' }}>
      <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
        {hours.map(h => {
          const hourEvents = events.filter((e: CalendarEvent) => {
            if (e.all_day) return false;
            const eventHour = parseInt(e.start_time?.split(':')[0] || '0');
            return eventHour === h;
          });
          const allDayEvents = events.filter((e: CalendarEvent) => e.all_day);
          return (
            <div key={h} className="flex border-b border-border last:border-b-0 min-h-[48px]">
              <div className="w-16 shrink-0 px-2 py-1 text-caption text-text-muted border-r border-border tabular-nums">{h === 0 ? '' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}</div>
              <div className="flex-1 p-1 space-y-1 relative">
                {h === 0 && allDayEvents.map((e: CalendarEvent) => (
                  <div key={e.id} onClick={() => onEventClick(e)} className="rounded-lg border border-accent/20 bg-accent/10 p-2 cursor-pointer transition-all duration-200 ease-out-quart hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-body-sm font-medium text-text-primary">{e.title}</p>
                    <p className="text-caption text-text-muted">All day</p>
                  </div>
                ))}
                {hourEvents.map((e: CalendarEvent) => (
                  <div key={e.id} onClick={() => onEventClick(e)} className="rounded-lg glass-medium glass-highlight p-2 cursor-pointer hover:-translate-y-0.5 hover:border-border-strong transition-all duration-200 ease-out-quart hover:shadow-md">
                    <p className="text-body-sm font-medium text-text-primary">{e.title}</p>
                    <p className="text-caption text-text-muted tabular-nums">{formatTime(e.start_time)} – {formatTime(e.end_time)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView({ events, currentDate, onEventClick }: any) {
  const sorted = [...events].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const grouped: Record<string, CalendarEvent[]> = {};
  sorted.forEach((e: CalendarEvent) => {
    const key = e.start_date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });
  const dates = Object.keys(grouped).sort();

  if (dates.length === 0) {
    return <Card className="p-6 animate-fade-in-up"><EmptyState icon={<CalIcon className="h-6 w-6" />} title="No upcoming events." description="Your calendar is clear." /></Card>;
  }

  return (
    <div className="space-y-6">
      {dates.map((date, di) => (
        <div key={date} style={{ animationDelay: `${di * 40}ms` }} className="animate-stagger-in">
          <h2 className="text-body-sm font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">{formatDate(date, 'dddd, MMMM D')}</h2>
          <div className="space-y-1">
            {grouped[date].map((e: CalendarEvent, ei: number) => (
              <div key={e.id} style={{ animationDelay: `${(di * 5 + ei) * 30}ms` }} onClick={() => onEventClick(e)} className="flex items-center gap-3 rounded-xl glass p-3 hover:-translate-y-0.5 hover:border-border-strong transition-all duration-200 ease-out-quart cursor-pointer animate-stagger-in">
                <div className="w-20 shrink-0">
                  <p className="text-body-sm font-medium text-text-primary tabular-nums">{e.all_day ? 'All day' : formatTime(e.start_time)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-text-primary truncate">{e.title}</p>
                  {e.location && <p className="text-caption text-text-muted truncate">{e.location}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateEventModal({ open, onClose, initialDate, onCreated }: { open: boolean; onClose: () => void; initialDate: string; onCreated: (e: CalendarEvent) => void }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) setStartDate(initialDate); }, [initialDate, open]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from('events').insert({
      title, start_date: startDate, end_date: null,
      start_time: allDay ? null : startTime, end_time: allDay ? null : endTime,
      all_day: allDay, location: location || null, description: description || null,
    }).select().single();
    setLoading(false);
    if (error) { showToast('Could not create event.', 'error'); return; }
    onCreated(data as CalendarEvent);
    setTitle(''); setLocation(''); setDescription('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Event" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!title.trim()}>Create</Button></>}>
      <div className="space-y-4">
        <Input label="Event title" value={title} onChange={e => setTitle(e.target.value)} placeholder="What's the event?" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
        <Input label="Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <label className="flex items-center gap-2 text-body-sm text-text-secondary">
          <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded border-border" /> All day
        </label>
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <Input label="End time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        )}
        <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Where?" />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Add details..." rows={2} />
      </div>
    </Modal>
  );
}

function EventDetail({ event, onUpdate, onDelete, profile }: { event: CalendarEvent; onUpdate: (u: Partial<CalendarEvent>) => void; onDelete: (id: string) => void; profile: any }) {
  const [showDelete, setShowDelete] = useState(false);
  return (
    <div className="space-y-5">
      <input value={event.title} onChange={e => onUpdate({ title: e.target.value })} className="w-full bg-transparent text-h4 font-semibold text-text-primary focus:outline-none" />

      <Input label="Date" type="date" value={event.start_date} onChange={e => onUpdate({ start_date: e.target.value })} />

      <label className="flex items-center gap-2 text-body-sm text-text-secondary">
        <input type="checkbox" checked={event.all_day} onChange={e => onUpdate({ all_day: e.target.checked, start_time: e.target.checked ? null : event.start_time || '09:00', end_time: e.target.checked ? null : event.end_time || '10:00' })} className="rounded border-border" /> All day event
      </label>

      {!event.all_day && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start time" type="time" value={event.start_time || ''} onChange={e => onUpdate({ start_time: e.target.value })} />
          <Input label="End time" type="time" value={event.end_time || ''} onChange={e => onUpdate({ end_time: e.target.value })} />
        </div>
      )}

      <Input label="Location" value={event.location || ''} onChange={e => onUpdate({ location: e.target.value || null })} placeholder="Where?" />

      <Textarea label="Description" value={event.description || ''} onChange={e => onUpdate({ description: e.target.value })} rows={3} />

      <Select label="Repeat" value={event.recurrence_rule || ''} onChange={e => onUpdate({ recurrence_rule: e.target.value || null })}>
        <option value="">Does not repeat</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="biweekly">Biweekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </Select>

      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
      </div>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete event?" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button><Button variant="danger" onClick={() => { onDelete(event.id); setShowDelete(false); }}>Delete</Button></>}>
        <p className="text-body-sm text-text-secondary">This event will be moved to trash.</p>
      </Modal>
    </div>
  );
}
