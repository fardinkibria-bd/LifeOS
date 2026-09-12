export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'archived';
export type BillStatus = 'upcoming' | 'due_today' | 'overdue' | 'paid';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type GoalStatus = 'not_started' | 'active' | 'paused' | 'completed' | 'abandoned';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  currency: string;
  timezone: string;
  date_format: string;
  time_format: string;
  week_start: 'sunday' | 'monday';
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  module: string;
  color: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  category: string | null;
  due_date: string | null;
  due_time: string | null;
  start_date: string | null;
  estimated_duration: string | null;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  reminder: string | null;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  trashed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  location: string | null;
  category: string | null;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  reminder: string | null;
  tags: string[];
  archived: boolean;
  trashed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  note_type: 'plain' | 'checklist';
  category: string | null;
  tags: string[];
  pinned: boolean;
  favorited: boolean;
  archived: boolean;
  trashed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  schedule: string;
  active: boolean;
  paused: boolean;
  icon: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  routine_items?: RoutineItem[];
  completions?: RoutineCompletion[];
}

export interface RoutineItem {
  id: string;
  routine_id: string;
  user_id: string;
  title: string;
  sort_order: number;
  created_at: string;
}

export interface RoutineCompletion {
  id: string;
  routine_id: string;
  user_id: string;
  completion_date: string;
  completed_items: string[];
  completed: boolean;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  habit_type: 'boolean' | 'numeric';
  target_value: number | null;
  unit: string | null;
  frequency: string;
  frequency_target: number;
  color: string;
  icon: string | null;
  active: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
  entries?: HabitEntry[];
}

export interface HabitEntry {
  id: string;
  habit_id: string;
  user_id: string;
  entry_date: string;
  value: number;
  completed: boolean;
  note: string | null;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  shopping_items?: ShoppingItem[];
}

export interface ShoppingItem {
  id: string;
  list_id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  price_estimate: number | null;
  checked: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  provider: string | null;
  amount: number;
  currency: string;
  due_date: string;
  recurrence: string;
  recurrence_end_date: string | null;
  payment_status: BillStatus;
  category: string | null;
  reminder: string | null;
  notes: string | null;
  paid_date: string | null;
  archived: boolean;
  trashed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  service_name: string;
  category: string | null;
  price: number;
  currency: string;
  billing_frequency: string;
  next_billing_date: string;
  start_date: string | null;
  renewal_date: string | null;
  reminder: string | null;
  payment_method: string | null;
  notes: string | null;
  status: SubscriptionStatus;
  archived: boolean;
  trashed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  category: string;
  expense_date: string;
  description: string | null;
  merchant: string | null;
  tags: string[];
  archived: boolean;
  trashed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  currency: string;
  period: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  target_date: string | null;
  progress_type: 'percentage' | 'numeric' | 'milestone';
  current_value: number;
  target_value: number;
  progress: number;
  status: GoalStatus;
  tags: string[];
  archived: boolean;
  trashed: boolean;
  created_at: string;
  updated_at: string;
  goal_milestones?: GoalMilestone[];
}

export interface GoalMilestone {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface ImportantDate {
  id: string;
  user_id: string;
  label: string;
  description: string | null;
  date: string;
  recurrence: string;
  reminder: string | null;
  category: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DocumentFolder {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  currency: string;
  warranty_expiry: string | null;
  serial_number: string | null;
  model_info: string | null;
  location: string | null;
  notes: string | null;
  tags: string[];
  archived: boolean;
  trashed: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  user_id: string;
  item_id: string | null;
  item_name: string;
  maintenance_type: string;
  last_maintenance: string | null;
  next_maintenance: string | null;
  recurrence: string;
  cost: number | null;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  related_id: string | null;
  related_type: string | null;
  read: boolean;
  action_url: string | null;
  created_at: string;
}
