import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, PlusSquare, Bell, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  const links = [
    { to: '/', icon: Home, label: t('nav.feed') },
    { to: '/mappa', icon: Map, label: t('nav.map') },
    { to: '/publish', icon: PlusSquare, label: t('nav.publish'), isCenter: true },
    { to: '/notifications', icon: Bell, label: t('nav.notifications') },
    { to: user ? `/profile/${user.id}` : '/auth', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-black/[0.08] lg:hidden">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {links.map(({ to, icon: Icon, label, isCenter }) => {
          const isActive = location.pathname === to || (to === '/' && location.pathname === '/');
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
            >
              <div className={`flex items-center justify-center w-10 h-8 rounded-full transition-colors ${
                isActive ? 'bg-[#242242]' : ''
              }`}>
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-muted-foreground'
                  }`}
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </div>
              <span
                className={`text-[10px] ${
                  isActive ? 'text-[#242242] font-semibold' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
