import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CheckSquare, Calendar, Wallet, Home, Target, Sparkles, Sun, Moon, Monitor } from 'lucide-react';

const interests = [
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="h-5 w-5" /> },
  { id: 'schedule', label: 'Schedule', icon: <Calendar className="h-5 w-5" /> },
  { id: 'money', label: 'Money', icon: <Wallet className="h-5 w-5" /> },
  { id: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
  { id: 'goals', label: 'Goals', icon: <Target className="h-5 w-5" /> },
  { id: 'everything', label: 'Everything', icon: <Sparkles className="h-5 w-5" /> },
];

const themeIcons = { light: <Sun className="h-4 w-4" />, dark: <Moon className="h-4 w-4" />, system: <Monitor className="h-4 w-4" /> };

export function Onboarding() {
  const { profile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { setTheme } = useTheme();
  const [name, setName] = useState(profile?.display_name || '');
  const [selected, setSelected] = useState<string[]>([]);
  const [themeChoice, setThemeChoice] = useState<'light' | 'dark' | 'system'>('dark');
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    if (id === 'everything') { setSelected(['everything']); return; }
    setSelected(prev => prev.includes('everything') ? [id] : prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleFinish = async () => {
    setLoading(true);
    setTheme(themeChoice);
    const { error } = await updateProfile({ display_name: name || 'User', onboarded: true, theme: themeChoice });
    setLoading(false);
    if (error) showToast('Could not save preferences. Try again.', 'error');
    else showToast('Welcome to LifeOS!');
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-10 relative">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[20%] w-64 h-64 rounded-full opacity-15 animate-float" style={{ background: 'radial-gradient(circle, rgb(var(--accent-primary) / 0.4), transparent 70%)' }} />
        <div className="absolute bottom-[15%] right-[20%] w-72 h-72 rounded-full opacity-10 animate-float" style={{ background: 'radial-gradient(circle, rgb(var(--accent-secondary) / 0.4), transparent 70%)', animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-secondary text-bg-elevated font-bold text-lg mb-4 shadow-glow">L</div>
          <h1 className="text-h1 text-text-primary font-bold mb-2">Welcome to LifeOS</h1>
          <p className="text-body text-text-secondary">Let's set things up. This takes less than a minute.</p>
        </div>

        <div className="glass-medium glass-highlight rounded-2xl p-6 mb-4 shadow-md animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <label className="text-body-sm font-medium text-text-secondary mb-1.5 block">What should we call you?</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            className="h-10 w-full rounded-lg glass px-3.5 text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
          />
        </div>

        <div className="glass-medium glass-highlight rounded-2xl p-6 mb-4 shadow-md animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <p className="text-body-sm font-medium text-text-secondary mb-3">What would you like to organize?</p>
          <div className="grid grid-cols-2 gap-2.5">
            {interests.map(item => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl glass p-3.5 transition-all duration-200 ease-out-quart',
                  selected.includes(item.id)
                    ? 'border-accent bg-accent/10 text-accent shadow-glow-sm-primary'
                    : 'text-text-secondary hover:border-border-strong hover:-translate-y-0.5'
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="text-body-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-medium glass-highlight rounded-2xl p-6 mb-6 shadow-md animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <p className="text-body-sm font-medium text-text-secondary mb-3">Choose your theme</p>
          <div className="grid grid-cols-3 gap-2.5">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => setThemeChoice(t)}
                className={cn(
                  'rounded-xl glass p-3.5 text-center transition-all duration-200 ease-out-quart',
                  themeChoice === t ? 'border-accent bg-accent/10 shadow-glow-sm-primary' : 'hover:border-border-strong hover:-translate-y-0.5'
                )}
              >
                <div className="flex items-center justify-center mb-2">
                  <span className={cn(themeChoice === t ? 'text-accent' : 'text-text-muted')}>{themeIcons[t]}</span>
                </div>
                <span className={cn('text-caption font-medium capitalize', themeChoice === t ? 'text-accent' : 'text-text-secondary')}>{t}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Button onClick={handleFinish} loading={loading} className="w-full" size="lg">
            Start using LifeOS
          </Button>
        </div>
      </div>
    </div>
  );
}
