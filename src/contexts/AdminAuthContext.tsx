import React, { createContext, useContext, useState, useCallback } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem('admin_token');
    const exp = localStorage.getItem('admin_token_exp');
    if (stored && exp && Date.now() < parseInt(exp)) return stored;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_token_exp');
    return null;
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ email, password }),
        }
      );
      const body = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        if (res.status === 500 && typeof body?.error === 'string' && body.error.toLowerCase().includes('non configurato')) {
          return { ok: false, error: 'Credenziali admin non configurate' };
        }
        return { ok: false, error: body?.error || 'Credenziali non valide' };
      }
      const { token: t, exp } = body;
      setToken(t);
      localStorage.setItem('admin_token', t);
      localStorage.setItem('admin_token_exp', exp.toString());
      return { ok: true };
    } catch {
      return { ok: false, error: 'Errore di connessione. Riprova.' };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_token_exp');
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated: !!token, token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
