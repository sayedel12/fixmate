import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isDemoMode } from '../lib/mode';
import { DEMO_USERS, useDemoStore } from '../lib/demo';

export type UserRole = 'customer' | 'landlord' | 'technician' | 'admin';
export type AuthSession = {
  user: {
    id: string;
    email: string | null;
    user_metadata: { display_name?: string };
  };
};
type AuthState = {
  session: AuthSession | null;
  role: UserRole | null;
  roleLoading: boolean;
  roleError: string | null;
  loading: boolean;
  refreshRole: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  role: null,
  roleLoading: false,
  roleError: null,
  loading: true,
  refreshRole: async () => undefined,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const demoRole = useDemoStore((state) => state.activeRole);
  const [backendSession, setSession] = useState<Session | null>(null);
  const [backendRole, setRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isDemoMode && Boolean(supabase));
  const currentUserId = useRef<string | null>(null);
  const demoUser = isDemoMode ? DEMO_USERS[demoRole] : null;
  const session = useMemo<AuthSession | null>(() => {
    if (demoUser) {
      return {
        user: {
          id: demoUser.id,
          email: demoUser.email,
          user_metadata: { display_name: demoUser.name },
        },
      };
    }
    if (!backendSession) return null;
    return {
      user: {
        id: backendSession.user.id,
        email: backendSession.user.email ?? null,
        user_metadata: {
          display_name: typeof backendSession.user.user_metadata.display_name === 'string'
            ? backendSession.user.user_metadata.display_name
            : undefined,
        },
      },
    };
  }, [demoUser, backendSession]);

  const loadRole = useCallback(async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) throw error;
      const allowed: UserRole[] = ['customer', 'landlord', 'technician', 'admin'];
      if (currentUserId.current === userId) {
        setRole(allowed.includes(data.role as UserRole) ? (data.role as UserRole) : 'customer');
        setRoleError(null);
      }
    } catch (error) {
      if (currentUserId.current === userId) {
        setRoleError(error instanceof Error ? error.message : 'Unable to verify account access.');
      }
      throw error;
    } finally {
      if (currentUserId.current === userId) setRoleLoading(false);
    }
  }, []);

  const refreshRole = useCallback(async () => {
    if (isDemoMode) return;
    if (!supabase || !session?.user) {
      setRole(null);
      setRoleError(null);
      setRoleLoading(false);
      return;
    }
    setRoleLoading(true);
    setRoleError(null);
    await loadRole(session.user.id);
  }, [session, loadRole]);

  useEffect(() => {
    if (isDemoMode || !supabase) {
      return;
    }
    let active = true;
    const acceptSession = (nextSession: Session | null) => {
      currentUserId.current = nextSession?.user.id ?? null;
      setSession(nextSession);
      setRole(null);
      setRoleError(null);
      setRoleLoading(Boolean(nextSession));
      if (nextSession) {
        void Promise.resolve()
          .then(() => loadRole(nextSession.user.id))
          .catch((error: unknown) => console.error('Unable to load the user role:', error));
      }
    };
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Unable to restore the signed-in session:', error.message);
      if (active) {
        acceptSession(data.session);
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) acceptSession(nextSession);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadRole]);

  const role = isDemoMode ? demoRole : backendRole;
  const value = useMemo(() => ({
    session,
    role,
    roleLoading: isDemoMode ? false : roleLoading,
    roleError: isDemoMode ? null : roleError,
    loading: isDemoMode ? false : loading,
    refreshRole,
  }), [session, role, roleLoading, roleError, loading, refreshRole]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
