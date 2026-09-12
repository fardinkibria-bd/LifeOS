import { useState, useEffect, useCallback } from "react";
import { PredictiveArcCanvas } from "@designcodeio/threeui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/context/RouterContext";
import { useQuickAdd } from "@/context/QuickAddContext";
import {
  GlassCard,
  EmptyState,
  ProgressBar,
  Checkbox,
} from "@/components/ui/index";
import { Button } from "@/components/ui/Button";
import {
  getGreeting,
  isToday,
  isOverdue,
  relativeDate,
  formatTime,
  formatCurrency,
  daysFromNow,
  todayISO,
} from "@/lib/utils";
import type {
  Task,
  CalendarEvent,
  Bill,
  Routine,
  ImportantDate,
  Subscription,
} from "@/types";
import {
  CheckSquare,
  Calendar,
  Bell,
  Plus,
  TrendingDown,
  AlertCircle,
  Clock,
  Cake,
  CreditCard,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function Dashboard() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const { open } = useQuickAdd();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const today = todayISO();

    const [tasksRes, eventsRes, billsRes, routinesRes, datesRes, subsRes] =
      await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("trashed", false)
          .eq("archived", false)
          .neq("status", "completed")
          .order("due_date", { ascending: true })
          .limit(20),
        supabase
          .from("events")
          .select("*")
          .eq("trashed", false)
          .eq("archived", false)
          .gte("start_date", today)
          .order("start_date", { ascending: true })
          .limit(5),
        supabase
          .from("bills")
          .select("*")
          .eq("trashed", false)
          .eq("archived", false)
          .neq("payment_status", "paid")
          .order("due_date", { ascending: true })
          .limit(5),
        supabase
          .from("routines")
          .select("*")
          .eq("active", true)
          .eq("paused", false)
          .limit(5),
        supabase
          .from("important_dates")
          .select("*")
          .order("date", { ascending: true })
          .limit(5),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("trashed", false)
          .eq("archived", false)
          .eq("status", "active")
          .order("next_billing_date", { ascending: true })
          .limit(3),
      ]);

    setTasks((tasksRes.data as Task[]) || []);
    setEvents((eventsRes.data as CalendarEvent[]) || []);
    setBills((billsRes.data as Bill[]) || []);
    setRoutines((routinesRes.data as Routine[]) || []);
    setImportantDates((datesRes.data as ImportantDate[]) || []);
    setSubscriptions((subsRes.data as Subscription[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const overdueTasks = tasks.filter((t) => t.due_date && isOverdue(t.due_date));
  const todayTasks = tasks.filter((t) => t.due_date && isToday(t.due_date));
  const upcomingTasks = tasks
    .filter((t) => t.due_date && !isOverdue(t.due_date) && !isToday(t.due_date))
    .slice(0, 5);
  const todayEvents = events.filter((e) => isToday(e.start_date));
  const upcomingBills = bills.filter((b) => daysFromNow(b.due_date) <= 7);
  const upcomingDates = importantDates
    .filter((d) => daysFromNow(d.date) <= 30 && daysFromNow(d.date) >= 0)
    .slice(0, 3);

  const completedToday = tasks.filter(
    (t) =>
      t.status === "completed" && t.completed_at && isToday(t.completed_at),
  ).length;
  const totalToday = overdueTasks.length + todayTasks.length + completedToday;
  const completionRate =
    totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const toggleTask = async (id: string, completed: boolean) => {
    const status = completed ? "completed" : "not_started";
    const completed_at = completed ? new Date().toISOString() : null;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, completed_at } : t)),
    );
    await supabase.from("tasks").update({ status, completed_at }).eq("id", id);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-64 skeleton rounded" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="h-28 skeleton rounded-xl" />
          <div className="h-28 skeleton rounded-xl" />
        </div>
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  const isEmpty =
    tasks.length === 0 &&
    events.length === 0 &&
    bills.length === 0 &&
    routines.length === 0;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Greeting hero with ambient predictive arc backdrop */}
      <div className="relative mb-8 animate-fade-in-up overflow-hidden rounded-2xl border border-border-strong">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <PredictiveArcCanvas
            mode="dark"
            speed={0.8}
            brightness={0.9}
            className="opacity-70"
          />
        </div>
        <div className="relative z-10 p-5 sm:p-7">
          <h1 className="text-h1 text-text-primary font-bold mb-1">
            {getGreeting()}, {profile?.display_name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-body text-text-secondary">
            {isEmpty
              ? "Let's get your day organized."
              : "Here's what needs your attention."}
          </p>
        </div>
      </div>

      {isEmpty && (
        <GlassCard variant="highlight" className="p-8 mb-6">
          <EmptyState
            icon={<Sparkles className="h-7 w-7" />}
            title="Welcome to LifeOS"
            description="Start by adding a task, event, or anything you need to remember. Quick Add makes it fast."
            action={
              <Button onClick={open}>
                <Plus className="h-4 w-4 mr-1" /> Add your first item
              </Button>
            }
          />
        </GlassCard>
      )}

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <GlassCard variant="standard" className="p-5 animate-stagger-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg glass text-danger">
                <AlertCircle className="h-4 w-4" />
              </div>
              <span className="text-body-sm font-medium text-text-secondary">
                Needs attention
              </span>
            </div>
            <span className="text-numeric text-text-primary">
              {overdueTasks.length + todayTasks.length + upcomingBills.length}
            </span>
          </div>
          <div className="flex gap-4 text-caption text-text-muted">
            {overdueTasks.length > 0 && (
              <span className="text-danger">{overdueTasks.length} overdue</span>
            )}
            {todayTasks.length > 0 && (
              <span>{todayTasks.length} due today</span>
            )}
            {upcomingBills.length > 0 && (
              <span>{upcomingBills.length} bills soon</span>
            )}
            {overdueTasks.length === 0 &&
              todayTasks.length === 0 &&
              upcomingBills.length === 0 && <span>All clear</span>}
          </div>
        </GlassCard>

        <GlassCard variant="standard" className="p-5 animate-stagger-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg glass text-accent">
                <CheckSquare className="h-4 w-4" />
              </div>
              <span className="text-body-sm font-medium text-text-secondary">
                Today's progress
              </span>
            </div>
            <span className="text-numeric text-text-primary">
              {completionRate}%
            </span>
          </div>
          <ProgressBar
            value={completionRate}
            variant={completionRate >= 80 ? "success" : "brand"}
          />
          <p className="text-caption text-text-muted mt-2">
            {completedToday} completed ·{" "}
            {todayTasks.length + overdueTasks.length} remaining
          </p>
        </GlassCard>
      </div>

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <Section
          title="Overdue"
          icon={<AlertCircle className="h-4 w-4 text-danger" />}
        >
          {overdueTasks.slice(0, 5).map((task, i) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onClick={() => navigate(`/tasks?id=${task.id}`)}
              overdue
              delay={i * 30}
            />
          ))}
        </Section>
      )}

      {/* Today */}
      {(todayTasks.length > 0 || todayEvents.length > 0) && (
        <Section title="Today" icon={<Clock className="h-4 w-4 text-accent" />}>
          {todayTasks.map((task, i) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onClick={() => navigate(`/tasks?id=${task.id}`)}
              delay={i * 30}
            />
          ))}
          {todayEvents.map((event, i) => (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-xl glass-medium p-3.5 hover:border-border-strong hover:-translate-y-0.5 transition-all duration-200 ease-out-quart cursor-pointer animate-stagger-in group"
              style={{ animationDelay: `${(todayTasks.length + i) * 30}ms` }}
              onClick={() => navigate(`/calendar?id=${event.id}`)}
            >
              <div className="h-9 w-9 rounded-lg glass flex items-center justify-center shrink-0 text-info">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-text-primary truncate">
                  {event.title}
                </p>
                <p className="text-caption text-text-muted">
                  {event.all_day
                    ? "All day"
                    : formatTime(
                        event.start_time,
                        profile?.time_format !== "24h",
                      )}
                </p>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Upcoming */}
      {upcomingTasks.length > 0 && (
        <Section
          title="Upcoming"
          icon={<ArrowRight className="h-4 w-4 text-text-muted" />}
        >
          {upcomingTasks.map((task, i) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onClick={() => navigate(`/tasks?id=${task.id}`)}
              delay={i * 30}
            />
          ))}
        </Section>
      )}

      {/* Bills + Subscriptions */}
      {(upcomingBills.length > 0 || subscriptions.length > 0) && (
        <Section
          title="Money"
          icon={<TrendingDown className="h-4 w-4 text-text-muted" />}
        >
          {upcomingBills.slice(0, 3).map((bill, i) => (
            <div
              key={bill.id}
              className="flex items-center gap-3 rounded-xl glass-medium p-3.5 hover:border-border-strong hover:-translate-y-0.5 transition-all duration-200 ease-out-quart cursor-pointer animate-stagger-in"
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => navigate("/bills")}
            >
              <div
                className={`h-9 w-9 rounded-lg glass flex items-center justify-center shrink-0 ${isOverdue(bill.due_date) ? "text-danger" : "text-warning"}`}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-text-primary truncate">
                  {bill.name}
                </p>
                <p className="text-caption text-text-muted">
                  {relativeDate(bill.due_date)}
                </p>
              </div>
              <span className="text-body-sm font-semibold text-text-primary tabular-nums">
                {formatCurrency(bill.amount, bill.currency)}
              </span>
            </div>
          ))}
          {subscriptions.slice(0, 2).map((sub, i) => (
            <div
              key={sub.id}
              className="flex items-center gap-3 rounded-xl glass-medium p-3.5 hover:border-border-strong hover:-translate-y-0.5 transition-all duration-200 ease-out-quart cursor-pointer animate-stagger-in"
              style={{ animationDelay: `${(upcomingBills.length + i) * 30}ms` }}
              onClick={() => navigate("/subscriptions")}
            >
              <div className="h-9 w-9 rounded-lg glass flex items-center justify-center shrink-0 text-text-secondary">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-text-primary truncate">
                  {sub.service_name}
                </p>
                <p className="text-caption text-text-muted">
                  Renews {relativeDate(sub.next_billing_date)}
                </p>
              </div>
              <span className="text-body-sm font-semibold text-text-primary tabular-nums">
                {formatCurrency(sub.price, sub.currency)}
              </span>
            </div>
          ))}
        </Section>
      )}

      {/* Important dates */}
      {upcomingDates.length > 0 && (
        <Section
          title="Coming up"
          icon={<Cake className="h-4 w-4 text-text-muted" />}
        >
          {upcomingDates.map((date, i) => (
            <div
              key={date.id}
              className="flex items-center gap-3 rounded-xl glass-medium p-3.5 animate-stagger-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="h-9 w-9 rounded-lg glass flex items-center justify-center shrink-0 text-accent">
                <Cake className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-text-primary truncate">
                  {date.label}
                </p>
                <p className="text-caption text-text-muted">
                  {relativeDate(date.date)}
                </p>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Quick actions */}
      <div className="mt-10">
        <p className="text-caption text-text-muted font-semibold uppercase tracking-wider mb-3">
          Quick Add
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Task", route: "/tasks?new=true" },
            { label: "Event", route: "/calendar?new=true" },
            { label: "Note", route: "/notes?new=true" },
            { label: "Bill", route: "/bills?new=true" },
            { label: "Expense", route: "/expenses?new=true" },
            { label: "Goal", route: "/goals?new=true" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className="flex items-center gap-1.5 rounded-lg glass px-3.5 py-2 text-body-sm text-text-secondary hover:text-accent hover:border-accent transition-all duration-200"
            >
              <Plus className="h-3.5 w-3.5" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2.5 mb-3">
        {icon}
        <h2 className="text-h4 text-text-primary font-semibold">{title}</h2>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onClick,
  overdue,
  delay = 0,
}: {
  task: Task;
  onToggle: (id: string, c: boolean) => void;
  onClick: () => void;
  overdue?: boolean;
  delay?: number;
}) {
  const priorityColors: Record<string, string> = {
    urgent: "text-danger",
    high: "text-warning",
    medium: "text-text-muted",
    low: "text-text-muted",
  };
  return (
    <div
      className="flex items-center gap-3 rounded-xl glass-medium p-3.5 hover:border-border-strong hover:-translate-y-0.5 transition-all duration-200 ease-out-quart group animate-stagger-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Checkbox
        checked={task.status === "completed"}
        onChange={(c) => onToggle(task.id, c)}
      />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <p
          className={`text-body-sm font-medium truncate ${task.status === "completed" ? "text-text-muted line-through" : "text-text-primary"}`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.due_date && (
            <span
              className={`text-caption ${overdue ? "text-danger" : "text-text-muted"}`}
            >
              {overdue
                ? relativeDate(task.due_date)
                : task.due_time
                  ? `${formatTime(task.due_time)} · ${relativeDate(task.due_date)}`
                  : relativeDate(task.due_date)}
            </span>
          )}
          {task.category && (
            <span className="text-caption text-text-muted">
              · {task.category}
            </span>
          )}
        </div>
      </div>
      <span
        className={`text-caption font-medium uppercase ${priorityColors[task.priority]}`}
      >
        {task.priority}
      </span>
    </div>
  );
}
