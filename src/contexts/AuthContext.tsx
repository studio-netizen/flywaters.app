import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logAudit } from '@/lib/audit';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/**
 * Aggressively clears any Supabase auth-related items from localStorage.
 * Used as a recovery mechanism when sessions become corrupted.
 */
const clearStuckSession = () => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.warn('[Auth] Cleared stuck session keys:', keysToRemove);
  } catch (err) {
    console.error('[Auth] Failed to clear localStorage:', err);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: if auth init takes more than 5s, unblock the app
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('[Auth] Init timeout — unblocking app as logged out');
        setLoading(false);
      }
    }, 5000);

    // Listener FIRST (synchronous handler — never await inside)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      // Side effects via setTimeout to avoid deadlock
      if (event === 'SIGNED_IN' && newSession?.user) {
        setTimeout(() => {
          supabase
            .from('crm_contacts')
            .update({ last_login: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('user_id', newSession.user.id)
            .then(() => {});

          const isNewUser = newSession.user.created_at &&
            (Date.now() - new Date(newSession.user.created_at).getTime()) < 60000;
          if (isNewUser) {
            logAudit('user.registered', 'user', newSession.user.id, {
              provider: newSession.user.app_metadata?.provider,
            });
            supabase.functions.invoke('send-welcome-email', {
              body: {
                user_id: newSession.user.id,
                display_name: newSession.user.user_metadata?.full_name,
              },
            }).catch((err) => console.error('Welcome email error:', err));
          } else {
            logAudit('user.login', 'user', newSession.user.id, {
              provider: newSession.user.app_metadata?.provider,
            });
          }
        }, 0);
      }
    });

    // Then load existing session with error handling
    supabase.auth.getSession()
      .then(({ data: { session: currentSession }, error }) => {
        if (!isMounted) return;
        clearTimeout(safetyTimeout);
        if (error) {
          console.error('[Auth] getSession error — clearing stuck session:', error);
          clearStuckSession();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        clearTimeout(safetyTimeout);
        console.error('[Auth] getSession threw — clearing stuck session:', err);
        clearStuckSession();
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] signOut error — forcing local cleanup:', err);
    } finally {
      // Always clear local state and storage to guarantee logout works
      clearStuckSession();
      setUser(null);
      setSession(null);
      // Hard reload to reset any cached query state
      window.location.href = '/auth';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
