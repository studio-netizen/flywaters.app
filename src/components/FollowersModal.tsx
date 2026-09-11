import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const FISHING_TYPES: Record<string, string> = {
  'fly-fishing': '🎣 Mosca',
  'spinning': '🔄 Spinning',
  'baitcasting': '🎯 Baitcasting',
  'surfcasting': '🌊 Surfcasting',
  'ice-fishing': '🧊 Ghiaccio',
};

interface FollowersModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
}

interface UserItem {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  fishing_types: string[] | null;
}

const FollowersModal = ({ open, onClose, userId, type }: FollowersModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) fetchUsers();
  }, [open, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    const column = type === 'followers' ? 'following_id' : 'follower_id';
    const targetColumn = type === 'followers' ? 'follower_id' : 'following_id';
    
    const { data: follows } = await supabase
      .from('follows')
      .select(targetColumn)
      .eq(column, userId);

    if (!follows || follows.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const userIds = follows.map((f: any) => f[targetColumn]);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, fishing_types')
      .in('user_id', userIds);

    setUsers(profiles || []);
    setLoading(false);
  };

  const handleMessage = (targetUserId: string) => {
    onClose();
    navigate(`/messages/${targetUserId}`);
  };

  const handleProfile = (targetUserId: string) => {
    onClose();
    navigate(`/profile/${targetUserId}`);
  };

  if (!open) return null;

  const content = (
    <div className="flex flex-col max-h-[70vh]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">
          {type === 'followers' ? 'Followers' : 'Following'}
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center py-10 text-sm text-muted-foreground">
            {type === 'followers' ? 'Nessun follower' : 'Non segue nessuno'}
          </p>
        ) : (
          users.map(u => (
            <div key={u.user_id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
              <button onClick={() => handleProfile(u.user_id)}>
                <Avatar className="h-11 w-11">
                  <AvatarImage src={u.avatar_url || ''} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                    {(u.display_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1 min-w-0">
                <button onClick={() => handleProfile(u.user_id)} className="hover:underline">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {u.username || u.display_name}
                  </p>
                </button>
                {u.fishing_types && u.fishing_types.length > 0 && (
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {u.fishing_types.slice(0, 2).map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px] py-0 px-1.5">
                        {FISHING_TYPES[t] || t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {user && u.user_id !== user.id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-4"
                  onClick={() => handleMessage(u.user_id)}
                >
                  Messaggio
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Mobile: bottom drawer
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl animate-in slide-in-from-bottom duration-300">
          {content}
        </div>
      </div>
    );
  }

  // Desktop: centered modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
        {content}
      </div>
    </div>
  );
};

export default FollowersModal;
