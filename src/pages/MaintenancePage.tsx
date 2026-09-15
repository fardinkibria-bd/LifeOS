import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, EmptyState, Badge, Skeleton } from '@/components/ui/index';
import { cn, formatCurrency, relativeDate, isOverdue, daysFromNow, todayISO } from '@/lib/utils';
import type { MaintenanceRecord } from '@/types';
import { Plus, Wrench, Trash2, MoreHorizontal } from 'lucide-react';

export function MaintenancePage() {
  const { showToast } = useToast();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('maintenance_records').select('*').order('next_maintenance', { ascending: true, nullsFirst: false });
    setRecords((data as MaintenanceRecord[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteRecord = async (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    await supabase.from('maintenance_records').delete().eq('id', id);
    showToast('Record deleted.');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Maintenance</h1>
          <p className="text-body-sm text-text-secondary"><span className="tabular-nums">{records.length}</span> tracked items</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add record</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : records.length === 0 ? (
        <Card className="p-6 animate-fade-in-up"><EmptyState icon={<Wrench className="h-6 w-6" />} title="No maintenance tracked." description="Track maintenance for appliances, vehicles, and equipment." action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add record</Button>} /></Card>
      ) : (
        <div className="space-y-2">
          {records.map((record, i) => {
            const overdue = record.next_maintenance && isOverdue(record.next_maintenance);
            const soon = record.next_maintenance && !overdue && daysFromNow(record.next_maintenance) <= 14;
            return (
              <div key={record.id} className={cn('group relative flex items-center gap-3 rounded-xl glass-medium glass-highlight p-4 hover:-translate-y-0.5 hover:border-border-strong transition-all duration-200 ease-out-quart animate-stagger-in')} style={{ animationDelay: `${i * 30}ms` }}>
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', overdue ? 'bg-danger/10' : soon ? 'bg-warning/10' : 'glass')}>
                  <Wrench className={cn('h-5 w-5', overdue ? 'text-danger' : soon ? 'text-warning' : 'text-text-secondary')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-text-primary truncate">{record.item_name}</p>
                  <p className="text-caption text-text-muted">{record.maintenance_type} · {record.recurrence}</p>
                </div>
                <div className="text-right shrink-0">
                  {record.next_maintenance && <p className="text-body-sm font-medium text-text-primary tabular-nums">{relativeDate(record.next_maintenance)}</p>}
                  {overdue && <Badge variant="danger" dot>Overdue</Badge>}
                  {soon && <Badge variant="warning" dot>Due soon</Badge>}
                </div>
                <button onClick={() => setShowMenu(showMenu === record.id ? null : record.id)} className="rounded-md p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></button>
                {showMenu === record.id && <div className="absolute right-2 top-16 z-20 w-36 rounded-xl glass-strong glass-highlight shadow-lg py-1 animate-scale-in"><button onClick={() => { deleteRecord(record.id); setShowMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover rounded-lg"><Trash2 className="h-3.5 w-3.5" /> Delete</button></div>}
              </div>
            );
          })}
        </div>
      )}

      <CreateRecordModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { load(); showToast('Record added.'); }} />
    </div>
  );
}

function CreateRecordModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToast();
  const [itemName, setItemName] = useState('');
  const [type, setType] = useState('Routine');
  const [lastMaint, setLastMaint] = useState(todayISO());
  const [recurrence, setRecurrence] = useState('yearly');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!itemName.trim()) return;
    setLoading(true);
    const last = new Date(lastMaint + 'T00:00:00');
    let next: Date | null = null;
    if (recurrence === 'weekly') next = new Date(last.getTime() + 7 * 86400000);
    else if (recurrence === 'monthly') next = new Date(last.getFullYear(), last.getMonth() + 1, last.getDate());
    else if (recurrence === 'quarterly') next = new Date(last.getFullYear(), last.getMonth() + 3, last.getDate());
    else if (recurrence === 'yearly') next = new Date(last.getFullYear() + 1, last.getMonth(), last.getDate());
    const { error } = await supabase.from('maintenance_records').insert({
      item_name: itemName, maintenance_type: type, last_maintenance: lastMaint || null,
      next_maintenance: next ? next.toISOString().split('T')[0] : null, recurrence, cost: cost ? parseFloat(cost) : null,
    });
    setLoading(false);
    if (error) { showToast('Could not add record.', 'error'); return; }
    setItemName(''); setCost('');
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Maintenance Record" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!itemName.trim()}>Add</Button></>}>
      <div className="space-y-4">
        <Input label="Item name" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Air Conditioner" autoFocus />
        <Input label="Maintenance type" value={type} onChange={e => setType(e.target.value)} placeholder="Routine, Repair, Inspection..." />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Last maintenance" type="date" value={lastMaint} onChange={e => setLastMaint(e.target.value)} />
          <Select label="Recurrence" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </div>
        <Input label="Cost" type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
      </div>
    </Modal>
  );
}
