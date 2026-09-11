import { AlertTriangle } from 'lucide-react';
import { useSystemMetrics } from '@/pages/admin/AdminSystem';

const DB_FREE = 500 * 1024 * 1024;
const STORAGE_FREE = 1024 * 1024 * 1024;

export default function SystemAlerts() {
  const { data } = useSystemMetrics();
  if (!data) return null;

  const dbPct = (data.db_size_bytes / DB_FREE) * 100;
  const stPct = (data.storage_total_bytes / STORAGE_FREE) * 100;

  const alerts: { tone: 'warn' | 'critical'; text: string }[] = [];
  if (dbPct > 90) alerts.push({ tone: 'critical', text: '🚨 Database critico — azione immediata necessaria' });
  else if (dbPct > 80) alerts.push({ tone: 'warn', text: '⚠️ Database al 80% — considera upgrade Supabase Pro' });
  if (stPct > 80) alerts.push({ tone: 'warn', text: '⚠️ Storage foto al 80% — nuove foto vanno su R2' });

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium ${
            a.tone === 'critical' ? 'bg-red-50 text-red-800 border-b border-red-200' : 'bg-amber-50 text-amber-800 border-b border-amber-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{a.text}</span>
        </div>
      ))}
    </div>
  );
}
