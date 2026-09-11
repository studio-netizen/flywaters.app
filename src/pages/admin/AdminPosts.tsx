import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2, Heart, MessageCircle, MapPin, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  like_count: number | null;
  comment_count: number | null;
  location_tag: string | null;
  fish_species: string[] | null;
  created_at: string;
  profiles?: { username: string | null; avatar_url: string | null } | null;
}

export default function AdminPosts() {
  const { adminFetch } = useAdminApi();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminFetch('get_posts');
      setPosts((data || []) as Post[]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => { load(); }, [load]);

  const deletePost = async (id: string) => {
    try {
      await adminFetch('delete_post', { id });
      toast.success('Post rimosso');
      load();
    } catch {
      toast.error('Errore durante la rimozione');
    }
  };

  const truncate = (s: string | null, n = 60) =>
    !s ? '' : s.length <= n ? s : s.slice(0, n) + '…';

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.caption || '').toLowerCase().includes(q) ||
      (p.profiles?.username || '').toLowerCase().includes(q) ||
      (p.fish_species || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold" style={{ color: '#242242' }}>Post</h1>
        {!loading && !error && <Badge variant="secondary">{posts.length} totali</Badge>}
      </div>
      <Input
        placeholder="Cerca per autore, specie, didascalia..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
        </div>
      ) : error ? (
        <div className="border rounded-lg p-8 text-center space-y-3">
          <p className="text-muted-foreground">Errore nel caricamento dati. Riprova.</p>
          <Button onClick={load}>Riprova</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          {posts.length === 0 ? 'Nessun post ancora' : 'Nessun risultato'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => navigate(`/post/${p.id}`)}
                    title="Visualizza"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="h-7 w-7" title="Elimina">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Rimuovere questo post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Il post verrà eliminato permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePost(p.id)}>Rimuovi</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <CardContent className="p-3 space-y-1">
                <p className="text-xs font-medium">@{p.profiles?.username || '?'}</p>
                <p className="text-xs text-muted-foreground">{truncate(p.caption, 60)}</p>
                {p.fish_species && p.fish_species.length > 0 && (
                  <p className="text-[10px] text-muted-foreground italic">{p.fish_species.join(', ')}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{p.like_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{p.comment_count || 0}</span>
                  {p.location_tag && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location_tag}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(p.created_at), 'dd MMM yyyy', { locale: it })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
