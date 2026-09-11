import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Eye, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  author: string;
  category: string | null;
  created_at: string;
}

export default function AdminBlog() {
  const { adminFetch } = useAdminApi();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPosts = async () => {
    try {
      const data = await adminFetch('get_blog_posts');
      setPosts(data);
    } catch {
      toast.error('Errore nel caricamento degli articoli');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDuplicate = async (id: string) => {
    try {
      await adminFetch('duplicate_blog_post', { id });
      toast.success('Articolo duplicato');
      fetchPosts();
    } catch {
      toast.error('Errore nella duplicazione');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo articolo?')) return;
    try {
      await adminFetch('delete_blog_post', { id });
      toast.success('Articolo eliminato');
      fetchPosts();
    } catch {
      toast.error('Errore nella cancellazione');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blog</h1>
        <Button onClick={() => navigate('/admin/blog/nuovo')} className="gap-2">
          <Plus className="h-4 w-4" /> Nuovo articolo
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per titolo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Caricamento…</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Titolo</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-3 font-medium">Stato</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Data</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Autore</th>
                <th className="text-right px-4 py-3 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(post => (
                <tr key={post.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{post.title}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[150px] truncate">
                    {post.slug}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                      {post.status === 'published' ? 'Pubblicato' : 'Bozza'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('it-IT')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">{post.author}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/blog/${post.id}/modifica`)}
                        title="Modifica"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        title="Anteprima"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(post.id)}
                        title="Duplica"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(post.id)}
                        title="Elimina"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nessun articolo trovato
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
