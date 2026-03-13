import { DataLensLogo } from '@/components/icons/datalens-logo';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
import { Separator } from '@/components/ui/separator';
import { MongoDB, PostgreSQL } from '@/icons';

export function LoginBranding() {
  return (
    <div className="relative hidden flex-col overflow-hidden border-r p-10 lg:flex">
      <DottedGlowBackground
        gap={10}
        radius={1.6}
        colorLightVar="--color-neutral-500"
        glowColorLightVar="--color-neutral-600"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-sky-800"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2.5 text-lg font-semibold">
        <DataLensLogo className="size-7" />
        <span>DataLens</span>
      </div>

      {/* Center headline */}
      <div className="relative z-10 my-auto space-y-4 py-20">
        <h2 className="text-4xl leading-tight font-bold tracking-tight">
          Explore your data
          <br />
          with clarity.
        </h2>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Visualize schemas, run queries, and manage your databases in one place.
        </p>
      </div>

      {/* Supported databases */}
      <div className="relative z-10 space-y-4">
        <Separator />
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          Supported databases
        </p>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <PostgreSQL className="size-6" />
            <span className="text-sm font-medium">PostgreSQL</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2.5 opacity-50">
            <MongoDB className="size-6" />
            <span className="text-sm font-medium">MongoDB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
