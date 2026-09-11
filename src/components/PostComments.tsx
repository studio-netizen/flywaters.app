import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import GuideAvatar from '@/components/GuideAvatar';
import { formatTimeIt } from '@/lib/format-time';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_guide?: boolean | null;
  } | null;
}

interface PostCommentsProps {
  postId: string;
  commentCount: number;
  onCommentAdded: () => void;
}

const PostComments = ({ postId, commentCount, onCommentAdded }: PostCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) fetchComments();
  }, [expanded]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) {
      setComments([]);
      return;
    }

    // Fetch profiles for comment authors
    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, is_guide')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    setComments(data.map(c => ({
      ...c,
      profiles: profileMap.get(c.user_id) || null,
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || loading) return;

    const content = newComment.trim();
    const tempId = `temp-${Date.now()}`;

    // Fetch own profile for optimistic display (cached locally if available)
    const { data: ownProfile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, is_guide')
      .eq('user_id', user.id)
      .maybeSingle();

    const optimistic: Comment = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      user_id: user.id,
      profiles: ownProfile || null,
    };

    // Optimistic update
    setComments(prev => [...prev, optimistic]);
    setNewComment('');
    if (!expanded) setExpanded(true);
    setLoading(true);

    const { data: inserted, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.id, content })
      .select('id, content, created_at, user_id')
      .single();

    if (error || !inserted) {
      // Rollback
      setComments(prev => prev.filter(c => c.id !== tempId));
      setNewComment(content);
      toast.error('Errore nell\'invio del commento');
    } else {
      setComments(prev => prev.map(c => c.id === tempId ? { ...inserted, profiles: ownProfile || null } : c));
      // comment_count is maintained by a database trigger — no manual update needed
      onCommentAdded();
    }
    setLoading(false);
  };

  const formatTime = (date: string) => formatTimeIt(date);

  return (
    <div className="px-4 pb-3">
      {/* Show/hide comments toggle */}
      {commentCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm text-muted-foreground mb-2 hover:text-foreground transition-colors"
        >
          Mostra tutti i {commentCount} commenti
        </button>
      )}

      {/* Comment list */}
      {expanded && comments.length > 0 && (
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <div className="mt-0.5">
                <GuideAvatar
                  src={comment.profiles?.avatar_url}
                  fallback={comment.profiles?.display_name || 'U'}
                  isGuide={!!comment.profiles?.is_guide}
                  size="sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold mr-1">
                    {comment.profiles?.username || 'pescatore'}
                  </span>
                  {comment.content}
                </p>
                <span className="text-[11px] text-muted-foreground">{formatTime(comment.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Aggiungi un commento..."
          className="text-sm h-9 border-none bg-muted/50 focus-visible:ring-1"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || loading}
          className="text-primary disabled:text-muted-foreground transition-colors p-1"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default PostComments;