import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, PenSquare, Search, Users, ChevronDown } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import SEOHead from '@/components/SEOHead';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { hapticLight } from '@/lib/haptic';

interface Conversation {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read?: boolean;
}

const Messages = () => {
  const { user } = useAuth();
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  useEffect(() => {
    if (paramUserId && user) openConversationWithUser(paramUserId);
  }, [paramUserId, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('inbox-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => fetchConversations())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!selectedUser || !user) return;
    fetchMessages(selectedUser.user_id);
    markAsRead(selectedUser.user_id);
    setPartnerTyping(false);
    setHasNewBelow(false);
    setAtBottom(true);

    // Deterministic channel name so both peers join the same broadcast room.
    const pair = [user.id, selectedUser.user_id].sort().join('_');
    const channel = supabase
      .channel(`chat-${pair}`, { config: { broadcast: { self: false } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${selectedUser.user_id}` }, (payload: any) => {
        const msg = payload.new as Message;
        const isRelevant = (msg.sender_id === selectedUser.user_id && msg.receiver_id === user.id) || (msg.sender_id === user.id && msg.receiver_id === selectedUser.user_id);
        if (isRelevant) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            const cleaned = prev.filter(m => m.id);
            return [...cleaned, msg];
          });
          setPartnerTyping(false);
          if (atBottom) {
            scrollToBottom();
          } else {
            setHasNewBelow(true);
          }
          if (msg.sender_id === selectedUser.user_id) {
            supabase.from('messages').update({ read: true }).eq('id', msg.id).then();
          }
        }
      })
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload?.payload?.from === selectedUser.user_id) {
          setPartnerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000);
        }
      })
      .on('broadcast', { event: 'stop-typing' }, (payload: any) => {
        if (payload?.payload?.from === selectedUser.user_id) setPartnerTyping(false);
      })
      .subscribe();
    typingChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedUser, user]);


  const markAsRead = async (partnerId: string) => {
    if (!user) return;
    await supabase.from('messages').update({ read: true })
      .eq('sender_id', partnerId).eq('receiver_id', user.id).eq('read', false);
    fetchConversations();
  };

  const openConversationWithUser = async (targetUserId: string) => {
    const { data: profile } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url').eq('user_id', targetUserId).single();
    if (profile) {
      setSelectedUser({ user_id: profile.user_id, username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url, last_message: '', last_time: new Date().toISOString(), unread: 0 });
    }
  };

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await supabase.from('messages').select('id, sender_id, receiver_id, content, created_at, read').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }
    const convMap = new Map<string, { last_message: string; last_time: string; unread: number }>();
    data.forEach(msg => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, { last_message: msg.content, last_time: msg.created_at, unread: (!msg.read && msg.receiver_id === user.id) ? 1 : 0 });
      } else if (!msg.read && msg.receiver_id === user.id) {
        convMap.get(partnerId)!.unread++;
      }
    });
    const userIds = Array.from(convMap.keys());
    if (userIds.length === 0) { setConversations([]); setLoading(false); return; }
    const { data: profiles } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url').in('user_id', userIds);
    const convs: Conversation[] = userIds.map(uid => {
      const profile = profiles?.find(p => p.user_id === uid);
      return { user_id: uid, username: profile?.username || null, display_name: profile?.display_name || null, avatar_url: profile?.avatar_url || null, ...convMap.get(uid)! };
    });
    convs.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
    setConversations(convs);
    setLoading(false);
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;
    const { data } = await supabase.from('messages').select('id, sender_id, receiver_id, content, created_at, read').or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`).order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedUser || !newMessage.trim()) return;
    const content = newMessage.trim();
    setNewMessage('');
    hapticLight();
    // Notify peer to stop the typing indicator immediately.
    typingChannelRef.current?.send({ type: 'broadcast', event: 'stop-typing', payload: { from: user.id } });
    lastTypingSentRef.current = 0;
    const optimistic: Message = { sender_id: user.id, receiver_id: selectedUser.user_id, content, created_at: new Date().toISOString(), read: false };
    setMessages(prev => [...prev, optimistic]);
    scrollToBottom();
    await supabase.from('messages').insert({ sender_id: user.id, receiver_id: selectedUser.user_id, content });
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (!user || !typingChannelRef.current) return;
    const now = Date.now();
    // Throttle typing broadcasts to at most one every 1.5s
    if (value.length > 0 && now - lastTypingSentRef.current > 1500) {
      lastTypingSentRef.current = now;
      typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { from: user.id } });
    }
    if (value.length === 0) {
      typingChannelRef.current.send({ type: 'broadcast', event: 'stop-typing', payload: { from: user.id } });
      lastTypingSentRef.current = 0;
    }
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    const { data } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url, fishing_types').neq('user_id', user!.id).or(`username.ilike.%${query}%,display_name.ilike.%${query}%`).limit(10);
    setSearchResults(data || []);
    setSearchLoading(false);
  };

  const startConversation = (profile: any) => {
    setShowSearch(false); setSearchQuery(''); setSearchResults([]);
    setSelectedUser({ user_id: profile.user_id, username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url, last_message: '', last_time: new Date().toISOString(), unread: 0 });
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasNewBelow(false);
    }, 100);
  };

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(nearBottom);
    if (nearBottom) setHasNewBelow(false);
  };


  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('messages.now');
    if (diffMins < 60) return `${diffMins} min`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return t('messages.yesterday');
    const days = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
    if (diffHrs < 168) return days[d.getDay()];
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const shouldShowTimestamp = (msgs: Message[], index: number) => {
    if (index === 0) return true;
    const prev = new Date(msgs[index - 1].created_at);
    const curr = new Date(msgs[index].created_at);
    return (curr.getTime() - prev.getTime()) > 300000; // 5 min gap
  };

  const formatMessageTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const goBack = () => { setSelectedUser(null); if (paramUserId) navigate('/messages', { replace: true }); };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">{t('auth.loginToSee')} {t('nav.messages').toLowerCase()}</p>
        </div>
      </AppLayout>
    );
  }

  // Conversation view
  if (selectedUser) {
    const lastSentMsg = [...messages].reverse().find(m => m.sender_id === user.id);

    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Chat header */}
        <header className="bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <button onClick={() => navigate(`/profile/${selectedUser.user_id}`)} className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={selectedUser.avatar_url || ''} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {(selectedUser.display_name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-sm block truncate">{selectedUser.display_name || selectedUser.username}</span>
              {partnerTyping
                ? <span className="text-xs text-[hsl(var(--forest-accent))] block truncate">{t('messages.typing')}</span>
                : selectedUser.username && <span className="text-xs text-muted-foreground block truncate">@{selectedUser.username}</span>
              }
            </div>
          </button>
        </header>

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto px-4 py-4 relative"
        >
          {messages.map((msg, i) => {
            const isMine = msg.sender_id === user.id;
            const showTs = shouldShowTimestamp(messages, i);
            const isLastSent = lastSentMsg && msg === lastSentMsg;

            return (
              <div key={msg.id || `opt-${i}`}>
                {showTs && (
                  <p className="text-center text-[11px] text-muted-foreground my-3">
                    {formatMessageTime(msg.created_at)}
                  </p>
                )}
                <div className={`flex items-end gap-2 mb-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {!isMine && (
                    <Avatar className="h-7 w-7 shrink-0 mb-0.5">
                      <AvatarImage src={selectedUser.avatar_url || ''} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                        {(selectedUser.display_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed ${
                      isMine ? 'bg-[#242242] text-white' : 'bg-[#f0f0eb] text-foreground'
                    }`}
                    style={{ borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px' }}
                  >
                    {msg.content}
                  </div>
                </div>
                {isLastSent && (
                  <p className="text-right text-[11px] text-muted-foreground mr-1 mb-2">
                    {msg.read ? t('messages.seen') : t('messages.sent')}
                  </p>
                )}
              </div>
            );
          })}

          {partnerTyping && (
            <div className="flex items-end gap-2 mb-1.5 justify-start">
              <Avatar className="h-7 w-7 shrink-0 mb-0.5">
                <AvatarImage src={selectedUser.avatar_url || ''} />
                <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                  {(selectedUser.display_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                className="bg-[#f0f0eb] text-foreground px-3.5 py-2.5 flex items-center gap-1"
                style={{ borderRadius: '18px 18px 18px 4px' }}
                aria-label={t('messages.typing')}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Jump-to-bottom pill */}
        {!atBottom && hasNewBelow && (
          <button
            onClick={scrollToBottom}
            className="absolute left-1/2 -translate-x-1/2 bottom-24 bg-[#242242] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-10"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            {t('messages.newMessages')}
          </button>
        )}


        {/* Input bar */}
        <div className="border-t border-border px-4 py-3 bg-background" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={e => handleInputChange(e.target.value)}
              placeholder={t('messages.typeMessage')}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="rounded-full flex-1"
            />
            {newMessage.trim() && (
              <button
                onClick={sendMessage}
                className="shrink-0 w-9 h-9 rounded-full bg-[#242242] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Search / new conversation
  if (showSearch) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => searchUsers(e.target.value)} placeholder={t('messages.searchUser')} className="rounded-full pl-9" autoFocus />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {searchLoading && <div className="flex items-center justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>}
          {searchResults.map(p => (
            <button key={p.user_id} onClick={() => startConversation(p)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 text-left">
              <Avatar className="h-12 w-12">
                <AvatarImage src={p.avatar_url || ''} />
                <AvatarFallback className="bg-muted text-muted-foreground text-sm">{(p.display_name || 'U')[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{p.display_name || p.username}</p>
                {p.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
              </div>
              {p.fishing_types && p.fishing_types.length > 0 && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {t(`common.fishingTypes.${p.fishing_types[0]}` as any) || p.fishing_types[0]}
                </Badge>
              )}
            </button>
          ))}
          {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
            <p className="text-center py-10 text-sm text-muted-foreground">{t('messages.noUserFound')}</p>
          )}
        </div>
      </div>
    );
  }

  // Inbox
  return (
    <AppLayout>
      <SEOHead title={`${t('messages.title')} | Flywaters`} description={t('seo.defaultDescription')} />
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 lg:hidden">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold text-foreground">{t('messages.title')}</h1>
          <button onClick={() => setShowSearch(true)} className="p-2 hover:bg-muted rounded-full transition-colors">
            <PenSquare className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>
      <div className="hidden lg:flex max-w-lg mx-auto px-4 pt-4 justify-between items-center">
        <h1 className="text-lg font-semibold text-foreground">{t('messages.title')}</h1>
        <button onClick={() => setShowSearch(true)} className="p-2 hover:bg-muted rounded-full transition-colors">
          <PenSquare className="w-5 h-5 text-foreground" />
        </button>
      </div>
      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <div className="w-2.5" />
                <div className="h-14 w-14 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-28 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-40 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-3 w-8 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Send className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold">{t('messages.noMessages')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('messages.startConversation')}</p>
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => setShowSearch(true)}
            >
              <Users className="w-4 h-4 mr-2" /> {t('messages.findAnglers')}
            </Button>
          </div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.user_id}
              onClick={() => setSelectedUser(conv)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border text-left"
            >
              {/* Unread dot */}
              <div className="w-2.5 shrink-0 flex justify-center">
                {conv.unread > 0 && <span className="w-2 h-2 rounded-full bg-blue-500" />}
              </div>
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarImage src={conv.avatar_url || ''} />
                <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                  {(conv.display_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm text-foreground truncate ${conv.unread > 0 ? 'font-bold' : 'font-medium'}`}>
                    {conv.display_name || conv.username}
                  </p>
                  <span className={`text-xs shrink-0 ml-2 ${conv.unread > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                    {formatTime(conv.last_time)}
                  </span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${conv.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {conv.last_message.length > 40 ? conv.last_message.slice(0, 40) + '…' : conv.last_message}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </AppLayout>
  );
};

export default Messages;
