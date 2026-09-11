import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'fw-welcome-shown';

const WelcomeBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user) {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    }
  }, [user]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible || !user) return null;

  const displayName = user.user_metadata?.full_name || user.user_metadata?.display_name || 'Pescatore';

  return (
    <div
      className="mx-4 mt-4 p-4 rounded-xl relative"
      style={{ backgroundColor: '#e8f5e9' }}
    >
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 text-stone hover:opacity-70 transition-opacity"
        aria-label="Chiudi banner"
      >
        <X className="w-4 h-4" />
      </button>

      <p className="text-sm font-semibold text-foreground pr-6 mb-1">
        👋 Benvenuto su Flywaters, {displayName}!
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        Inizia seguendo altri pescatori o aggiungi il tuo primo spot sulla mappa.
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/mappa')}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Esplora la mappa
        </button>
        <button
          onClick={() => {
            // Scroll to suggested users section on the feed
            const el = document.getElementById('suggested-anglers');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            dismiss();
          }}
          className="text-xs font-semibold px-4 py-2 rounded-lg border border-border bg-white/60 text-foreground hover:bg-white transition-colors"
        >
          Trova pescatori
        </button>
      </div>
    </div>
  );
};

export default WelcomeBanner;
