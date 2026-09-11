import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Star, UserPlus, CheckCheck, Shield, X } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import SEOHead from '@/components/SEOHead';
import EmptyState from '@/components/EmptyState';
import { useTranslation } from 'react-i18next';
import { formatTimeIt } from '@/lib/format-time';


const ICONS: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  review: Star,
  follow: UserPlus,
  message: MessageCircle,
  report_approved: Shield,
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, actor_id, post_id, spot_id, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error('[notifications] fetch error', error);
      setLoading(false);
      return;
    }
    const rows = data || [];
    const actorIds = Array.from(new Set(rows.map(r => r.actor_id).filter(Boolean))) as string[];
    let profileMap = new Map<string, any>();
    if (actorIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', actorIds);
      (profs || []).forEach(p => profileMap.set(p.user_id, p));
    }
    setNotifications(rows.map(r => ({ ...r, profiles: r.actor_id ? profileMap.get(r.actor_id) || null : null })));
    setLoading(false);

    // Mark all as read so the badge clears
    const unreadIds = rows.filter(r => !r.read).map(r => r.id);
    if (unreadIds.length) {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatTime = (date: string) => formatTimeIt(date);

  const getMessage = (type: string) => {
    switch (type) {
      case 'like': return t('notifications.likedYourPost');
      case 'comment': return t('notifications.commentedYourPost');
      case 'follow': return t('notifications.startedFollowing');
      case 'review': return t('notifications.reviewedSpot');
      case 'message': return t('notifications.sentMessage');
      case 'report_approved': return t('notifications.reportApproved');
      default: return t('notifications.interacted');
    }
  };

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const dismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">{t('auth.loginToSee')} {t('nav.notifications').toLowerCase()}</p>
        </div>
      </AppLayout>
    );
  }

  const hasUnread = notifications.some(n => !n.read);

  return (
    <AppLayout>
      <SEOHead title={`${t('notifications.title')} | Flywaters`} description={t('seo.defaultDescription')} />

      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 lg:hidden">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold text-foreground">{t('notifications.title')}</h1>
          {hasUnread && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary gap-1">
              <CheckCheck className="w-4 h-4" /> {t('notifications.markRead')}
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {hasUnread && (
          <div className="hidden lg:flex justify-end px-4 py-2 border-b border-border">
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary gap-1">
              <CheckCheck className="w-4 h-4" /> {t('notifications.markAllRead')}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <div className="h-11 w-11 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-2.5 w-12 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Heart}
            title={t('emptyStates.notificationsTitle')}
            description={t('emptyStates.notificationsDesc')}
            actionLabel={t('emptyStates.notificationsCta')}
            actionTo="/mappa"
          />

        ) : (
          notifications.map(n => {
            const Icon = ICONS[n.type] || Heart;
            const profile = n.profiles;
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) markRead(n.id);
                  if ((n.type === 'like' || n.type === 'comment') && n.post_id) navigate(`/post/${n.post_id}`);
                  else if (n.type === 'follow' && profile?.user_id) navigate(`/profile/${profile.user_id}`);
                  else if (n.type === 'report_approved') navigate('/mappa');
                }}
                className={`group w-full flex items-center gap-3 px-4 py-3 border-b border-border text-left transition-colors hover:bg-muted/30 cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <Avatar className="h-11 w-11 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                    {(profile?.display_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {n.type !== 'report_approved' && (
                      <span className="font-semibold">{profile?.display_name || profile?.username || t('notifications.someone')}</span>
                    )}
                    {n.type !== 'report_approved' && ' '}
                    {getMessage(n.type)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatTime(n.created_at)}</p>
                </div>
                <Icon className={`w-5 h-5 flex-shrink-0 ${n.type === 'like' ? 'text-destructive' : n.type === 'report_approved' ? 'text-[#dc2626]' : 'text-muted-foreground'}`} />
                <button
                  onClick={(e) => dismiss(e, n.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-muted-foreground hover:bg-muted transition-opacity"
                  aria-label={t('notifications.dismiss')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
