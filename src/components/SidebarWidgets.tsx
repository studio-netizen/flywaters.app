import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TopUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  post_count: number;
}

interface TopSpot {
  id: string;
  name: string;
  avg_rating: number | null;
  review_count: number | null;
}

const SidebarWidgets = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: users = [] } = useQuery<TopUser[]>({
    queryKey: ['sidebar-top-users', user?.id],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .limit(20);
      if (!profiles) return [];
      const ids = profiles.filter(p => !user || p.user_id !== user.id).map(p => p.user_id);
      if (!ids.length) return [];
      const { data: postRows } = await supabase
        .from('posts')
        .select('user_id')
        .in('user_id', ids);
      const counts = new Map<string, number>();
      (postRows || []).forEach(r => counts.set(r.user_id, (counts.get(r.user_id) || 0) + 1));
      return profiles
        .filter(p => !user || p.user_id !== user.id)
        .map(p => ({ ...p, post_count: counts.get(p.user_id) || 0 }))
        .sort((a, b) => b.post_count - a.post_count)
        .slice(0, 3);
    },
  });

  const { data: spots = [] } = useQuery<TopSpot[]>({
    queryKey: ['sidebar-top-spots'],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('spots')
        .select('id, name, avg_rating, review_count')
        .order('review_count', { ascending: false })
        .limit(3);
      return (data as TopSpot[]) || [];
    },
  });

  const { data: following = new Set<string>() } = useQuery<Set<string>>({
    queryKey: ['following-set', user?.id],
    enabled: !!user,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user!.id);
      return new Set((data || []).map((x) => x.following_id));
    },
  });

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    const isFollowing = following.has(targetId);
    const next = new Set(following);
    if (isFollowing) next.delete(targetId); else next.add(targetId);
    qc.setQueryData(['following-set', user.id], next);
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {users.length > 0 && (
        <div className="border-t border-black/[0.08] pt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-2">
            Pescatori da seguire
          </p>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.user_id} className="flex items-center gap-2 px-2">
                <Link to={`/profile/${u.user_id}`} className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar_url || ''} alt={u.username || ''} loading="lazy" />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(u.display_name || u.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate text-foreground">
                    @{u.username || u.display_name}
                  </span>
                </Link>
                <button
                  onClick={() => toggleFollow(u.user_id)}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${
                    following.has(u.user_id)
                      ? 'bg-muted text-foreground'
                      : 'bg-[#242242] text-[#f5f0e8]'
                  }`}
                >
                  {following.has(u.user_id) ? 'Seguito' : 'Segui'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {spots.length > 0 && (
        <div className="border-t border-black/[0.08] pt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-2">
            Spot più attivi
          </p>
          <div className="space-y-2">
            {spots.map((s) => (
              <Link
                key={s.id}
                to={`/spot/${s.id}`}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50"
              >
                <span className="text-xs font-medium truncate text-foreground flex-1">{s.name}</span>
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {(s.avg_rating || 0).toFixed(1)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SidebarWidgets);
