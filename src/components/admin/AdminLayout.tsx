import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  MapPin,
  Image,
  PenLine,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  ScrollText,
  Settings2,
} from 'lucide-react';
import SystemAlerts from './SystemAlerts';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Panoramica', end: true },
  { to: '/admin/users', icon: Users, label: 'Utenti' },
  { to: '/admin/messages', icon: MessageSquare, label: 'Messaggi' },
  { to: '/admin/spots', icon: MapPin, label: 'Spot' },
  { to: '/admin/posts', icon: Image, label: 'Post' },
  { to: '/admin/reports', icon: AlertTriangle, label: 'Segnalazioni' },
  { to: '/admin/blog', icon: PenLine, label: 'Blog' },
  { to: '/admin/audit-log', icon: ScrollText, label: 'Audit Log' },
  { to: '/admin/system', icon: Settings2, label: '⚙️ Sistema' },
  { to: '/admin/settings', icon: Settings, label: 'Impostazioni' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 md:static md:translate-x-0 flex flex-col h-full w-60 border-r bg-card transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <span className="font-bold text-lg" style={{ color: '#242242' }}>
            Flywaters
          </span>
          <span className="text-xs text-muted-foreground">Admin</span>
          <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#242242] text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 h-14 px-4 border-b bg-card">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-xs text-muted-foreground ml-auto">
            Ultimo aggiornamento: {new Date().toLocaleString('it-IT')}
          </span>
        </header>
        <SystemAlerts />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
