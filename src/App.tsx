import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { QuickAddProvider } from '@/context/QuickAddContext';
import { AppLayout } from '@/components/AppLayout';
import { AuthPage } from '@/pages/AuthPage';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { TasksPage } from '@/pages/TasksPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { NotesPage } from '@/pages/NotesPage';
import { RoutinesPage } from '@/pages/RoutinesPage';
import { HabitsPage } from '@/pages/HabitsPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { ShoppingPage } from '@/pages/ShoppingPage';
import { BillsPage } from '@/pages/BillsPage';
import { SubscriptionsPage } from '@/pages/SubscriptionsPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { ImportantDatesPage } from '@/pages/ImportantDatesPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { IntroAnimation } from '@/components/effects/IntroAnimation';
import { ConstellationField } from '@/components/effects/ConstellationField';

function AppBackground() {
  return (
    <div className="lifeos-background" aria-hidden="true">
      <ConstellationField density={0.72} speed={0.45} />
    </div>
  );
}

function RouteRenderer() {
  const { route } = useRouter();
  const { user, profile, loading } = useAuth();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // Wait for auth to resolve, then show the branded boot sequence on each
    // fresh page load instead of persisting a tab-scoped animation flag.
    if (!loading) {
      setShowIntro(true);
    }
  }, [loading]);

  if (showIntro) {
    return (
      <IntroAnimation
        onComplete={() => {
          setShowIntro(false);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-500 animate-pulse" />
          <div className="h-3 w-20 bg-surface-hover rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;
  if (profile && !profile.onboarded) return <Onboarding />;

  const page = route.split('/')[1]?.split('?')[0] || 'dashboard';

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    tasks: <TasksPage />,
    calendar: <CalendarPage />,
    notes: <NotesPage />,
    routines: <RoutinesPage />,
    habits: <HabitsPage />,
    goals: <GoalsPage />,
    shopping: <ShoppingPage />,
    bills: <BillsPage />,
    subscriptions: <SubscriptionsPage />,
    expenses: <ExpensesPage />,
    budgets: <BudgetsPage />,
    'important-dates': <ImportantDatesPage />,
    inventory: <InventoryPage />,
    maintenance: <MaintenancePage />,
    analytics: <AnalyticsPage />,
    settings: <SettingsPage />,
  };

  return <AppLayout>{pages[page] || <Dashboard />}</AppLayout>;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider>
          <QuickAddProvider>
            <div className="lifeos-root">
              <AppBackground />
              <RouteRenderer />
            </div>
          </QuickAddProvider>
        </RouterProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
