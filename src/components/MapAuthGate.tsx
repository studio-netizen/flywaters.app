import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Fish, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MapAuthGate = () => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  return (
    <>
      {/* Backdrop blur over the map + sidebar */}
      <div
        className="fixed inset-0 z-[1500] bg-background/40 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Centered modal card */}
      {!dismissed && (
        <div
          className="fixed inset-0 z-[1600] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="map-gate-title"
        >
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-7 sm:p-9 animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label={t('mapGate.close')}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-forest-accent/10 flex items-center justify-center">
                <Fish className="w-7 h-7 text-forest-accent" strokeWidth={1.5} />
              </div>
            </div>

            <h2
              id="map-gate-title"
              className="display-lg text-center text-foreground mb-3 text-2xl sm:text-3xl"
            >
              {t('mapGate.title')}
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground text-center leading-relaxed mb-6">
              {t('mapGate.description')}
            </p>

            <div className="space-y-3">
              <Button asChild size="lg" className="w-full rounded-full">
                <Link to="/auth">{t('mapGate.ctaJoin')}</Link>
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t('mapGate.alreadyHaveAccount')}{' '}
                <Link
                  to="/auth"
                  className="text-forest-accent font-semibold hover:underline"
                >
                  {t('mapGate.loginHere')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MapAuthGate;
