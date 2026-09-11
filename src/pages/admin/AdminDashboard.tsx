import { useEffect, useState } from 'react';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Users, FileText, MapPin, MessageSquare, Star, TrendingUp, Mail, Database, HardDrive, Cloud, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemMetrics } from './AdminSystem';

function SystemQuickStats() {
  const { data, loading } = useSystemMetrics();
  if (loading || !data) {
    return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-20" />)}</div>;
  }
  const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
  const items = [
    { icon: Database, label: 'DB Used', value: `${mb(data.db_size_bytes)} MB`, sub: '/ 500 MB' },
    { icon: HardDrive, label: 'Storage', value: `${mb(data.storage_total_bytes)} MB`, sub: '/ 1024 MB' },
    { icon: Cloud, label: 'R2 Files', value: `${data.r2.total_files}`, sub: 'file' },
    { icon: Calendar, label: 'Backup', value: 'Auto', sub: 'via Supabase' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it) => (
        <Card key={it.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <it.icon className="h-5 w-5 text-primary" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{it.label}</p>
              <p className="text-lg font-bold leading-tight truncate">{it.value}</p>
              <p className="text-[11px] text-muted-foreground">{it.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalSpots: number;
  totalMessages: number;
  totalReviews: number;
  newToday: number;
  newWeek: number;
  newMonth: number;
  activeUsers7d: number;
  retentionRate: number;
  registrationChart: { created_at: string }[];
  postsChart: { created_at: string }[];
  fishingTypes: { fishing_types: string[] | null }[];
  welcomeEmailsSent: number;
  welcomeEmailsFailed: number;
}

const COLORS = ['#242242', '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];

function groupByDay(items: { created_at: string }[]) {
  const map: Record<string, number> = {};
  items.forEach((item) => {
    const day = item.created_at.slice(0, 10);
    map[day] = (map[day] || 0) + 1;
  });
  // Fill last 30 days
  const result: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key.slice(5), count: map[key] || 0 });
  }
  return result;
}

function countFishingTypes(profiles: { fishing_types: string[] | null }[]) {
  const map: Record<string, number> = {};
  profiles.forEach((p) => {
    (p.fishing_types || ['fly-fishing']).forEach((t) => {
      map[t] = (map[t] || 0) + 1;
    });
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

export default function AdminDashboard() {
  const { adminFetch } = useAdminApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('get_dashboard_stats')
      .then(setStats)
      .finally(() => setLoading(false));
  }, [adminFetch]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!stats) return <p className="text-muted-foreground">Errore nel caricamento dati.</p>;

  const kpis1 = [
    { label: 'Utenti totali', value: stats.totalUsers, icon: Users },
    { label: 'Nuovi oggi', value: stats.newToday, icon: TrendingUp },
    { label: 'Nuovi 7gg', value: stats.newWeek, icon: TrendingUp },
    { label: 'Attivi 7gg', value: stats.activeUsers7d, icon: Users },
  ];

  const kpis2 = [
    { label: 'Post totali', value: stats.totalPosts, icon: FileText },
    { label: 'Spot totali', value: stats.totalSpots, icon: MapPin },
    { label: 'Messaggi totali', value: stats.totalMessages, icon: MessageSquare },
    { label: 'Recensioni totali', value: stats.totalReviews, icon: Star },
  ];

  const kpis3 = [
    { label: 'Welcome email inviate', value: stats.welcomeEmailsSent, icon: Mail },
    { label: 'Welcome email fallite', value: stats.welcomeEmailsFailed, icon: Mail },
  ];

  const regData = groupByDay(stats.registrationChart);
  const postData = groupByDay(stats.postsChart);
  const fishData = countFishingTypes(stats.fishingTypes);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: '#242242' }}>Panoramica</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis1.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis2.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis3.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Nuove registrazioni (30gg)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={regData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#242242" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Post pubblicati (30gg)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={postData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#242242" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Distribuzione tipi di pesca</CardTitle></CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={fishData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {fishData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SystemQuickStats />
    </div>
  );
}
