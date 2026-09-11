import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, PlusSquare, Bell, User, Send, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logoImg from '@/assets/flywaters-logo-dark.png';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import UserSearch from '@/components/UserSearch';
import SidebarWidgets from '@/components/SidebarWidgets';

const DesktopSidebar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const unreadMessages = useUnreadMessages();
  const { t } = useTranslation();

  const { data: profile } = useQuery({
    queryKey: ['sidebar-profile', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, user_id, username, display_name, avatar_url, fishing_types').eq('user_id', user!.id).single();
      return data;
    },
  });

  const { data: unreadNotifs = 0 } = useQuery({
    queryKey: ['unread-notifs', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase.from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id).eq('read', false);
      return count || 0;
    },
  });

  const links = [
    { to: '/', icon: Home, label: t('nav.feed') },
    { to: '/mappa', icon: Map, label: t('nav.map') },
    { to: '/publish', icon: PlusSquare, label: t('nav.publish') },
    { to: '/messages', icon: Send, label: t('nav.messages'), badge: unreadMessages },
    { to: '/notifications', icon: Bell, label: t('nav.notifications'), badge: unreadNotifs },
    { to: user ? `/profile/${user.id}` : '/auth', icon: User, label: t('nav.profile') },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 border-r border-black/[0.08] bg-background px-4 py-6">
      <div className="mb-8 px-2 flex items-center justify-between">
        <img src={logoImg} alt="Flywaters — La community italiana per la pesca a mosca" className="h-8" />
        <LanguageSwitcher />
      </div>

      <UserSearch />

      <nav className="flex-1 space-y-1">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const isActive = location.pathname === to || (to === '/' && location.pathname === '/');
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-all ${
                isActive
                  ? 'bg-[#242242] text-white font-semibold'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.5} />
                {badge && badge > 0 ? (
                  <span
                    className="absolute flex items-center justify-center font-bold text-white"
                    style={{ top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#e53e3e', fontSize: 11, lineHeight: 1 }}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </div>
              {label}
            </NavLink>
          );
        })}
      </nav>

      <SidebarWidgets />


      {user && profile && (
        <div className="border-t border-black/[0.08] pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile.avatar_url || ''} alt={`Profilo di ${profile.username || profile.display_name || 'utente'} su Flywaters`} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {(profile.display_name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{profile.display_name || profile.username}</p>
              <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-full text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </aside>
  );
};

export default memo(DesktopSidebar);
