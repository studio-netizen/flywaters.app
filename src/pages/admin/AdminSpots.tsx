import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Spot {
  id: string;
  name: string;
  spot_type: string;
  created_by: string | null;
  creator_username: string | null;
  created_at: string;
  review_count: number | null;
  avg_rating: number | null;
  latitude: number;
  longitude: number;
}

export default function AdminSpots() {
  const { adminFetch } = useAdminApi();
  const navigate = useNavigate();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminFetch('get_spots');
      setSpots((data || []) as Spot[]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => { load(); }, [load]);

  const deleteSpot = async (id: string) => {
    try {
      await adminFetch('delete_spot', { id });
      toast.success('Spot rimosso');
      load();
    } catch {
      toast.error('Errore durante la rimozione');
    }
  };

  const filtered = spots.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold" style={{ color: '#242242' }}>Spot</h1>
        {!loading && !error && <Badge variant="secondary">{spots.length} totali</Badge>}
      </div>
      <Input placeholder="Cerca spot..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <div className="border rounded-lg p-8 text-center space-y-3">
          <p className="text-muted-foreground">Errore nel caricamento dati. Riprova.</p>
          <Button onClick={load}>Riprova</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          {spots.length === 0 ? 'Nessuno spot ancora' : 'Nessun risultato'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Autore</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Recensioni</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline">{s.spot_type}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {s.creator_username ? `@${s.creator_username}` : '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {format(new Date(s.created_at), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>{s.review_count || 0}</TableCell>
                  <TableCell>{s.avg_rating ? Number(s.avg_rating).toFixed(1) : '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/spot/${s.id}`)}
                        title="Visualizza"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive" title="Elimina">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Rimuovere "{s.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Verranno eliminate anche tutte le recensioni associate.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSpot(s.id)}>Rimuovi</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
