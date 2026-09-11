import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import DesktopSidebar from './DesktopSidebar';
import MobileFAB from './MobileFAB';

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  hideFAB?: boolean;
}

const AppLayout = ({ children, hideNav, hideFAB }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />
      <main className="flex-1 min-w-0 pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>
      {!hideNav && <BottomNav />}
      {!hideNav && !hideFAB && <MobileFAB />}
    </div>
  );
};

export default AppLayout;

