/* eslint-disable react-refresh/only-export-components -- provider and hook are intentionally co-located */
import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; confirmationRequired: boolean }>;
  enterLocalTestMode: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const localAuthStorageKey = 'lifeos-local-test-auth';
const localUserId = 'local-test-user';
const localProfile: Profile = {
  id: 'local-test-profile',
  user_id: localUserId,
  display_name: 'Local Test User',
  avatar_url: null,
  currency: 'USD',
  timezone: 'UTC',
  date_format: 'MM/DD/YYYY',
  time_format: '12h',
  week_start: 'sunday',
  onboarded: true,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | { id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const signingOutRef = useRef(false);
  const localBypassEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_AUTH_BYPASS === 'true';

  const clearPersistedAuth = useCallback(() => {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      for (const key of Object.keys(storage)) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          storage.removeItem(key);
        }
      }
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error);
      return;
    }

    if (!data) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ user_id: userId })
        .select()
        .single();

      if (!insertError && newProfile) {
        setProfile(newProfile);
      }
      return;
    }

    setProfile(data as Profile);
  }, []);

  useEffect(() => {
    let mounted = true;

    if (localBypassEnabled && window.localStorage.getItem(localAuthStorageKey) === 'true') {
      setUser({ id: localUserId, email: 'local@example.test' });
      setProfile(localProfile);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (signingOutRef.current) {
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (signingOutRef.current && session) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, localBypassEnabled]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    if (user.id === localUserId) {
      setProfile(localProfile);
      return;
    }
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!profile) return { error: 'No profile loaded' };
    if (user?.id === localUserId) {
      setProfile(current => current ? { ...current, ...updates, updated_at: new Date().toISOString() } : current);
      return { error: null };
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();
    if (error) return { error: error.message };
    if (data) setProfile(data as Profile);
    return { error: null };
  }, [profile, user]);

  const enterLocalTestMode = useCallback(() => {
    if (!localBypassEnabled) return;
    window.localStorage.setItem(localAuthStorageKey, 'true');
    setSession(null);
    setUser({ id: localUserId, email: 'local@example.test' });
    setProfile(localProfile);
    setLoading(false);
  }, [localBypassEnabled]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { error: error.message, confirmationRequired: false };
    if (data.user) {
      // Profile creation is handled by the database trigger so this also
      // works when Supabase requires email confirmation before a session.
      if (data.session) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          user_id: data.user.id,
          display_name: displayName,
        });
        if (profileError) return { error: profileError.message, confirmationRequired: false };
      }
    }
    return { error: null, confirmationRequired: Boolean(data.user && !data.session) };
  }, []);

  const signOut = useCallback(async () => {
    signingOutRef.current = true;
    setSession(null);
    setUser(null);
    setProfile(null);
    window.localStorage.removeItem(localAuthStorageKey);
    setLoading(false);
    clearPersistedAuth();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) console.error('Sign out error:', error);
    clearPersistedAuth();
    signingOutRef.current = false;
  }, [clearPersistedAuth]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, enterLocalTestMode, signOut, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
