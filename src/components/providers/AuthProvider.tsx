'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/profile-data-actions';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { checkSupabaseHealth } from '@/lib/supabase/fetch';
import { getLocalAuthUser, type LocalAuthUser, useLocalArchive } from '@/lib/local-archive';

export type SupabaseServiceStatus = 'checking' | 'available' | 'unavailable';
type RemoteAuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
export type AuthUser = RemoteAuthUser | LocalAuthUser;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  serviceStatus: SupabaseServiceStatus;
  isLocalMode: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  serviceStatus: 'checking',
  isLocalMode: false,
  refresh: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const localArchive = useLocalArchive();
  const localUser = useMemo(() => getLocalAuthUser(localArchive), [localArchive]);
  const [remoteUser, setRemoteUser] = useState<RemoteAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(!isSupabaseConfigured());
  const [serviceStatus, setServiceStatus] = useState<SupabaseServiceStatus>(
    isSupabaseConfigured() ? 'checking' : 'unavailable',
  );
  const [supabase] = useState(() => (isSupabaseConfigured() ? createClient() : null));

  const fetchUser = useCallback(async () => {
    if (!supabase) {
      setRemoteUser(null);
      setIsLocalMode(true);
      setLoading(false);
      setServiceStatus('unavailable');
      return;
    }

    try {
      const userData = await getCurrentUser();
      setRemoteUser(userData);
      setIsLocalMode(false);
    } catch (err) {
      console.error("Auth fetch failed:", err);
      setRemoteUser(null);
      setIsLocalMode(true);
      setServiceStatus('unavailable');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setServiceStatus('unavailable');
      setIsLocalMode(true);
      return;
    }

    let cancelled = false;

    void checkSupabaseHealth().then((available) => {
      if (cancelled) return;
      setServiceStatus(available ? 'available' : 'unavailable');
      setIsLocalMode(!available);
      if (!available) {
        setRemoteUser(null);
        setLoading(false);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) void fetchUser();
      else {
        setRemoteUser(null);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setRemoteUser(null);
        setIsLocalMode(true);
        setLoading(false);
        setServiceStatus('unavailable');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void fetchUser();
      } else {
        setRemoteUser(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchUser, supabase]);

  const user: AuthUser | null = isLocalMode ? localUser : remoteUser;

  return (
    <AuthContext.Provider value={{ user, loading, serviceStatus, isLocalMode, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
