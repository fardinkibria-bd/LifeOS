export const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

export const todayISO = (): string => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
};

export const formatDate = (date: string | Date | null | undefined, format = 'MMM D'): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date + (date.length === 10 ? 'T00:00:00' : '')) : date;
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const year = d.getFullYear();
  const month = months[d.getMonth()];
  const day = d.getDate();
  const dayName = days[d.getDay()];
  switch (format) {
    case 'MMM D, YYYY': return `${month} ${day}, ${year}`;
    case 'MMM D': return `${month} ${day}`;
    case 'ddd, MMM D': return `${dayName}, ${month} ${day}`;
    case 'MMMM D, YYYY': return `${months[d.getMonth()]} ${day}, ${year}`;
    case 'YYYY-MM-DD': return `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'dddd, MMMM D': return `${days[d.getDay()]}day, ${months[d.getMonth()]} ${day}`.replace('Sundayday', 'Sunday').replace('Mondayday', 'Monday').replace('Tuesdayday', 'Tuesday').replace('Wednesdayday', 'Wednesday').replace('Thursdayday', 'Thursday').replace('Fridayday', 'Friday').replace('Saturdayday', 'Saturday');
    default: return `${month} ${day}`;
  }
};

export const formatTime = (time: string | null | undefined, format12h = true): string => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (format12h) {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', BDT: '৳', INR: '₹', JPY: '¥', CAD: 'C$', AUD: 'A$' };
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const daysFromNow = (date: string | Date): number => {
  const target = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const relativeDate = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  const diff = daysFromNow(date);
  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} overdue`;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return `In ${diff} days`;
  if (diff < 14) return 'Next week';
  return formatDate(date, 'MMM D');
};

export const isToday = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

export const isOverdue = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  return daysFromNow(date) < 0;
};

export const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const uid = (): string => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

export const startOfWeek = (date: Date, weekStart: 'sunday' | 'monday' = 'sunday'): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = weekStart === 'sunday' ? day : day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const startOfMonth = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfMonth = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getWeekDays = (date: Date, weekStart: 'sunday' | 'monday' = 'sunday'): Date[] => {
  const start = startOfWeek(date, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const getMonthGrid = (date: Date, weekStart: 'sunday' | 'monday' = 'sunday'): Date[] => {
  const start = startOfWeek(startOfMonth(date), weekStart);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};

export const sameDay = (a: Date, b: Date): boolean =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

export const toISODate = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
};

export const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
};
