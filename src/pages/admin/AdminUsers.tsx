import { useEffect, useState } from 'react';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface AdminUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  fishing_types: string[] | null;
  post_count: number;
  review_count: number;
  banned: boolean;
  bio: string | null;
  is_guide?: boolean;
  guide_status?: string;
}

export default function AdminUsers() {
  const { adminFetch } = useAdminApi();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const load = () => {
    setLoading(true);
    adminFetch('get_users').then(setUsers).finally(() => setLoading(false));
  };

  useEffect(load, [adminFetch]);

  const toggleBan = async (user: AdminUser) => {
    await adminFetch('toggle_user_ban', { userId: user.user_id, ban: !user.banned });
    load();
    setSelected(null);
  };

  const toggleGuide = async (user: AdminUser, value: boolean) => {
    await adminFetch('toggle_user_guide', { userId: user.user_id, isGuide: value });
    setSelected({ ...user, is_guide: value, guide_status: value ? 'approved' : 'none' });
    load();
  };

  const filtered = users.filter(
    (u) =>
      (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: '#242242' }}>Utenti</h1>
      <Input
        placeholder="Cerca per username o email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utente</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Registrato</TableHead>
                <TableHead className="hidden lg:table-cell">Ultimo accesso</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Recensioni</TableHead>
                <TableHead>Guida</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow
                  key={u.user_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(u)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || ''} />
                        <AvatarFallback>{(u.username || 'U')[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{u.display_name || u.username}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{u.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {format(new Date(u.created_at), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {u.last_sign_in_at
                      ? format(new Date(u.last_sign_in_at), 'dd MMM yyyy HH:mm', { locale: it })
                      : '—'}
                  </TableCell>
                  <TableCell>{u.post_count}</TableCell>
                  <TableCell>{u.review_count}</TableCell>
                  <TableCell>
                    {u.is_guide ? (
                      <Badge className="bg-[hsl(43,74%,55%)] hover:bg-[hsl(43,74%,50%)] text-white">Guida</Badge>
                    ) : u.guide_status === 'pending' ? (
                      <Badge variant="outline">In attesa</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.banned ? (
                      <Badge variant="destructive">Disabilitato</Badge>
                    ) : (
                      <Badge variant="secondary">Attivo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Dettaglio utente</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selected.avatar_url || ''} />
                    <AvatarFallback>{(selected.username || 'U')[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold">{selected.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{selected.username}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Email:</span> {selected.email}</div>
                  <div><span className="text-muted-foreground">Post:</span> {selected.post_count}</div>
                  <div><span className="text-muted-foreground">Recensioni:</span> {selected.review_count}</div>
                  <div><span className="text-muted-foreground">Pesca:</span> {(selected.fishing_types || []).join(', ') || '—'}</div>
                </div>
                {selected.bio && <p className="text-sm">{selected.bio}</p>}

                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                  <div>
                    <Label htmlFor="guide-toggle" className="font-semibold cursor-pointer">
                      Guida Certificata Flywaters
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selected.guide_status === 'pending'
                        ? 'Richiesta in attesa di approvazione'
                        : 'Mostra badge dorato sul profilo'}
                    </p>
                  </div>
                  <Switch
                    id="guide-toggle"
                    checked={!!selected.is_guide}
                    onCheckedChange={(v) => toggleGuide(selected, v)}
                  />
                </div>

                <Button
                  variant={selected.banned ? 'default' : 'destructive'}
                  onClick={() => toggleBan(selected)}
                >
                  {selected.banned ? 'Riabilita account' : 'Disabilita account'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
