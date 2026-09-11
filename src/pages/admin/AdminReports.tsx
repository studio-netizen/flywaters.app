import { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Check, X, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeHttpUrl } from '@/lib/sanitize-url';

interface Report {
  id: string;
  type: 'pollution' | 'poaching' | 'other';
  description: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reporter: { username: string | null; display_name: string | null } | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'In attesa',
  approved: 'Approvata',
  rejected: 'Rifiutata',
};

const TYPE_LABEL: Record<string, string> = {
  pollution: 'Inquinamento',
  poaching: 'Bracconaggio',
  other: 'Altro',
};

export default function AdminReports() {
  const { adminFetch } = useAdminApi();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch('get_reports', tab === 'all' ? {} : { status: tab });
      setReports((data || []) as Report[]);
    } catch {
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  }, [adminFetch, tab]);

  useEffect(() => { load(); }, [load]);

  const review = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminFetch('review_report', { id, status });
      toast.success(status === 'approved' ? 'Segnalazione approvata' : 'Segnalazione rifiutata');
      load();
    } catch {
      toast.error('Errore');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Eliminare definitivamente questa segnalazione?')) return;
    try {
      await adminFetch('delete_report', { id });
      toast.success('Segnalazione eliminata');
      load();
    } catch {
      toast.error('Errore');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#242242' }}>
          <AlertTriangle className="h-6 w-6 text-destructive" />
          Segnalazioni Sentinel
        </h1>
        {!loading && <Badge variant="secondary">{reports.length}</Badge>}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">In attesa</TabsTrigger>
          <TabsTrigger value="approved">Approvate</TabsTrigger>
          <TabsTrigger value="rejected">Rifiutate</TabsTrigger>
          <TabsTrigger value="all">Tutte</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          Nessuna segnalazione.
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead className="hidden md:table-cell">Autore</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Foto</TableHead>
                <TableHead className="w-32">Posizione</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Badge variant="outline">{TYPE_LABEL[r.type]}</Badge></TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm line-clamp-2">{r.description}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {r.reporter?.username ? `@${r.reporter.username}` : '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {format(new Date(r.created_at), 'dd MMM yyyy HH:mm', { locale: it })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}
                    >
                      {STATUS_LABEL[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const safeUrl = sanitizeHttpUrl(r.image_url);
                      return safeUrl ? (
                        <a href={safeUrl} target="_blank" rel="noreferrer">
                          <img src={safeUrl} alt="" className="w-12 h-12 rounded object-cover" />
                        </a>
                      ) : '—';
                    })()}
                  </TableCell>
                  <TableCell className="text-xs">
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=15/${r.latitude}/${r.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Mappa <ExternalLink className="w-3 h-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status !== 'approved' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => review(r.id, 'approved')}
                          title="Approva"
                          className="text-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {r.status !== 'rejected' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => review(r.id, 'rejected')}
                          title="Rifiuta"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => remove(r.id)}
                        title="Elimina"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
