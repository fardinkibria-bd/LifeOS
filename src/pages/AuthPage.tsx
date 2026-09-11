import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LifeOSLogo } from '@/components/Logo';
import { StarPortalButton } from '@/components/effects/StarPortalButton';
import { CheckSquare, Calendar, Bell, StickyNote, ShoppingCart, CreditCard, Target, Repeat, TrendingDown, FileText, ArrowRight } from 'lucide-react';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'landing' | 'signin' | 'signup'>('landing');

  if (mode === 'landing') return <Landing onGetStarted={() => setMode('signup')} onSignIn={() => setMode('signin')} />;
  if (mode === 'signin') return <SignInForm onBack={() => setMode('landing')} onSwitch={() => setMode('signup')} signIn={signIn} showToast={showToast} />;
  return <SignUpForm onBack={() => setMode('landing')} onSwitch={() => setMode('signin')} signUp={signUp} showToast={showToast} />;
}

function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute top-[10%] left-[15%] w-64 h-64 rounded-full opacity-20 animate-float"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent-primary) / 0.3), transparent 70%)' }}
      />
      <div
        className="absolute bottom-[20%] right-[10%] w-80 h-80 rounded-full opacity-15 animate-float"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent-secondary) / 0.3), transparent 70%)', animationDelay: '2s' }}
      />
      <div
        className="absolute top-[50%] right-[30%] w-48 h-48 rounded-full opacity-10 animate-float"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent-tertiary) / 0.3), transparent 70%)', animationDelay: '4s' }}
      />
    </div>
  );
}

