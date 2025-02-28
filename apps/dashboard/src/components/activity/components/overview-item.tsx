import { CopyButton } from '@/components/primitives/copy-button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/primitives/tooltip';
import { cn } from '@/utils/ui';
import { ReactNode } from 'react';

interface OverviewItemProps {
  children?: ReactNode;
  className?: string;
  isCopyable?: boolean;
  isDeleted?: boolean;
  isMonospace?: boolean;
  label: string;
  value?: string;
}

export function OverviewItem({
  children,
  className = '',
  isCopyable = false,
  isDeleted = false,
  isMonospace = true,
  label,
  value,
}: OverviewItemProps) {
  const childrenComponent = children || (
    <span className={cn('text-foreground-600 text-xs', { 'font-mono': isMonospace, 'line-through': isDeleted })}>
      {value}
    </span>
  );

  const wrappedChildren = isDeleted ? (
    <Tooltip>
      <TooltipTrigger>{childrenComponent}</TooltipTrigger>
      <TooltipContent>Resource was deleted.</TooltipContent>
    </Tooltip>
  ) : (
    childrenComponent
  );

  return (
    <div className={cn('group flex items-center justify-between', className)}>
      <span className="text-foreground-950 text-xs font-medium">{label}</span>
      <div className="relative flex items-center gap-2">
        {isCopyable && value && <CopyButton valueToCopy={value} size="2xs" />}
        {wrappedChildren}
      </div>
    </div>
  );
}
