import {
  DatabaseIcon,
  KeyRoundIcon,
  type LucideIcon,
  TableIcon,
  TerminalSquareIcon,
} from 'lucide-react';

type Feature = {
  eyebrow: string;
  headline: string;
  body: string;
  icon: LucideIcon;
  surfaceLabel: string;
};

const FEATURES: readonly Feature[] = [
  {
    eyebrow: 'SQL editor',
    headline: "An editor that doesn't feel like a textarea.",
    body: 'CodeMirror 6 with PostgreSQL-aware autocomplete, syntax highlighting, query history, and Ctrl+Enter to run. Export to CSV or JSON without leaving the keyboard.',
    icon: TerminalSquareIcon,
    surfaceLabel: 'editor.tsx',
  },
  {
    eyebrow: 'Schema explorer',
    headline: 'Schema you can actually read.',
    body: 'A tree of tables, columns, indexes, and relationships. Click anything to inspect, query, or edit. No five-tab menu, no nested popovers, no waiting for an introspection query to finish.',
    icon: DatabaseIcon,
    surfaceLabel: 'public · 14 tables',
  },
  {
    eyebrow: 'Data grid',
    headline: "A spreadsheet that knows it's a database.",
    body: 'Inline cell editing with type-aware inputs. Sort, filter, paginate, and bulk-update rows. Booleans get checkboxes. Enums get selects. JSONB gets a real editor. Nothing turns into a string.',
    icon: TableIcon,
    surfaceLabel: 'users · 1,783 rows',
  },
  {
    eyebrow: 'Connections',
    headline: "Connections that don't leak.",
    body: 'AES-256-GCM at rest. SSH tunnel support out of the box. Latency and version reported on connect. Your credentials never get shipped to a third party, because there is no third party.',
    icon: KeyRoundIcon,
    surfaceLabel: 'production-db · 12ms',
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="relative px-6 py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.08),transparent)]"
      />
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-16 grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-7">
            <p className="font-mono text-[11px] tracking-wider text-[#62666d] uppercase">
              Features
            </p>
            <h2 className="mt-3 text-[32px] leading-[1.1] font-medium tracking-[-0.022em] text-balance text-[#f7f8f8] md:text-[44px]">
              The basics, done right.
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:pt-12">
            <p className="text-[15px] leading-[1.6] text-[#8a8f98]">
              We&apos;re not reinventing SQL clients. We&apos;re just building one that loads in
              under a second, respects your keyboard, and doesn&apos;t cost $79/year.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {FEATURES.map((feature, index) => (
            <FeatureBlock key={feature.eyebrow} feature={feature} reverse={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureBlock({ feature, reverse }: { feature: Feature; reverse: boolean }) {
  const Icon = feature.icon;
  return (
    <div className="grid grid-cols-12 gap-6 overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(255,255,255,0.015)] md:gap-8">
      <div
        className={`col-span-12 flex flex-col justify-center gap-4 p-8 md:col-span-5 md:p-10 ${
          reverse ? 'md:order-2' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-[#8a8f98]" />
          <span className="font-mono text-[11px] tracking-wider text-[#62666d] uppercase">
            {feature.eyebrow}
          </span>
        </div>
        <h3 className="text-[24px] leading-[1.15] font-medium tracking-[-0.015em] text-balance text-[#f7f8f8]">
          {feature.headline}
        </h3>
        <p className="text-[15px] leading-[1.6] text-[#8a8f98]">{feature.body}</p>
      </div>

      <div className={`col-span-12 md:col-span-7 ${reverse ? 'md:order-1' : ''}`}>
        <FeatureSurface label={feature.surfaceLabel} />
      </div>
    </div>
  );
}

function FeatureSurface({ label }: { label: string }) {
  return (
    <div className="relative h-full min-h-[260px] overflow-hidden border-l border-white/[0.06] bg-[#0a0b0d] md:min-h-[320px]">
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div
        aria-hidden
        className="absolute -top-20 left-1/2 h-64 w-[120%] -translate-x-1/2 bg-[radial-gradient(closest-side,oklch(0.558_0.288_302.321_/_0.18),transparent_75%)] blur-2xl"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="font-mono text-[10px] tracking-wider text-[#62666d] uppercase">
          Screenshot
        </span>
        <span className="font-mono text-[12px] text-[#8a8f98]">{label}</span>
      </div>
    </div>
  );
}
