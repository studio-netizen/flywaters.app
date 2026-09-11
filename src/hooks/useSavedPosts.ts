import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSavedPosts() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setSaved(new Set()); return; }
    supabase.from('saved_posts').select('post_id').eq('user_id', user.id).then(({ data }) => {
      if (data) setSaved(new Set(data.map((r: any) => r.post_id)));
    });
  }, [user]);

  const toggleSave = useCallback(async (postId: string) => {
    if (!user) { toast.error('Accedi per salvare i post'); return; }
    const isSaved = saved.has(postId);
    // Optimistic
    setSaved(prev => {
      const n = new Set(prev);
      if (isSaved) n.delete(postId); else n.add(postId);
      return n;
    });
    const { error } = isSaved
      ? await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId)
      : await supabase.from('saved_posts').insert({ user_id: user.id, post_id: postId });
    if (error) {
      setSaved(prev => {
        const n = new Set(prev);
        if (isSaved) n.add(postId); else n.delete(postId);
        return n;
      });
      toast.error('Errore. Riprova.');
    } else {
      toast.success(isSaved ? 'Post rimosso dai salvati' : 'Post salvato ✓');
    }
  }, [user, saved]);

  return { saved, toggleSave };
}
