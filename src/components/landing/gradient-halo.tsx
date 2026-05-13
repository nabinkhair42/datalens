import { cn } from '@/lib/utils';

type GradientHaloProps = {
  className?: string;
  /** 'hero' = strongest, centered; 'section' = subtle top fade */
  variant?: 'hero' | 'section';
};

export function GradientHalo({ className, variant = 'section' }: GradientHaloProps) {
  if (variant === 'hero') {
    return (
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
      >
        <div className="absolute top-[10%] left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.558_0.288_302.321_/_0.28),transparent_75%)] blur-3xl" />
        <div className="absolute top-[40%] left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.558_0.288_302.321_/_0.15),transparent_75%)] blur-2xl" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.12),transparent)]',
        className,
      )}
    />
  );
}
