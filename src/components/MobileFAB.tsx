import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Camera, MapPin, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

const HIDDEN_PREFIXES = ['/publish', '/messages', '/auth', '/admin', '/reset-password', '/invito', '/onboarding'];

const MobileFAB = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!user) return null;
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  const actions = [
    { icon: Camera, label: t('fab.newPost'), onClick: () => navigate('/publish') },
    { icon: MapPin, label: t('fab.shareSpot'), onClick: () => navigate('/mappa?action=new-spot') },
    { icon: AlertTriangle, label: t('fab.report'), onClick: () => navigate('/mappa?action=report') },
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <div
        className="fixed right-4 z-50 lg:hidden flex flex-col items-end gap-2"
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        {open && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-scale-in origin-bottom-right">
            {actions.map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={() => { setOpen(false); onClick(); }}
                className="flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full bg-background border border-black/[0.08] shadow-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <span>{label}</span>
                <span className="w-8 h-8 rounded-full bg-[#242242] text-[#f5f0e8] flex items-center justify-center">
                  <Icon className="w-4 h-4" strokeWidth={1.8} />
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t('fab.close') : t('fab.open')}
          className={`w-14 h-14 rounded-full bg-[#242242] text-[#f5f0e8] shadow-xl flex items-center justify-center transition-transform ${open ? 'rotate-45' : ''}`}
        >
          {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" strokeWidth={2} />}
        </button>
      </div>
    </>
  );
};

export default MobileFAB;
