import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
  children?: ReactNode;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  actionIcon: ActionIcon,
  className = '',
  children,
}: EmptyStateProps) => {
  const button = actionLabel ? (
    <Button
      onClick={onAction}
      size="sm"
      className="rounded-full gap-1.5 mt-5 bg-[#242242] hover:bg-[#242242]/90 text-[#f5f0e8]"
    >
      {ActionIcon && <ActionIcon className="w-4 h-4" />}
      {actionLabel}
    </Button>
  ) : null;

  return (
    <div className={`flex flex-col items-center text-center py-14 px-6 ${className}`}>
      <div className="mx-auto w-14 h-14 rounded-full bg-[#242242]/8 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[#242242]" strokeWidth={1.6} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
      )}
      {children}
      {actionTo && actionLabel ? (
        <Button
          asChild
          size="sm"
          className="rounded-full gap-1.5 mt-5 bg-[#242242] hover:bg-[#242242]/90 text-[#f5f0e8]"
        >
          <Link to={actionTo}>
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            {actionLabel}
          </Link>
        </Button>
      ) : button}
    </div>
  );
};

export default EmptyState;
