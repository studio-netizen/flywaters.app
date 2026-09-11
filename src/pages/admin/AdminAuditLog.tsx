import { useEffect, useMemo, useState } from 'react';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Download, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AuditRow {
  id: string;
  timestamp: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
}

const ACTIONS = [
  'user.registered',
  'user.login',
  'user.login_failed',
  'user.password_reset',
  'user.deleted',
  'post.created',
  'post.deleted',
  'spot.created',
  'spot.deleted',
  'review.created',
  'review.deleted',
  'admin.login',
  'admin.login_failed',
  'admin.user_disabled',
  'admin.user_enabled',
  'admin.post_removed',
  'admin.spot_removed',
  'admin.campaign_sent',
];

const PAGE_SIZE = 50;

function rowClass(action: string): string {
  if (
    action === 'user.login_failed' ||
    action === 'user.deleted' ||
    action === 'admin.post_removed' ||
    action === 'admin.spot_removed' ||
    action === 'admin.login_failed'
  ) return 'bg-red-50 dark:bg-red-950/20';
  if (action === 'user.password_reset' || action === 'admin.user_disabled')
    return 'bg-yellow-50 dark:bg-yellow-950/20';
  if (
    action === 'user.registered' ||
    action === 'post.created' ||
    action === 'spot.created'
  ) return 'bg-green-50 dark:bg-green-950/20';
  return '';
}

export default function AdminAuditLog() {
  const { adminFetch } = useAdminApi();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('get_audit_logs', {
        page,
        pageSize: PAGE_SIZE,
        dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
        actionFilter: actionFilter !== 'all' ? actionFilter : undefined,
        search: search.trim() || undefined,
      });
      setRows(res.rows || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      toast.error('Errore caricamento log: ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const applyFilters = () => {
    if (page !== 0) setPage(0);
    else load();
  };

  const exportCsv = async () => {
    try {
      const res = await adminFetch('export_audit_logs', {
        dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
        actionFilter: actionFilter !== 'all' ? actionFilter : undefined,
        search: search.trim() || undefined,
      });
      const data: AuditRow[] = res.rows || [];
      const header = [
        'timestamp', 'actor_email', 'actor_role', 'action',
        'resource_type', 'resource_id', 'ip_address', 'user_agent', 'details',
      ];
      const escape = (v: any) => {
        const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [
        header.join(','),
        ...data.map(r => header.map(h => escape((r as any)[h])).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error('Export fallito: ' + (e?.message || ''));
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold" style={{ color: '#242242' }}>
          📋 Audit Log
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
          <Button size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="p-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_2fr_auto] items-end">
        <div>
          <label className="text-xs text-muted-foreground">Da</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">A</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Azione</label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              {ACTIONS.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Email attore</label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="cerca per email…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
        </div>
        <Button onClick={applyFilters} disabled={loading}>Applica</Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Timestamp</th>
                <th className="text-left px-3 py-2">Attore</th>
                <th className="text-left px-3 py-2">Ruolo</th>
                <th className="text-left px-3 py-2">Azione</th>
                <th className="text-left px-3 py-2">Risorsa</th>
                <th className="text-left px-3 py-2">Dettagli</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nessun log trovato</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className={`border-t ${rowClass(r.action)}`}>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                    {new Date(r.timestamp).toLocaleString('it-IT')}
                  </td>
                  <td className="px-3 py-2">{r.actor_email || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2 text-xs">{r.actor_role || 'user'}</td>
                  <td className="px-3 py-2 font-medium">{r.action}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.resource_type}
                    {r.resource_id && <span className="text-muted-foreground"> · {r.resource_id.slice(0, 8)}…</span>}
                  </td>
                  <td className="px-3 py-2 text-xs max-w-md truncate">
                    {r.details ? <code className="text-xs">{JSON.stringify(r.details)}</code> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {total} risultati · pagina {page + 1} di {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
          >Precedente</Button>
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages || loading}
          >Successiva</Button>
        </div>
      </div>
    </div>
  );
}
