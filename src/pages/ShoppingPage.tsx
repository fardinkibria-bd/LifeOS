import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "@/context/RouterContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card, EmptyState, Checkbox, Skeleton } from "@/components/ui/index";
import { cn, formatCurrency } from "@/lib/utils";
import type { ShoppingList, ShoppingItem } from "@/types";
import {
  Plus,
  ShoppingCart,
  Trash2,
  Check,
  X,
  MoreHorizontal,
} from "lucide-react";

export function ShoppingPage() {
  const { params, navigate } = useRouter();
  const { showToast } = useToast();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [items, setItems] = useState<Record<string, ShoppingItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeList, setActiveList] = useState<string | null>(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("archived", false)
      .order("created_at");
    const lists = (data as ShoppingList[]) || [];
    setLists(lists);
    if (lists.length > 0 && !activeList) setActiveList(lists[0].id);

    const itemsMap: Record<string, ShoppingItem[]> = {};
    await Promise.all(
      lists.map(async (l) => {
        const { data: itemsData } = await supabase
          .from("shopping_items")
          .select("*")
          .eq("list_id", l.id)
          .order("checked")
          .order("sort_order");
        itemsMap[l.id] = (itemsData as ShoppingItem[]) || [];
      }),
    );
    setItems(itemsMap);
    setLoading(false);
  }, [activeList]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (params.new === "true") setShowAddItem(true);
  }, [params]);

  const toggleItem = async (item: ShoppingItem) => {
    const checked = !item.checked;
    setItems((prev) => ({
      ...prev,
      [item.list_id]: (prev[item.list_id] || []).map((i) =>
        i.id === item.id ? { ...i, checked } : i,
      ),
    }));
    await supabase.from("shopping_items").update({ checked }).eq("id", item.id);
  };

  const addItem = async () => {
    if (!activeList || !newItemName.trim()) return;
    const { data } = await supabase
      .from("shopping_items")
      .insert({
        list_id: activeList,
        name: newItemName,
        quantity: parseInt(newItemQty) || 1,
        category: newItemCategory || null,
      })
      .select()
      .single();
    if (data) {
      setItems((prev) => ({
        ...prev,
        [activeList]: [...(prev[activeList] || []), data as ShoppingItem],
      }));
      showToast("Item added.");
    }
    setNewItemName("");
    setNewItemQty("1");
    setNewItemCategory("");
    setShowAddItem(false);
  };

  const deleteItem = async (item: ShoppingItem) => {
    setItems((prev) => ({
      ...prev,
      [item.list_id]: (prev[item.list_id] || []).filter(
        (i) => i.id !== item.id,
      ),
    }));
    await supabase.from("shopping_items").delete().eq("id", item.id);
  };

  const clearChecked = async () => {
    if (!activeList) return;
    const checked = (items[activeList] || []).filter((i) => i.checked);
    await supabase
      .from("shopping_items")
      .delete()
      .in(
        "id",
        checked.map((i) => i.id),
      );
    setItems((prev) => ({
      ...prev,
      [activeList]: (prev[activeList] || []).filter((i) => !i.checked),
    }));
    showToast("Checked items cleared.");
  };

  const createList = async (name: string) => {
    const { data } = await supabase
      .from("shopping_lists")
      .insert({ name })
      .select()
      .single();
    if (data) {
      setLists((prev) => [...prev, data as ShoppingList]);
      setActiveList((data as ShoppingList).id);
      showToast("List created.");
    }
  };

  const deleteList = async (id: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
    if (activeList === id)
      setActiveList(lists.find((l) => l.id !== id)?.id || null);
    await supabase
      .from("shopping_lists")
      .update({ archived: true })
      .eq("id", id);
    showToast("List archived.");
  };

  const currentItems = activeList ? items[activeList] || [] : [];
  const grouped: Record<string, ShoppingItem[]> = {};
  currentItems.forEach((i) => {
    const cat = i.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(i);
  });
  const uncheckedCount = currentItems.filter((i) => !i.checked).length;
  const totalEst = currentItems
    .filter((i) => !i.checked && i.price_estimate)
    .reduce((sum, i) => sum + (i.price_estimate || 0) * i.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-h1 text-text-primary font-bold mb-1">Shopping</h1>
          <p className="text-body-sm text-text-secondary">
            <span className="tabular-nums">{uncheckedCount}</span> items to buy
            {totalEst > 0 ? ` · ~${formatCurrency(totalEst)}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {currentItems.some((i) => i.checked) && (
            <Button variant="outline" onClick={clearChecked}>
              <Check className="h-4 w-4" /> Clear checked
            </Button>
          )}
          <Button onClick={() => setShowAddItem(true)} disabled={!activeList}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        </div>
      </div>

      {/* List tabs */}
      <div
        className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-thin animate-fade-in-up"
        style={{ animationDelay: "50ms" }}
      >
        {lists.map((list) => (
          <button
            key={list.id}
            onClick={() => setActiveList(list.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-1.5 text-body-sm font-medium whitespace-nowrap transition-all duration-200 ease-out-quart",
              activeList === list.id
                ? "glass-medium glass-highlight border-accent/30 text-accent shadow-glow-sm-primary"
                : "glass text-text-secondary hover:text-text-primary hover:-translate-y-0.5",
            )}
          >
            {list.name}
            <span className="text-caption text-text-muted tabular-nums">
              {(items[list.id] || []).filter((i) => !i.checked).length}
            </span>
          </button>
        ))}
        <button
          onClick={() => setShowCreateList(true)}
          className="flex items-center gap-1 rounded-xl border border-dashed border-border px-3 py-1.5 text-body-sm text-text-muted hover:text-text-primary hover:border-border-strong transition-all duration-200 ease-out-quart whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" /> New list
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : !activeList || currentItems.length === 0 ? (
        <Card className="p-6 animate-fade-in-up">
          <EmptyState
            icon={<ShoppingCart className="h-6 w-6" />}
            title="Your shopping list is empty."
            description="Add items you need to buy."
            action={
              activeList ? (
                <Button onClick={() => setShowAddItem(true)}>
                  <Plus className="h-4 w-4" /> Add item
                </Button>
              ) : (
                <Button onClick={() => setShowCreateList(true)}>
                  <Plus className="h-4 w-4" /> Create a list
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, catItems], catIdx) => (
            <div
              key={category}
              className="animate-fade-in-up"
              style={{ animationDelay: `${catIdx * 50}ms` }}
            >
              <h2 className="text-body-sm font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
                {category}
              </h2>
              <div className="space-y-1">
                {catItems.map((item, i) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl glass p-3 hover:bg-surface-hover hover:-translate-y-0.5 hover:border-border-strong transition-all duration-200 ease-out-quart animate-stagger-in",
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <Checkbox
                      checked={item.checked}
                      onChange={() => toggleItem(item)}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-body-sm font-medium",
                          item.checked
                            ? "text-text-muted line-through"
                            : "text-text-primary",
                        )}
                      >
                        {item.name}
                      </p>
                      <p className="text-caption text-text-muted tabular-nums">
                        {item.quantity > 1
                          ? `${item.quantity} ${item.unit || ""}`
                          : ""}
                        {item.price_estimate
                          ? ` · ~${formatCurrency(item.price_estimate * item.quantity)}`
                          : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteItem(item)}
                      className="text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add item modal */}
      <Modal
        open={showAddItem}
        onClose={() => {
          setShowAddItem(false);
          navigate("/shopping");
        }}
        title="Add Item"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddItem(false);
                navigate("/shopping");
              }}
            >
              Cancel
            </Button>
            <Button onClick={addItem} disabled={!newItemName.trim()}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Item name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="e.g. Milk"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
            />
            <Input
              label="Category"
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              placeholder="Produce, Dairy..."
            />
          </div>
        </div>
      </Modal>

      {/* Create list modal */}
      <CreateListModal
        open={showCreateList}
        onClose={() => setShowCreateList(false)}
        onCreate={createList}
      />
    </div>
  );
}

function CreateListModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Shopping List"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (name.trim()) {
                onCreate(name);
                setName("");
                onClose();
              }
            }}
            disabled={!name.trim()}
          >
            Create
          </Button>
        </>
      }
    >
      <Input
        label="List name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Groceries"
        autoFocus
        onKeyDown={(e) =>
          e.key === "Enter" &&
          name.trim() &&
          (onCreate(name), setName(""), onClose())
        }
      />
    </Modal>
  );
}
