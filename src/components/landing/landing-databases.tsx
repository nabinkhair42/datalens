import { DatabaseIcon, type LucideIcon } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { MongoDB, PostgreSQL } from '@/icons';

type DatabaseTile = {
  name: string;
  note: string;
  status: 'available' | 'soon';
  icon: ComponentType<SVGProps<SVGSVGElement>> | LucideIcon;
  iconClass?: string;
};

const DATABASES: readonly DatabaseTile[] = [
  {
    name: 'PostgreSQL',
    note: 'Full read, write, schema, and SSH tunneling.',
    status: 'available',
    icon: PostgreSQL,
  },
  {
    name: 'MySQL',
    note: 'Read-only beta first, write support after.',
    status: 'soon',
    icon: DatabaseIcon,
    iconClass: 'text-[#8a8f98]',
  },
  {
    name: 'SQLite',
    note: 'Local file mode and WASM runtime.',
    status: 'soon',
    icon: DatabaseIcon,
    iconClass: 'text-[#8a8f98]',
  },
  {
    name: 'MongoDB',
    note: 'Collections, indexes, aggregate pipelines.',
    status: 'soon',
    icon: MongoDB,
  },
];

export function LandingDatabases() {
  return (
    <section id="databases" className="relative px-6 py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.08),transparent)]"
      />

      <div className="mx-auto max-w-[1080px]">
        <div className="mb-14 grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-7">
            <p className="font-mono text-[11px] tracking-wider text-[#62666d] uppercase">
              Supported databases
            </p>
            <h2 className="mt-3 text-[32px] leading-[1.1] font-medium tracking-[-0.022em] text-balance text-[#f7f8f8] md:text-[44px]">
              PostgreSQL today. Everything else, soon.
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:pt-12">
            <p className="text-[15px] leading-[1.6] text-[#8a8f98]">
              We&apos;d rather support four databases properly than fifteen badly. PostgreSQL is the
              one we use every day. The rest are queued.
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DATABASES.map((db) => {
            const Icon = db.icon;
            return (
              <li
                key={db.name}
                className="flex items-start gap-5 rounded-[14px] border border-white/[0.06] bg-[rgba(255,255,255,0.015)] p-6"
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.03]">
                  <Icon className={`size-6 ${db.iconClass ?? ''}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[16px] font-medium text-[#f7f8f8]">{db.name}</p>
                    <StatusBadge status={db.status} />
                  </div>
                  <p className="mt-1.5 text-[13px] leading-[1.55] text-[#8a8f98]">{db.note}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: DatabaseTile['status'] }) {
  if (status === 'available') {
    return (
      <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-primary/15 px-2 font-mono text-[10px] font-medium tracking-wider text-primary uppercase">
        <span className="size-1.5 rounded-full bg-primary" />
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 items-center rounded-full border border-white/[0.08] bg-white/[0.02] px-2 font-mono text-[10px] font-medium tracking-wider text-[#8a8f98] uppercase">
      Coming soon
    </span>
  );
}
