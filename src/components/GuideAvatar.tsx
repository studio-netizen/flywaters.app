import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface GuideAvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  isGuide?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBadge?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
  xl: 'h-14 w-14',
  '2xl': 'h-20 w-20 lg:h-24 lg:w-24',
};

const badgeSizeMap = {
  sm: 'w-3 h-3 -bottom-0 -right-0',
  md: 'w-4 h-4 -bottom-0.5 -right-0.5',
  lg: 'w-5 h-5 -bottom-0.5 -right-0.5',
  xl: 'w-6 h-6 -bottom-0.5 -right-0.5',
  '2xl': 'w-7 h-7 -bottom-1 -right-1',
};

const iconSizeMap = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
};

/** Stylized fly hook + feather icon (gold) */
const FlyIcon = ({ size = 12 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Hook curve */}
    <path
      d="M7 5v8a4 4 0 0 0 4 4h2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Hook eye */}
    <circle cx="7" cy="4" r="1.4" stroke="currentColor" strokeWidth="1.5" fill="none" />
    {/* Feather strands */}
    <path
      d="M13 17l3-2M13 17l3 0M13 17l2.5 2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const GuideAvatar = ({
  src,
  alt,
  fallback,
  isGuide,
  size = 'md',
  showBadge = true,
  className,
}: GuideAvatarProps) => {
  const { t } = useTranslation();

  const avatar = (
    <Avatar
      className={cn(sizeMap[size], className)}
    >
      <AvatarImage src={src || ''} alt={alt} />
      <AvatarFallback className="bg-muted text-muted-foreground">
        {(fallback || 'U')[0].toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  if (!isGuide) return avatar;

  // Static gold gradient border (no animation per design decision)
  const goldGradientWrapper = (
    <span
      className="relative inline-block shrink-0 rounded-full p-[2.5px]"
      style={{
        background:
          'linear-gradient(135deg, hsl(43, 90%, 65%) 0%, hsl(38, 85%, 50%) 50%, hsl(43, 90%, 65%) 100%)',
      }}
    >
      <span className="block rounded-full bg-background p-[2px]">
        {avatar}
      </span>
      {showBadge && (
        <span
          className={cn(
            'absolute rounded-full bg-background flex items-center justify-center shadow-md ring-1 ring-[hsl(43,74%,55%)]',
            badgeSizeMap[size]
          )}
          style={{ color: 'hsl(38, 85%, 45%)' }}
        >
          <FlyIcon size={iconSizeMap[size]} />
        </span>
      )}
    </span>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{goldGradientWrapper}</TooltipTrigger>
        <TooltipContent side="top">{t('guide.tooltip')}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** Standalone golden fly icon — used inline next to a guide's display name. */
export const GoldenFlyInline = ({ size = 14 }: { size?: number }) => {
  const { t } = useTranslation();
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex items-center justify-center"
            style={{ color: 'hsl(38, 85%, 45%)' }}
            aria-label={t('guide.tooltip')}
          >
            <FlyIcon size={size} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{t('guide.tooltip')}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GuideAvatar;
