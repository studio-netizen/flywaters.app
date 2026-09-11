import { useEffect, useState } from 'react';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Setting {
  key: string;
  value: string | null;
}

export default function AdminSettings() {
  const { adminFetch } = useAdminApi();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    adminFetch('get_settings').then((data: Setting[]) => {
      setSettings(data);
      const wm = data.find((s) => s.key === 'welcome_message');
      const mm = data.find((s) => s.key === 'maintenance_mode');
      setWelcomeMsg(wm?.value || '');
      setMaintenance(mm?.value === 'true');
      setLoading(false);
    });
  }, [adminFetch]);

  const saveWelcome = async () => {
    await adminFetch('update_setting', { key: 'welcome_message', value: welcomeMsg });
    toast.success('Messaggio di benvenuto aggiornato');
  };

  const toggleMaintenance = async (val: boolean) => {
    setMaintenance(val);
    await adminFetch('update_setting', { key: 'maintenance_mode', value: val ? 'true' : 'false' });
    toast.success(val ? 'Modalità manutenzione attivata' : 'Modalità manutenzione disattivata');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: '#242242' }}>Impostazioni</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Messaggio di benvenuto</CardTitle>
          <CardDescription>Appare nella app per tutti gli utenti</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={welcomeMsg}
            onChange={(e) => setWelcomeMsg(e.target.value)}
            placeholder="Es. Benvenuto su Flywaters!"
          />
          <Button onClick={saveWelcome}>Salva</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modalità manutenzione</CardTitle>
          <CardDescription>Mostra un banner di manutenzione a tutti gli utenti</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch checked={maintenance} onCheckedChange={toggleMaintenance} />
            <span className="text-sm">{maintenance ? 'Attiva' : 'Disattiva'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credenziali admin</CardTitle>
          <CardDescription>
            Per modificare email o password dell'admin, aggiorna le variabili ADMIN_EMAIL e ADMIN_PASSWORD nelle impostazioni del progetto.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
