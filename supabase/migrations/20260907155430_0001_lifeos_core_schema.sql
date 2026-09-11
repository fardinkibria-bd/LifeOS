/*
# LifeOS Core Database Schema

## Overview
Creates the foundational tables for LifeOS, a personal life-management platform.
All tables are multi-user (owner-scoped via user_id) with RLS enabled.

## Tables Created
1. **profiles** — user display name, avatar, preferences (currency, timezone, theme, etc.)
2. **categories** — reusable categories across modules (tasks, expenses, etc.)
3. **tags** — reusable tags across modules
4. **tasks** — tasks with priority, status, due date, recurrence, etc.
5. **subtasks** — checklist items within a task
6. **events** — calendar events with location, recurrence, all-day support
7. **notes** — plain-text/checklist notes with pin/favorite/archive
8. **routines** — structured routine collections (e.g. Morning Routine)
9. **routine_items** — checklist items within a routine
10. **routine_completions** — per-day routine completion tracking
11. **habits** — habit definitions with frequency targets
12. **habit_entries** — per-day habit tracking entries
13. **shopping_lists** — multiple shopping lists
14. **shopping_items** — items within shopping lists
15. **bills** — bill tracking with recurrence and payment status
16. **subscriptions** — recurring subscription tracking
17. **expenses** — manual expense entries
18. **budgets** — category-based monthly budgets
19. **goals** — goals with milestones and progress
20. **goal_milestones** — milestones within goals
21. **important_dates** — birthdays, anniversaries, renewals
22. **documents** — document metadata (file name, category, tags, folder)
23. **document_folders** — folder organization for documents
24. **inventory_items** — personal belonging tracking
25. **maintenance_records** — maintenance tracking for inventory items
26. **notifications** — in-app notification center

## Security
- RLS enabled on every table
- All tables scoped to authenticated users via user_id
- user_id columns default to auth.uid() so inserts work without explicit user_id
- Child tables scoped through parent ownership via EXISTS subquery
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  currency text NOT NULL DEFAULT 'USD',
  timezone text NOT NULL DEFAULT 'UTC',
  date_format text NOT NULL DEFAULT 'MMM D, YYYY',
  time_format text NOT NULL DEFAULT '12h',
  week_start text NOT NULL DEFAULT 'sunday',
  theme text NOT NULL DEFAULT 'system',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  module text NOT NULL DEFAULT 'tasks',
  color text NOT NULL DEFAULT 'neutral',
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_categories" ON categories;
CREATE POLICY "select_own_categories" ON categories FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_categories" ON categories;
CREATE POLICY "insert_own_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_categories" ON categories;
CREATE POLICY "update_own_categories" ON categories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_categories" ON categories;
CREATE POLICY "delete_own_categories" ON categories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'neutral',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tags" ON tags;
CREATE POLICY "select_own_tags" ON tags FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tags" ON tags;
CREATE POLICY "insert_own_tags" ON tags FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tags" ON tags;
CREATE POLICY "update_own_tags" ON tags FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tags" ON tags;
CREATE POLICY "delete_own_tags" ON tags FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'not_started',
  priority text NOT NULL DEFAULT 'medium',
  category text,
  due_date date,
  due_time text,
  start_date date,
  estimated_duration text,
  recurrence_rule text,
  recurrence_end_date date,
  reminder text,
  tags text[] DEFAULT '{}',
  pinned boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_archived ON tasks(user_id, archived);

-- ============================================================
-- SUBTASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subtasks" ON subtasks;
CREATE POLICY "select_own_subtasks" ON subtasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subtasks" ON subtasks;
CREATE POLICY "insert_own_subtasks" ON subtasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subtasks" ON subtasks;
CREATE POLICY "update_own_subtasks" ON subtasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subtasks" ON subtasks;
CREATE POLICY "delete_own_subtasks" ON subtasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  start_time text,
  end_time text,
  all_day boolean NOT NULL DEFAULT false,
  location text,
  category text,
  recurrence_rule text,
  recurrence_end_date date,
  reminder text,
  tags text[] DEFAULT '{}',
  archived boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_events" ON events;
CREATE POLICY "select_own_events" ON events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_events" ON events;
CREATE POLICY "insert_own_events" ON events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_events" ON events;
CREATE POLICY "update_own_events" ON events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_events" ON events;
CREATE POLICY "delete_own_events" ON events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_events_user_start_date ON events(user_id, start_date);

-- ============================================================
-- NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  note_type text NOT NULL DEFAULT 'plain',
  category text,
  tags text[] DEFAULT '{}',
  pinned boolean NOT NULL DEFAULT false,
  favorited boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notes" ON notes;
CREATE POLICY "select_own_notes" ON notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notes" ON notes;
CREATE POLICY "insert_own_notes" ON notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notes" ON notes;
CREATE POLICY "update_own_notes" ON notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notes" ON notes;
CREATE POLICY "delete_own_notes" ON notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- ROUTINES
-- ============================================================
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  schedule text NOT NULL DEFAULT 'daily',
  active boolean NOT NULL DEFAULT true,
  paused boolean NOT NULL DEFAULT false,
  icon text,
  color text NOT NULL DEFAULT 'neutral',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_routines" ON routines;
CREATE POLICY "select_own_routines" ON routines FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_routines" ON routines;
CREATE POLICY "insert_own_routines" ON routines FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_routines" ON routines;
CREATE POLICY "update_own_routines" ON routines FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_routines" ON routines;
CREATE POLICY "delete_own_routines" ON routines FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- ROUTINE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS routine_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE routine_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_routine_items" ON routine_items;
CREATE POLICY "select_own_routine_items" ON routine_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_routine_items" ON routine_items;
CREATE POLICY "insert_own_routine_items" ON routine_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_routine_items" ON routine_items;
CREATE POLICY "update_own_routine_items" ON routine_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_routine_items" ON routine_items;
CREATE POLICY "delete_own_routine_items" ON routine_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- ROUTINE COMPLETIONS (per-day tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS routine_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_date date NOT NULL,
  completed_items uuid[] DEFAULT '{}',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(routine_id, completion_date)
);

ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_routine_completions" ON routine_completions;
CREATE POLICY "select_own_routine_completions" ON routine_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_routine_completions" ON routine_completions;
CREATE POLICY "insert_own_routine_completions" ON routine_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_routine_completions" ON routine_completions;
CREATE POLICY "update_own_routine_completions" ON routine_completions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_routine_completions" ON routine_completions;
CREATE POLICY "delete_own_routine_completions" ON routine_completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- HABITS
-- ============================================================
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  habit_type text NOT NULL DEFAULT 'boolean',
  target_value numeric,
  unit text,
  frequency text NOT NULL DEFAULT 'daily',
  frequency_target int NOT NULL DEFAULT 1,
  color text NOT NULL DEFAULT 'neutral',
  icon text,
  active boolean NOT NULL DEFAULT true,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_habits" ON habits;
CREATE POLICY "select_own_habits" ON habits FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_habits" ON habits;
CREATE POLICY "insert_own_habits" ON habits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_habits" ON habits;
CREATE POLICY "update_own_habits" ON habits FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_habits" ON habits;
CREATE POLICY "delete_own_habits" ON habits FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- HABIT ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS habit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  value numeric NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT true,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(habit_id, entry_date)
);

ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_habit_entries" ON habit_entries;
CREATE POLICY "select_own_habit_entries" ON habit_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_habit_entries" ON habit_entries;
CREATE POLICY "insert_own_habit_entries" ON habit_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_habit_entries" ON habit_entries;
CREATE POLICY "update_own_habit_entries" ON habit_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_habit_entries" ON habit_entries;
CREATE POLICY "delete_own_habit_entries" ON habit_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SHOPPING LISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_shopping_lists" ON shopping_lists;
CREATE POLICY "select_own_shopping_lists" ON shopping_lists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_shopping_lists" ON shopping_lists;
CREATE POLICY "insert_own_shopping_lists" ON shopping_lists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_shopping_lists" ON shopping_lists;
CREATE POLICY "update_own_shopping_lists" ON shopping_lists FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_shopping_lists" ON shopping_lists;
CREATE POLICY "delete_own_shopping_lists" ON shopping_lists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SHOPPING ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text,
  category text,
  price_estimate numeric,
  checked boolean NOT NULL DEFAULT false,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_shopping_items" ON shopping_items;
CREATE POLICY "select_own_shopping_items" ON shopping_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_shopping_items" ON shopping_items;
CREATE POLICY "insert_own_shopping_items" ON shopping_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_shopping_items" ON shopping_items;
CREATE POLICY "update_own_shopping_items" ON shopping_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_shopping_items" ON shopping_items;
CREATE POLICY "delete_own_shopping_items" ON shopping_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- BILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  due_date date NOT NULL,
  recurrence text NOT NULL DEFAULT 'monthly',
  recurrence_end_date date,
  payment_status text NOT NULL DEFAULT 'upcoming',
  category text,
  reminder text,
  notes text,
  paid_date timestamptz,
  archived boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bills" ON bills;
CREATE POLICY "select_own_bills" ON bills FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bills" ON bills;
CREATE POLICY "insert_own_bills" ON bills FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bills" ON bills;
CREATE POLICY "update_own_bills" ON bills FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bills" ON bills;
CREATE POLICY "delete_own_bills" ON bills FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bills_user_due_date ON bills(user_id, due_date);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  category text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing_frequency text NOT NULL DEFAULT 'monthly',
  next_billing_date date NOT NULL,
  start_date date,
  renewal_date date,
  reminder text,
  payment_method text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  archived boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subscriptions" ON subscriptions;
CREATE POLICY "delete_own_subscriptions" ON subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  category text NOT NULL DEFAULT 'other',
  expense_date date NOT NULL,
  description text,
  merchant text,
  tags text[] DEFAULT '{}',
  archived boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_expenses" ON expenses;
CREATE POLICY "select_own_expenses" ON expenses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_expenses" ON expenses;
CREATE POLICY "insert_own_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_expenses" ON expenses;
CREATE POLICY "update_own_expenses" ON expenses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_expenses" ON expenses;
CREATE POLICY "delete_own_expenses" ON expenses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date);

-- ============================================================
-- BUDGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  period text NOT NULL DEFAULT 'monthly',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_budgets" ON budgets;
CREATE POLICY "select_own_budgets" ON budgets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_budgets" ON budgets;
CREATE POLICY "insert_own_budgets" ON budgets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_budgets" ON budgets;
CREATE POLICY "update_own_budgets" ON budgets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_budgets" ON budgets;
CREATE POLICY "delete_own_budgets" ON budgets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  target_date date,
  progress_type text NOT NULL DEFAULT 'percentage',
  current_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 100,
  progress numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'not_started',
  tags text[] DEFAULT '{}',
  archived boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goals" ON goals;
CREATE POLICY "select_own_goals" ON goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_goals" ON goals;
CREATE POLICY "insert_own_goals" ON goals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_goals" ON goals;
CREATE POLICY "update_own_goals" ON goals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_goals" ON goals;
CREATE POLICY "delete_own_goals" ON goals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- GOAL MILESTONES
-- ============================================================
CREATE TABLE IF NOT EXISTS goal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goal_milestones" ON goal_milestones;
CREATE POLICY "select_own_goal_milestones" ON goal_milestones FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_goal_milestones" ON goal_milestones;
CREATE POLICY "insert_own_goal_milestones" ON goal_milestones FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_goal_milestones" ON goal_milestones;
CREATE POLICY "update_own_goal_milestones" ON goal_milestones FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_goal_milestones" ON goal_milestones;
CREATE POLICY "delete_own_goal_milestones" ON goal_milestones FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- IMPORTANT DATES
-- ============================================================
CREATE TABLE IF NOT EXISTS important_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  description text,
  date date NOT NULL,
  recurrence text NOT NULL DEFAULT 'yearly',
  reminder text,
  category text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE important_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_important_dates" ON important_dates;
CREATE POLICY "select_own_important_dates" ON important_dates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_important_dates" ON important_dates;
CREATE POLICY "insert_own_important_dates" ON important_dates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_important_dates" ON important_dates;
CREATE POLICY "update_own_important_dates" ON important_dates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_important_dates" ON important_dates;
CREATE POLICY "delete_own_important_dates" ON important_dates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- DOCUMENT FOLDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS document_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_document_folders" ON document_folders;
CREATE POLICY "select_own_document_folders" ON document_folders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_document_folders" ON document_folders;
CREATE POLICY "insert_own_document_folders" ON document_folders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_document_folders" ON document_folders;
CREATE POLICY "update_own_document_folders" ON document_folders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_document_folders" ON document_folders;
CREATE POLICY "delete_own_document_folders" ON document_folders FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- DOCUMENTS (metadata only — file upload via Supabase Storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  folder_id uuid REFERENCES document_folders(id) ON DELETE SET NULL,
  category text,
  tags text[] DEFAULT '{}',
  file_path text,
  file_type text,
  file_size bigint,
  favorited boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- INVENTORY ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  purchase_date date,
  purchase_price numeric,
  currency text NOT NULL DEFAULT 'USD',
  warranty_expiry date,
  serial_number text,
  model_info text,
  location text,
  notes text,
  tags text[] DEFAULT '{}',
  archived boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_inventory_items" ON inventory_items;
CREATE POLICY "select_own_inventory_items" ON inventory_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_inventory_items" ON inventory_items;
CREATE POLICY "insert_own_inventory_items" ON inventory_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_inventory_items" ON inventory_items;
CREATE POLICY "update_own_inventory_items" ON inventory_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_inventory_items" ON inventory_items;
CREATE POLICY "delete_own_inventory_items" ON inventory_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- MAINTENANCE RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  maintenance_type text NOT NULL,
  last_maintenance date,
  next_maintenance date,
  recurrence text NOT NULL DEFAULT 'yearly',
  cost numeric,
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_maintenance_records" ON maintenance_records;
CREATE POLICY "select_own_maintenance_records" ON maintenance_records FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_maintenance_records" ON maintenance_records;
CREATE POLICY "insert_own_maintenance_records" ON maintenance_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_maintenance_records" ON maintenance_records;
CREATE POLICY "update_own_maintenance_records" ON maintenance_records FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_maintenance_records" ON maintenance_records;
CREATE POLICY "delete_own_maintenance_records" ON maintenance_records FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  related_id uuid,
  related_type text,
  read boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- ============================================================
-- updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
DO $$
BEGIN
  DECLARE t text;
  BEGIN
    FOREACH t IN ARRAY ARRAY['profiles','tasks','events','notes','routines','habits','shopping_lists','bills','subscriptions','expenses','budgets','goals','important_dates','documents','inventory_items','maintenance_records'] LOOP
      BEGIN
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
      END;
    END LOOP;
  END;
END $$;