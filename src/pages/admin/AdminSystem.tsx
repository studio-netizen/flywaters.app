import { useCallback, useEffect, useState } from 'react';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Database, HardDrive, Cloud, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

const DB_FREE_BYTES = 500 * 1024 * 1024;
const DB_PRO_BYTES = 8 * 1024 * 1024 * 1024;
const STORAGE_FREE_BYTES = 1024 * 1024 * 1024;
const STORAGE_PRO_BYTES = 100 * 1024 * 1024 * 1024;
const R2_FREE_BYTES = 10 * 1024 * 1024 * 1024;

interface TableMetric { name: string; rows: number; size_bytes: number; new_week: number; prev_week: number; growth_pct: number | null }
interface BucketMetric { name: string; size_bytes: number; files: number; files_today: number; files_week: number; files_month: number }
export interface SystemMetrics {
  db_size_bytes: number;
  tables: TableMetric[];
  storage_total_bytes: number;
  storage_total_files: number;
  storage_files_today: number;
  storage_files_week: number;
  storage_files_month: number;
  storage_buckets: BucketMetric[];
  r2: { configured: boolean; total_files: number; estimated_bytes: number; breakdown: Record<string, number> };
  generated_at: string;
}

const fmtBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};
const colorForPct = (pct: number) => (pct >= 80 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500');

function ProgressBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{fmtBytes(used)}</span>
        <span>{pct.toFixed(1)}% di {fmtBytes(limit)}</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${colorForPct(pct)} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function useSystemMetrics(autoRefresh = true) {
  const { adminFetch } = useAdminApi();
  const [data, setData] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await adminFetch('get_system_metrics');
      if (!res.error) setData(res);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    load();
    if (!autoRefresh) return;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load, autoRefresh]);

  return { data, loading, refreshing, refresh: load };
}

export default function AdminSystem() {
  const { data, loading, refreshing, refresh } = useSystemMetrics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#242242' }}>⚙️ Sistema</h1>
          <p className="text-sm text-muted-foreground">Monitoraggio infrastruttura in tempo reale (aggiornato ogni 60s)</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {loading || !data ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* DB */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Database</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressBar used={data.db_size_bytes} limit={DB_FREE_BYTES} />
                <p className="text-xs text-muted-foreground">Piano Pro: {fmtBytes(DB_PRO_BYTES)}</p>
              </CardContent>
            </Card>

            {/* Storage */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <HardDrive className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Storage Foto (Supabase)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressBar used={data.storage_total_bytes} limit={STORAGE_FREE_BYTES} />
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><div className="font-semibold">{data.storage_total_files}</div><div className="text-muted-foreground">Totali</div></div>
                  <div><div className="font-semibold">{data.storage_files_week}</div><div className="text-muted-foreground">7gg</div></div>
                  <div><div className="font-semibold">{data.storage_files_today}</div><div className="text-muted-foreground">Oggi</div></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Media: {data.storage_total_files > 0 ? fmtBytes(Math.round(data.storage_total_bytes / data.storage_total_files)) : '—'} per file
                </p>
              </CardContent>
            </Card>

            {/* R2 */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Cloud className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Cloudflare R2</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.r2.configured ? (
                  <>
                    <ProgressBar used={data.r2.estimated_bytes} limit={R2_FREE_BYTES} />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><div className="font-semibold">{data.r2.total_files}</div><div className="text-muted-foreground">File totali</div></div>
                      <div><div className="font-semibold">{fmtBytes(data.r2.estimated_bytes)}</div><div className="text-muted-foreground">Stimati</div></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Stima basata su ~0.5MB/foto. Limite free: 10GB.</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">R2 non configurato.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tables */}
          <Card>
            <CardHeader><CardTitle className="text-base">Righe per tabella</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b">
                    <tr><th className="text-left py-2">Tabella</th><th className="text-right">Righe</th><th className="text-right">Dimensione</th><th className="text-right">Nuovi 7gg</th><th className="text-right">Trend</th></tr>
                  </thead>
                  <tbody>
                    {data.tables.map((t) => (
                      <tr key={t.name} className="border-b last:border-0">
                        <td className="py-2 font-medium">{t.name}</td>
                        <td className="text-right tabular-nums">{t.rows.toLocaleString('it-IT')}</td>
                        <td className="text-right tabular-nums text-muted-foreground">{fmtBytes(t.size_bytes)}</td>
                        <td className="text-right tabular-nums">{t.new_week}</td>
                        <td className="text-right">
                          {t.growth_pct == null ? <span className="text-muted-foreground">—</span> :
                            <span className={`inline-flex items-center gap-1 ${t.growth_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {t.growth_pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {t.growth_pct > 0 ? '+' : ''}{t.growth_pct}%
                            </span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Buckets */}
          <Card>
            <CardHeader><CardTitle className="text-base">Bucket Storage</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b">
                    <tr><th className="text-left py-2">Bucket</th><th className="text-right">File</th><th className="text-right">Dimensione</th><th className="text-right">Oggi</th><th className="text-right">7gg</th><th className="text-right">30gg</th></tr>
                  </thead>
                  <tbody>
                    {data.storage_buckets.map((b) => (
                      <tr key={b.name} className="border-b last:border-0">
                        <td className="py-2 font-medium">{b.name}</td>
                        <td className="text-right tabular-nums">{b.files}</td>
                        <td className="text-right tabular-nums text-muted-foreground">{fmtBytes(b.size_bytes)}</td>
                        <td className="text-right tabular-nums">{b.files_today}</td>
                        <td className="text-right tabular-nums">{b.files_week}</td>
                        <td className="text-right tabular-nums">{b.files_month}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Plans */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Piano Supabase</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Database</span><span>500 MB free / 8 GB pro</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Storage</span><span>1 GB free / 100 GB pro</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Edge Functions</span><span>500K free / 2M pro</span></div>
                <Button asChild className="w-full mt-2" style={{ backgroundColor: '#242242' }}>
                  <a href="https://supabase.com/pricing" target="_blank" rel="noreferrer">Upgrade su Supabase <ExternalLink className="h-3 w-3 ml-2" /></a>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Piano Vercel</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Piano corrente</span><span>Hobby (Free)</span></div>
                <p className="text-xs text-muted-foreground">Hosting, build e bandwidth gratuiti per progetti personali.</p>
                <Button asChild variant="outline" className="w-full mt-2">
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Vercel Dashboard <ExternalLink className="h-3 w-3 ml-2" /></a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground text-right">
            Ultimo refresh: {new Date(data.generated_at).toLocaleTimeString('it-IT')}
          </p>
        </>
      )}
    </div>
  );
}
