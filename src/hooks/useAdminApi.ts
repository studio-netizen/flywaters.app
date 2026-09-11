import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useCallback } from 'react';

export const useAdminApi = () => {
  const { token } = useAdminAuth();

  const adminFetch = useCallback(
    async (action: string, params: Record<string, unknown> = {}) => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'x-admin-token': token || '',
          },
          body: JSON.stringify({ action, ...params }),
        }
      );
      if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
      return res.json();
    },
    [token]
  );

  return { adminFetch };
};
