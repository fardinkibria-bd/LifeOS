import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, EmptyState, Badge, Skeleton } from '@/components/ui/index';
import { cn, formatCurrency, formatDate, relativeDate, isOverdue, todayISO } from '@/lib/utils';
import type { InventoryItem, MaintenanceRecord } from '@/types';
import { Plus, Package, Wrench, Trash2, MoreHorizontal } from 'lucide-react';

export function InventoryPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory_items').select('*').eq('trashed', false).eq('archived', false).order('created_at', { ascending: false });
    setItems((data as InventoryItem[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('inventory_items').update({ trashed: true }).eq('id', id);
    showToast('Item removed.');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Inventory</h1>
          <p className="text-body-sm text-text-secondary"><span className="tabular-nums">{items.length}</span> items tracked</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add item</Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <Card className="p-6 animate-fade-in-up"><EmptyState icon={<Package className="h-6 w-6" />} title="No items tracked." description="Track your belongings, warranties, and important purchases." action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add item</Button>} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((item, i) => (
            <div key={item.id} className={cn('group relative rounded-xl glass-medium glass-highlight p-4 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg transition-all duration-200 ease-out-quart animate-stagger-in')} style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg glass text-text-secondary"><Package className="h-5 w-5" /></div>
                  <div><h3 className="text-body font-semibold text-text-primary">{item.name}</h3>{item.category && <p className="text-caption text-text-muted">{item.category}</p>}</div>
                </div>
                <button onClick={() => setShowMenu(showMenu === item.id ? null : item.id)} className="rounded-md p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></button>
                {showMenu === item.id && <div className="absolute right-2 top-12 z-20 w-36 rounded-xl glass-strong glass-highlight shadow-lg py-1 animate-scale-in"><button onClick={() => { deleteItem(item.id); setShowMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-danger hover:bg-surface-hover rounded-lg"><Trash2 className="h-3.5 w-3.5" /> Delete</button></div>}
              </div>
              <div className="flex flex-wrap gap-3 text-caption text-text-muted">
                {item.purchase_date && <span>Purchased: {formatDate(item.purchase_date, 'MMM D, YYYY')}</span>}
                {item.purchase_price != null && <span className="tabular-nums">{formatCurrency(item.purchase_price, item.currency)}</span>}
                {item.location && <span>Location: {item.location}</span>}
              </div>
              {item.warranty_expiry && (
                <div className="mt-2">
                  <Badge variant={isOverdue(item.warranty_expiry) ? 'neutral' : daysFromNowSafe(item.warranty_expiry) <= 30 ? 'warning' : 'neutral'} dot>
                    Warranty {isOverdue(item.warranty_expiry) ? 'expired' : relativeDate(item.warranty_expiry)}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateItemModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { load(); showToast('Item added.'); }} />
    </div>
  );
}

function daysFromNowSafe(date: string): number {
  const target = new Date(date + 'T00:00:00');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function CreateItemModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('inventory_items').insert({
      name, category: category || null, purchase_date: purchaseDate || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null, warranty_expiry: warrantyExpiry || null,
      location: location || null,
    });
    setLoading(false);
    if (error) { showToast('Could not add item.', 'error'); return; }
    setName(''); setCategory(''); setPurchaseDate(''); setPurchasePrice(''); setWarrantyExpiry(''); setLocation('');
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Item" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleCreate} loading={loading} disabled={!name.trim()}>Add</Button></>}>
      <div className="space-y-4">
        <Input label="Item name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MacBook Pro" autoFocus />
        <Input label="Category" value={category} onChange={e => setCategory(e.target.value)} placeholder="Electronics, Appliance..." />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Purchase date" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
          <Input label="Purchase price" type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0.00" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Warranty expiry" type="date" value={warrantyExpiry} onChange={e => setWarrantyExpiry(e.target.value)} />
          <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Home, Office..." />
        </div>
      </div>
    </Modal>
  );
}
