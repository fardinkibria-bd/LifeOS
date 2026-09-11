import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/index';
import { cn, getInitials } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { User, Palette, Bell, Download, LogOut, Sun, Moon, Monitor, Camera } from 'lucide-react';
import { LifeOSLogo } from '@/components/brand/LifeOSLogo';

type Section = 'account' | 'appearance' | 'notifications' | 'data' | 'privacy';

export function SettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [section, setSection] = useState<Section>('account');
  const [name, setName] = useState(profile?.display_name || '');
  const [currency, setCurrency] = useState(profile?.currency || 'USD');
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
  const [weekStart, setWeekStart] = useState(profile?.week_start || 'sunday');
  const [timeFormat, setTimeFormat] = useState(profile?.time_format || '12h');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (file: File) => {
    if (!user || !file.type.startsWith('image/')) {
      showToast('Choose an image file.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Profile images must be under 5 MB.', 'error');
      return;
    }
    setUploadingAvatar(true);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setUploadingAvatar(false);
      const setupHint = uploadError.message.toLowerCase().includes('bucket') ? ' Apply the avatars storage migration in Supabase first.' : '';
      showToast(`Could not upload photo: ${uploadError.message}${setupHint}`, 'error');
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error } = await updateProfile({ avatar_url: `${data.publicUrl}?v=${Date.now()}` });
    setUploadingAvatar(false);
    showToast(error ? 'Could not save photo.' : 'Profile photo updated.', error ? 'error' : 'success');
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await updateProfile({ display_name: name, currency, timezone, week_start: weekStart as any, time_format: timeFormat });
    setSaving(false);
    showToast(error ? 'Could not save.' : 'Settings saved.', error ? 'error' : 'success');
  };

  const exportData = async () => {
    const tables = ['tasks', 'events', 'notes', 'bills', 'subscriptions', 'expenses', 'budgets', 'goals', 'routines', 'habits', 'shopping_lists', 'shopping_items', 'important_dates', 'inventory_items', 'maintenance_records'];
    const data: Record<string, any> = {};
    for (const t of tables) {
      const { data: rows } = await supabase.from(t).select('*');
      data[t] = rows;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lifeos-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported.');
  };

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'account', label: 'Account', icon: <User className="h-4 w-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'data', label: 'Data', icon: <Download className="h-4 w-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <User className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-h1 text-text-primary font-bold mb-6 animate-fade-in-up">Settings</h1>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <div className="sm:w-48 shrink-0">
          <nav className="flex sm:flex-col gap-1 overflow-x-auto scrollbar-thin animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            {sections.map((s, i) => (
              <button key={s.id} onClick={() => setSection(s.id)} className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2 text-body-sm font-medium whitespace-nowrap transition-all duration-200 ease-out-quart animate-stagger-in', section === s.id ? 'glass-medium glass-highlight text-accent shadow-glow-sm-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover')} style={{ animationDelay: `${i * 30}ms` }}>
                {s.icon}{s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {section === 'account' && (
            <div className="space-y-4">
              <Card className="p-5 animate-fade-in-up">
                <h2 className="text-h4 text-text-primary font-semibold mb-4">Profile</h2>
                <div className="flex items-center gap-4 mb-4">
                  <button type="button" onClick={() => avatarInputRef.current?.click()} className="lifeos-profile-photo group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-white text-h3 font-bold shadow-glow" disabled={uploadingAvatar} aria-label="Upload profile picture">
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <LifeOSLogo className="h-11 w-11" />}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100"><Camera className="h-5 w-5" /></span>
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="sr-only" onChange={e => { const file = e.target.files?.[0]; if (file) void uploadAvatar(file); e.target.value = ''; }} />
                  <div><p className="text-body font-medium text-text-primary">{name || 'User'}</p><p className="text-body-sm text-text-secondary">{profile?.user_id ? 'Member' : ''}</p></div>
                </div>
                <div className="space-y-3">
                  <Input label="Display name" value={name} onChange={e => setName(e.target.value)} />
                  <Select label="Currency" value={currency} onChange={e => setCurrency(e.target.value)}>
                    {['USD', 'EUR', 'GBP', 'BDT', 'INR', 'JPY', 'CAD', 'AUD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                  <Select label="Time zone" value={timezone} onChange={e => setTimezone(e.target.value)}>
                    {['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Dhaka', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </Select>
                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Week starts on" value={weekStart} onChange={e => setWeekStart(e.target.value as any)}>
                      <option value="sunday">Sunday</option>
                      <option value="monday">Monday</option>
                    </Select>
                    <Select label="Time format" value={timeFormat} onChange={e => setTimeFormat(e.target.value)}>
                      <option value="12h">12-hour</option>
                      <option value="24h">24-hour</option>
                    </Select>
                  </div>
                  <Button onClick={saveProfile} loading={saving}>Save changes</Button>
                </div>
              </Card>
              <Card className="p-5 animate-fade-in-up" >
                <h2 className="text-h4 text-text-primary font-semibold mb-2">Sign out</h2>
                <p className="text-body-sm text-text-secondary mb-3">You'll need to sign in again to access your data.</p>
                <Button variant="danger" onClick={signOut}><LogOut className="h-4 w-4" /> Sign out</Button>
              </Card>
            </div>
          )}

          {section === 'appearance' && (
            <Card className="p-5 animate-fade-in-up">
              <h2 className="text-h4 text-text-primary font-semibold mb-4">Theme</h2>
              <div className="grid grid-cols-3 gap-3">
                {([['light', 'Light', <Sun className="h-5 w-5" />], ['dark', 'Dark', <Moon className="h-5 w-5" />], ['system', 'System', <Monitor className="h-5 w-5" />]] as const).map(([t, label, icon], i) => (
                  <button key={t} onClick={() => setTheme(t)} className={cn('flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 ease-out-quart animate-stagger-in', theme === t ? 'glass-medium glass-highlight border-accent/30 shadow-glow-sm-primary' : 'glass hover:bg-surface-hover hover:-translate-y-0.5')} style={{ animationDelay: `${i * 30}ms` }}>
                    <span className={cn(theme === t ? 'text-accent' : 'text-text-secondary')}>{icon}</span>
                    <span className={cn('text-body-sm font-medium', theme === t ? 'text-accent' : 'text-text-secondary')}>{label}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {section === 'notifications' && (
            <Card className="p-5 animate-fade-in-up">
              <h2 className="text-h4 text-text-primary font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-3">
                {['Tasks', 'Bills', 'Subscriptions', 'Goals', 'Routines', 'Habits', 'Important dates', 'Maintenance'].map((cat, i) => (
                  <div key={cat} className="notification-preference-row flex items-center justify-between animate-stagger-in" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="min-w-0">
                      <span className="text-body-sm font-medium text-text-primary">{cat}</span>
                      <p className="text-caption text-text-muted">Receive {cat.toLowerCase()} reminders</p>
                    </div>
                    <Toggle label={`${cat} notifications`} defaultOn={true} onChange={() => showToast(`${cat} notifications toggled.`)} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {section === 'data' && (
            <Card className="p-5 animate-fade-in-up">
              <h2 className="text-h4 text-text-primary font-semibold mb-2">Export your data</h2>
              <p className="text-body-sm text-text-secondary mb-4">Download all your LifeOS data as a JSON file. Your data belongs to you.</p>
              <Button variant="outline" onClick={exportData}><Download className="h-4 w-4" /> Export data</Button>
            </Card>
          )}

          {section === 'privacy' && (
            <Card className="p-5 animate-fade-in-up">
              <h2 className="text-h4 text-text-primary font-semibold mb-2">Privacy</h2>
              <p className="text-body-sm text-text-secondary">Your LifeOS data is private and isolated to your account. No other user can access your information. All data is stored securely with row-level security policies enforced at the database level.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ defaultOn, label, onChange }: { defaultOn: boolean; label: string; onChange: () => void }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => { setOn(!on); onChange(); }}
      className={cn(
        'notification-toggle relative shrink-0 rounded-full transition-all duration-200 ease-out-quart',
        on ? 'notification-toggle-on' : 'notification-toggle-off'
      )}
    >
      <span className={cn('notification-toggle-thumb absolute rounded-full transition-transform duration-200 ease-out-quart', on && 'notification-toggle-thumb-on')} />
    </button>
  );
}
