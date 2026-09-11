import { useEffect, useState, useMemo } from 'react';
import { useAdminApi } from '@/hooks/useAdminApi';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean | null;
}

interface Profile {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

interface Conversation {
  key: string;
  user1: string;
  user2: string;
  messages: Message[];
  lastMessage: Message;
}

export default function AdminMessages() {
  const { adminFetch } = useAdminApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetch('get_messages'),
      supabase.from('profiles').select('user_id, username, avatar_url'),
    ]).then(([msgs, { data: profs }]) => {
      setMessages(msgs);
      const map: Record<string, Profile> = {};
      (profs || []).forEach((p: Profile) => { map[p.user_id] = p; });
      setProfiles(map);
      setLoading(false);
    });
  }, [adminFetch]);

  const conversations = useMemo(() => {
    const map: Record<string, Message[]> = {};
    messages.forEach((m) => {
      const key = [m.sender_id, m.receiver_id].sort().join('_');
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return Object.entries(map)
      .map(([key, msgs]): Conversation => {
        const sorted = msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return {
          key,
          user1: sorted[0].sender_id,
          user2: sorted[0].receiver_id,
          messages: sorted,
          lastMessage: sorted[0],
        };
      })
      .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());
  }, [messages]);

  const now24h = Date.now() - 86400000;
  const msgs24h = messages.filter((m) => new Date(m.created_at).getTime() > now24h).length;

  const getName = (id: string) => profiles[id]?.username || id.slice(0, 8);
  const getAvatar = (id: string) => profiles[id]?.avatar_url || '';

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return getName(c.user1).toLowerCase().includes(q) || getName(c.user2).toLowerCase().includes(q);
  });

  const activeConvo = conversations.find((c) => c.key === selectedConvo);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold" style={{ color: '#242242' }}>Messaggi</h1>
        <Badge>{msgs24h} nelle ultime 24h</Badge>
      </div>
      <Input placeholder="Cerca per utente..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Conversazioni ({filtered.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filtered.map((c) => (
                <button
                  key={c.key}
                  className={`w-full text-left p-4 border-b hover:bg-muted/50 transition-colors ${selectedConvo === c.key ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedConvo(c.key)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getAvatar(c.user1)} />
                      <AvatarFallback>{getName(c.user1)[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{getName(c.user1)}</span>
                    <span className="text-xs text-muted-foreground">↔</span>
                    <span className="text-sm font-medium">{getName(c.user2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(c.lastMessage.created_at), 'dd MMM HH:mm', { locale: it })}
                  </p>
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Conversazione</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {activeConvo ? (
                <div className="p-4 space-y-3">
                  {[...activeConvo.messages].reverse().map((m) => (
                    <div key={m.id} className="flex gap-2">
                      <Avatar className="h-6 w-6 mt-1">
                        <AvatarImage src={getAvatar(m.sender_id)} />
                        <AvatarFallback>{getName(m.sender_id)[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-medium">{getName(m.sender_id)}</p>
                        <p className="text-sm bg-muted rounded-lg px-3 py-1.5 mt-0.5">{m.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(new Date(m.created_at), 'dd MMM HH:mm', { locale: it })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-sm text-muted-foreground">Seleziona una conversazione</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
