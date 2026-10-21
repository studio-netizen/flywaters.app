import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Profile from './Profile';
import NotFound from './NotFound';

/** Serves readable profile URLs like /@luciano. */
const ProfileByHandle = () => {
  const { handle = '' } = useParams<{ handle: string }>();
  const isHandle = handle.startsWith('@') && handle.length > 1;
  const username = isHandle ? decodeURIComponent(handle.slice(1)) : '';
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isHandle) return;
    setUserId(undefined);
    supabase.from('profiles').select('user_id').ilike('username', username).maybeSingle()
      .then(({ data }) => setUserId(data?.user_id ?? null));
  }, [username, isHandle]);

  if (!isHandle || userId === null) return <NotFound />;
  if (userId === undefined) {
    return (
      <div className="max-w-lg mx-auto p-6 space-y-4">
        <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>
    );
  }
  return <Profile key={userId} userIdOverride={userId} />;
};

export default ProfileByHandle;
