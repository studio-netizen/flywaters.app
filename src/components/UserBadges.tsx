import { Compass, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserBadges as UserBadgesType } from '@/lib/badges';

interface Props {
  badges: UserBadgesType;
  size?: 'sm' | 'md';
}

const UserBadges = ({ badges, size = 'md' }: Props) => {
  const { t } = useTranslation();
  if (!badges.explorer && !badges.sentinel) return null;

  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const ic = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {badges.explorer && (
        <span className={`inline-flex items-center gap-1 rounded-full bg-[#242242] text-white font-semibold ${px}`}>
          <Compass className={ic} /> {t('badges.explorer')}
        </span>
      )}
      {badges.sentinel && (
        <span className={`inline-flex items-center gap-1 rounded-full bg-[#dc2626] text-white font-semibold ${px}`}>
          <Shield className={ic} /> {t('badges.sentinel')}
        </span>
      )}
    </div>
  );
};

export default UserBadges;