function FloatingCards() {
  const cards = [
    { icon: <CheckSquare className="h-4 w-4" />, label: 'Pay electricity bill', meta: 'Due today', color: 'text-danger', delay: '0s', top: '8%', left: '5%' },
    { icon: <Calendar className="h-4 w-4" />, label: 'Dentist appointment', meta: '2:30 PM', color: 'text-accent', delay: '0.5s', top: '20%', right: '8%' },
    { icon: <Repeat className="h-4 w-4" />, label: 'Morning routine', meta: '3 of 5 done', color: 'text-warning', delay: '1s', top: '45%', left: '3%' },
    { icon: <Target className="h-4 w-4" />, label: 'Read 20 pages', meta: '6 day streak', color: 'text-success', delay: '1.5s', bottom: '15%', right: '5%' },
    { icon: <CreditCard className="h-4 w-4" />, label: 'Netflix renews', meta: 'In 3 days', color: 'text-info', delay: '2s', bottom: '30%', left: '8%' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none hidden lg:block">
      {cards.map((card, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            top: card.top, bottom: card.bottom, left: card.left, right: card.right,
            animationDelay: card.delay, animationDuration: '8s',
          }}
        >
          <div className="glass glass-highlight rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 min-w-[200px]">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg glass ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-body-sm font-medium text-text-primary whitespace-nowrap">{card.label}</p>
              <p className="text-caption text-text-muted">{card.meta}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Landing({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroRef.current.style.setProperty('--parallax-x', `${x * 20}px`);
      heroRef.current.style.setProperty('--parallax-y', `${y * 20}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="lifeos-app-shell min-h-screen relative overflow-hidden">
      <FloatingOrbs />

      {/* Nav */}
      <nav className="relative flex items-center justify-between px-6 py-5 max-w-6xl mx-auto z-10">
        <div className="flex items-center gap-2.5">
          <LifeOSLogo className="h-9 w-9" />
          <span className="text-h3 font-bold text-text-primary">LifeOS</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onSignIn} className="text-body-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200">
            Sign in
          </button>
          <Button size="sm" onClick={onGetStarted}>Get started</Button>
        </div>
      </nav>

      {/* Hero with 3D ambient */}
      <section ref={heroRef} className="relative max-w-5xl mx-auto px-6 pt-12 pb-32 text-center z-10">
        <FloatingCards />
        <div
          className="relative"
          style={{ transform: 'translate(var(--parallax-x, 0), var(--parallax-y, 0))', transition: 'transform 0.3s ease-out' }}
        >
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-caption text-text-secondary mb-6 animate-fade-in-up shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-glow-sm-primary" />
            One place for everything that matters
          </div>
          <h1 className="text-display-sm sm:text-display text-text-primary font-bold tracking-tight mb-5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            Life is complicated.<br />
            <span className="bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent">Managing it shouldn't be.</span>
          </h1>
          <p className="text-body text-text-secondary max-w-xl mx-auto mb-8 animate-fade-in-up text-lg" style={{ animationDelay: '100ms' }}>
            LifeOS brings tasks, reminders, routines, money, documents, schedules, and everyday responsibilities into one simple, calm place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <StarPortalButton onClick={onGetStarted}>
              Get started — it's free
            </StarPortalButton>
            <button onClick={onSignIn} className="text-body font-medium text-text-secondary hover:text-text-primary transition-colors duration-200">
              I already have an account
            </button>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="relative max-w-5xl mx-auto px-6 py-16 z-10">
        <div className="grid sm:grid-cols-2 gap-8 items-center">
          <div className="animate-fade-in-up">
            <h2 className="text-h2 text-text-primary font-semibold mb-4">Your life is scattered across apps.</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {['Notes', 'Calendar', 'Reminders', 'Bills', 'Shopping', 'Documents', 'Subscriptions', 'Goals'].map(app => (
                <span key={app} className="rounded-lg glass px-3 py-1.5 text-body-sm text-text-secondary">
                  {app}
                </span>
              ))}
            </div>
            <p className="text-h3 text-accent font-semibold">One LifeOS.</p>
            <p className="text-body text-text-secondary mt-2">Everything in its place, one tap away.</p>
          </div>
          <div className="glass-medium glass-highlight rounded-2xl p-6 shadow-lg animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="space-y-3">
              <FakeRow color="bg-danger" text="Pay electricity bill — Due today" />
              <FakeRow color="bg-warning" text="Morning routine — 3 of 5 done" />
              <FakeRow color="bg-accent" text="Dentist appointment — 2:30 PM" />
              <FakeRow color="bg-success" text="Read 20 min — 6 day streak" />
              <FakeRow color="bg-info" text="Netflix renews in 3 days" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-5xl mx-auto px-6 py-16 z-10">
        <h2 className="text-h2 text-text-primary font-semibold text-center mb-12">Everything you need, nothing you don't</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { title: 'Tasks & Calendar', desc: 'Plan your day, week, and month with tasks, events, and reminders that work together.' },
            { title: 'Money', desc: 'Track bills, subscriptions, expenses, and budgets in one clear view.' },
            { title: 'Routines & Habits', desc: 'Build consistency with calm routines and habit tracking — no gimmicks.' },
            { title: 'Notes & Documents', desc: 'Keep important information and files organized and searchable.' },
            { title: 'Goals', desc: 'Set meaningful goals with milestones and track real progress.' },
            { title: 'Home & Inventory', desc: 'Track belongings, warranties, and maintenance so nothing falls through the cracks.' },
          ].map((f, i) => (
            <div
              key={f.title}
              className="glass glass-highlight rounded-xl p-5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out-quart animate-stagger-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <h3 className="text-h4 text-text-primary font-semibold mb-2">{f.title}</h3>
              <p className="text-body-sm text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="relative max-w-3xl mx-auto px-6 py-16 text-center z-10">
        <h2 className="text-h2 text-text-primary font-semibold mb-4">Your data belongs to you.</h2>
        <p className="text-body text-text-secondary">LifeOS is built with privacy first. Your personal information stays private, and you can export it anytime.</p>
      </section>

      {/* CTA */}
      <section className="relative max-w-3xl mx-auto px-6 py-16 text-center z-10">
        <div className="glass-strong glass-highlight rounded-2xl p-10 shadow-xl">
          <h2 className="text-h2 text-text-primary font-semibold mb-3">Start managing your life today</h2>
          <p className="text-body text-text-secondary mb-6">Free to start. No credit card required.</p>
          <Button size="lg" onClick={onGetStarted}>Create your account</Button>
        </div>
      </section>

      <footer className="relative border-t border-border/40 py-8 text-center z-10">
        <p className="text-caption text-text-muted">LifeOS — Your life, organized.</p>
      </footer>
    </div>
  );
}

function FakeRow({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-2 w-2 rounded-full ${color} shadow-sm`} />
      <span className="text-body-sm text-text-primary">{text}</span>
    </div>
  );
}

function SignInForm({ onBack, onSwitch, signIn, showToast }: {
  onBack: () => void; onSwitch: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error.includes('Invalid login') ? 'Invalid email or password.' : error);
      showToast('Could not sign in.', 'error');
    } else {
      showToast('Welcome back!');
    }
  };

  return (
    <AuthShell title="Sign in to LifeOS" subtitle="Welcome back." onBack={onBack}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Email" type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
        <Input label="Password" type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required />
        {error && <p className="text-body-sm text-danger">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>
      <p className="text-body-sm text-text-secondary text-center mt-4">
        Don't have an account? <button onClick={onSwitch} className="text-accent font-medium hover:underline">Sign up</button>
      </p>
    </AuthShell>
  );
}

function SignUpForm({ onBack, onSwitch, signUp, showToast }: {
  onBack: () => void; onSwitch: () => void;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) {
      setError(error.includes('already') ? 'An account with this email already exists.' : error);
      showToast('Could not create account.', 'error');
    } else {
      showToast('Account created! Welcome to LifeOS.');
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start organizing your life." onBack={onBack}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Name" name="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required autoFocus />
        <Input label="Email" type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
        <Input label="Password" type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required />
        {error && <p className="text-body-sm text-danger">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>
      <p className="text-body-sm text-text-secondary text-center mt-4">
        Already have an account? <button onClick={onSwitch} className="text-accent font-medium hover:underline">Sign in</button>
      </p>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, onBack, children }: { title: string; subtitle: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col relative">
      <FloatingOrbs />
      <div className="relative flex items-center gap-2 px-6 py-5 z-10">
        <button onClick={onBack} className="flex items-center gap-2.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
          <LifeOSLogo className="h-8 w-8" />
          <span className="font-semibold">LifeOS</span>
        </button>
      </div>
      <div className="relative flex-1 flex items-center justify-center px-6 pb-20 z-10">
        <div className="w-full max-w-sm">
          <div className="glass-strong glass-highlight rounded-2xl p-8 shadow-xl animate-scale-in">
            <h1 className="text-h1 text-text-primary font-bold mb-1">{title}</h1>
            <p className="text-body text-text-secondary mb-6">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export { AuthPage as default };
