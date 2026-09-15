/* eslint-disable react-refresh/only-export-components -- provider and hook are intentionally co-located */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface RouterContextValue {
  route: string;
  params: Record<string, string>;
  navigate: (route: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

function parseHash(): { route: string; params: Record<string, string> } {
  const hash = window.location.hash.slice(1) || '/dashboard';
  const [path, query] = hash.split('?');
  const params: Record<string, string> = {};
  if (query) {
    new URLSearchParams(query).forEach((v, k) => { params[k] = v; });
  }
  return { route: path, params };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [{ route, params }, setState] = useState(parseHash);

  useEffect(() => {
    const handler = () => {
      setState(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handler);
    if (!window.location.hash) window.location.hash = '/dashboard';
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return (
    <RouterContext.Provider value={{ route, params, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
