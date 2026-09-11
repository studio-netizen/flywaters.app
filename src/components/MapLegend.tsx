import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, X } from 'lucide-react';

const SPOT_COLORS: Record<string, string> = {
  river: '#06b6d4',
  lake: '#3b82f6',
  sea: '#1e40af',
  stream: '#14b8a6',
};

const MapLegend = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-24 lg:bottom-6 right-4 z-[1000]">
      {open ? (
        <div
          className="rounded-2xl p-3 pr-2 shadow-xl border border-white/40"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="label-caps text-[#242242]">{t('map.legend')}</span>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Close legend"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ul className="space-y-1.5 pr-2">
            {Object.entries(SPOT_COLORS).map(([key, color]) => (
              <li key={key} className="flex items-center gap-2 text-xs text-[#242242]">
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-white shadow"
                  style={{ background: color }}
                />
                {t(`map.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full p-2.5 shadow-xl border border-white/40 hover:scale-105 transition-transform"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
          aria-label={t('map.legend')}
        >
          <Info className="w-4 h-4 text-[#242242]" />
        </button>
      )}
    </div>
  );
};

export default memo(MapLegend);
