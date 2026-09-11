import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MapPin, Star, ArrowRight, Bug, Fish } from 'lucide-react';

interface SpotLite {
  id: string;
  name: string;
  description: string | null;
  spot_type: string;
  fish_species: string[] | null;
  hatch_activity?: string[] | null;
  photos?: string[] | null;
  avg_rating: number;
  review_count: number;
}

interface Props {
  spot: SpotLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SPOT_TYPE_KEY: Record<string, string> = {
  lake: 'lake', river: 'river', sea: 'sea', stream: 'stream',
};

const SpotDetailDrawer = ({ spot, open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  if (!spot) return null;

  const typeLabel = t(`map.${SPOT_TYPE_KEY[spot.spot_type] || 'river'}`);
  const photos = spot.photos?.filter(Boolean) ?? [];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh]">
        <div className="overflow-y-auto px-4 pb-6 pt-2">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <DrawerTitle className="truncate">{spot.name}</DrawerTitle>
              <DrawerDescription className="flex items-center gap-2 mt-1 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warm-white text-[#242242] font-medium">
                  <MapPin className="w-3 h-3" /> {typeLabel}
                </span>
                {spot.avg_rating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {Number(spot.avg_rating).toFixed(1)} ({spot.review_count})
                  </span>
                )}
              </DrawerDescription>
            </div>
          </div>

          {photos.length > 0 && (
            <div className="-mx-4 mt-3">
              <div
                className="flex gap-2 overflow-x-auto px-4 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none' }}
              >
                {photos.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`${spot.name} ${i + 1}`}
                    loading="lazy"
                    className="h-44 w-72 flex-shrink-0 rounded-xl object-cover snap-start"
                    style={{ filter: 'saturate(0.85)' }}
                  />
                ))}
              </div>
            </div>
          )}

          {spot.description && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {spot.description}
            </p>
          )}

          {spot.fish_species?.length ? (
            <div className="mt-4">
              <p className="label-caps text-muted-foreground mb-2 flex items-center gap-1.5">
                <Fish className="w-3.5 h-3.5" /> {t('spot.fishSpecies')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {spot.fish_species.map(f => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-warm-white text-[#242242]">{f}</span>
                ))}
              </div>
            </div>
          ) : null}

          {spot.hatch_activity?.length ? (
            <div className="mt-4">
              <p className="label-caps text-muted-foreground mb-2 flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5" /> {t('map.hatchActivity')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {spot.hatch_activity.map(h => (
                  <span key={h} className="text-xs px-2.5 py-1 rounded-full bg-[#242242]/10 text-[#242242] font-medium">{h}</span>
                ))}
              </div>
            </div>
          ) : null}

          <Button asChild className="w-full mt-6 rounded-full">
            <Link to={`/spot/${spot.id}`}>
              {t('map.seeDetails')} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default memo(SpotDetailDrawer);
