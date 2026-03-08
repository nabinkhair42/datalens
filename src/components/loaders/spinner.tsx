import { memo } from 'react';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
};

export const Spinner = memo(function Spinner({
  size = 'md',
  className,
}: SpinnerProps): React.ReactElement {
  return (
    <output
      className={cn(
        'block animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size],
        className,
      )}
      aria-label="Loading"
    />
  );
});

export const PageLoader = memo(function PageLoader(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
});

interface InlineLoaderProps {
  text?: string;
}

export const InlineLoader = memo(function InlineLoader({
  text = 'Loading...',
}: InlineLoaderProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
});
