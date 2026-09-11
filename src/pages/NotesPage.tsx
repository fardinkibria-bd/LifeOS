import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, EmptyState, GlassCard, Skeleton } from '@/components/ui/index';
import { cn, formatDate } from '@/lib/utils';
import type { Note } from '@/types';
import { Plus, Search, Pin, Star, Archive, Trash2, X } from 'lucide-react';

export function NotesPage() {
  const { params, navigate } = useRouter();
  const { showToast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'favorited' | 'archived'>('all');
  const [selected, setSelected] = useState<Note | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('notes').select('*').eq('trashed', false);
    if (filter === 'pinned') query = query.eq('pinned', true).eq('archived', false);
    else if (filter === 'favorited') query = query.eq('favorited', true).eq('archived', false);
    else if (filter === 'archived') query = query.eq('archived', true);
    else query = query.eq('archived', false);
    query = query.order('pinned', { ascending: false }).order('updated_at', { ascending: false });
    const { data } = await query;
    setNotes((data as Note[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (params.new === 'true') setShowCreate(true);
    if (params.id) { const note = notes.find(n => n.id === params.id); if (note) openNote(note); }
  }, [params, notes]);

  const openNote = (note: Note) => { setSelected(note); setTitle(note.title); setContent(note.content); };

  const saveNote = async (updates?: Partial<Note>) => {
    if (!selected) return;
    const merged = { ...selected, ...updates, title, content };
    setSelected(merged);
    setNotes(prev => prev.map(n => n.id === selected.id ? merged : n));
    await supabase.from('notes').update({ title, content, ...updates }).eq('id', selected.id);
  };

  const createNote = async () => {
    if (!title.trim() && !content.trim()) { setShowCreate(false); return; }
    const { data } = await supabase.from('notes').insert({ title: title || 'Untitled', content }).select().single();
    if (data) { setNotes(prev => [data as Note, ...prev]); showToast('Note created.'); }
    setTitle(''); setContent(''); setShowCreate(false);
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selected?.id === id) { setSelected(null); navigate('/notes'); }
    await supabase.from('notes').update({ trashed: true }).eq('id', id);
    showToast('Note deleted.');
  };

  const filtered = notes.filter(n => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Notes</h1>
          <p className="text-body-sm text-text-secondary">{notes.length} notes</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New note</Button>
      </div>

      <div className="flex items-center gap-2 mb-4 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." className="h-10 w-full rounded-xl glass-medium glass-highlight pl-10 pr-3 text-body-sm text-text-primary placeholder:text-text-muted transition-all duration-200 ease-out-quart focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent hover:border-border-strong" />
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
        {(['all', 'pinned', 'favorited', 'archived'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn('rounded-lg px-3 py-1.5 text-body-sm font-medium capitalize transition-all duration-200 ease-out-quart', filter === f ? 'glass-medium text-accent shadow-glow-sm-primary' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary')}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 animate-fade-in-up"><EmptyState icon={<Plus className="h-6 w-6" />} title="No notes yet." description="Jot down anything you need to remember." action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New note</Button>} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((note, i) => (
            <GlassCard
              key={note.id}
              variant="interactive"
              onClick={() => openNote(note)}
              className="p-4 animate-stagger-in group"
            >
              <div style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-body-sm font-semibold text-text-primary truncate">{note.title || 'Untitled'}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {note.pinned && <Pin className="h-3.5 w-3.5 text-accent" />}
                    {note.favorited && <Star className="h-3.5 w-3.5 text-warning" />}
                  </div>
                </div>
                <p className="text-body-sm text-text-secondary line-clamp-3 whitespace-pre-wrap">{note.content || 'No content'}</p>
                <p className="text-caption text-text-muted mt-2">{formatDate(note.updated_at, 'MMM D, YYYY')}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => { createNote(); }} />
          <div className="relative w-full max-w-lg glass-strong glass-highlight rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <h2 className="text-h4 text-text-primary">New Note</h2>
              <button onClick={() => createNote()} className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all duration-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" autoFocus className="w-full bg-transparent text-h4 font-semibold text-text-primary placeholder:text-text-muted focus:outline-none" />
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Start writing..." rows={8} className="w-full bg-transparent text-body text-text-primary placeholder:text-text-muted focus:outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border/60">
              <Button variant="outline" onClick={() => { createNote(); }}>Cancel</Button>
              <Button onClick={createNote}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => { saveNote(); setSelected(null); navigate('/notes'); }} />
          <div className="relative w-full max-w-lg glass-strong glass-highlight rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <button onClick={() => saveNote({ pinned: !selected.pinned })} className={cn('rounded-lg p-1.5 transition-all duration-200', selected.pinned ? 'text-accent' : 'text-text-muted hover:text-text-primary hover:bg-surface-hover')}><Pin className="h-4 w-4" /></button>
                <button onClick={() => saveNote({ favorited: !selected.favorited })} className={cn('rounded-lg p-1.5 transition-all duration-200', selected.favorited ? 'text-warning' : 'text-text-muted hover:text-text-primary hover:bg-surface-hover')}><Star className="h-4 w-4" /></button>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => deleteNote(selected.id)} className="rounded-lg p-1.5 text-text-muted hover:text-danger hover:bg-surface-hover transition-all duration-200"><Trash2 className="h-4 w-4" /></button>
                <button onClick={() => { saveNote(); setSelected(null); navigate('/notes'); }} className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all duration-200"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <input value={title} onChange={e => { setTitle(e.target.value); }} onBlur={() => saveNote()} placeholder="Title" className="w-full bg-transparent text-h4 font-semibold text-text-primary placeholder:text-text-muted focus:outline-none" />
              <textarea value={content} onChange={e => setContent(e.target.value)} onBlur={() => saveNote()} placeholder="Start writing..." rows={12} className="w-full bg-transparent text-body text-text-primary placeholder:text-text-muted focus:outline-none resize-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
