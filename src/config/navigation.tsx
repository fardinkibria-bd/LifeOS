import {
  LayoutDashboard, CheckSquare, Calendar, Repeat, Target,
  StickyNote, ShoppingCart, FileText, Bell, Wallet,
  CreditCard, TrendingDown, PiggyBank, Package, Wrench,
  Cake, BarChart3, Search, Settings, Sparkles, Home,
} from 'lucide-react';
import { ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  group: 'main' | 'organize' | 'money' | 'home' | 'utility';
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-[18px] w-[18px]" />, group: 'main' },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="h-[18px] w-[18px]" />, group: 'main' },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="h-[18px] w-[18px]" />, group: 'main' },
  { id: 'routines', label: 'Routines', icon: <Repeat className="h-[18px] w-[18px]" />, group: 'main' },
  { id: 'habits', label: 'Habits', icon: <Sparkles className="h-[18px] w-[18px]" />, group: 'main' },
  { id: 'goals', label: 'Goals', icon: <Target className="h-[18px] w-[18px]" />, group: 'main' },
  { id: 'notes', label: 'Notes', icon: <StickyNote className="h-[18px] w-[18px]" />, group: 'organize' },
  { id: 'shopping', label: 'Shopping', icon: <ShoppingCart className="h-[18px] w-[18px]" />, group: 'organize' },
  { id: 'documents', label: 'Documents', icon: <FileText className="h-[18px] w-[18px]" />, group: 'organize' },
  { id: 'important-dates', label: 'Important Dates', icon: <Cake className="h-[18px] w-[18px]" />, group: 'organize' },
  { id: 'bills', label: 'Bills', icon: <Bell className="h-[18px] w-[18px]" />, group: 'money' },
  { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard className="h-[18px] w-[18px]" />, group: 'money' },
  { id: 'expenses', label: 'Expenses', icon: <TrendingDown className="h-[18px] w-[18px]" />, group: 'money' },
  { id: 'budgets', label: 'Budgets', icon: <PiggyBank className="h-[18px] w-[18px]" />, group: 'money' },
  { id: 'inventory', label: 'Inventory', icon: <Package className="h-[18px] w-[18px]" />, group: 'home' },
  { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-[18px] w-[18px]" />, group: 'home' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-[18px] w-[18px]" />, group: 'utility' },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-[18px] w-[18px]" />, group: 'utility' },
];

export const navGroups: { id: string; label: string; items: NavItem[] }[] = [
  { id: 'main', label: 'Main', items: navItems.filter(i => i.group === 'main') },
  { id: 'organize', label: 'Organize', items: navItems.filter(i => i.group === 'organize') },
  { id: 'money', label: 'Money', items: navItems.filter(i => i.group === 'money') },
  { id: 'home', label: 'Home', items: navItems.filter(i => i.group === 'home') },
  { id: 'utility', label: 'Utility', items: navItems.filter(i => i.group === 'utility') },
];

export const mobileNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: <Home className="h-5 w-5" />, group: 'main' },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="h-5 w-5" />, group: 'main' },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="h-5 w-5" />, group: 'main' },
  { id: 'more', label: 'More', icon: <LayoutDashboard className="h-5 w-5" />, group: 'utility' },
];
