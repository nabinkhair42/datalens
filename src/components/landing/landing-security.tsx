import { GitBranchIcon, LockIcon, type LucideIcon, ShieldIcon } from 'lucide-react';

type Pillar = {
  eyebrow: string;
  headline: string;
  body: string;
  icon: LucideIcon;
};

const PILLARS: readonly Pillar[] = [
  {
    eyebrow: 'AES-256-GCM',
    headline: 'Credentials encrypted at rest.',
    body: 'Every connection string, password, and SSH key is encrypted with AES-256-GCM the moment you save it. Decrypted only at query time, in memory, never logged.',
    icon: LockIcon,
  },
  {
    eyebrow: 'SSH tunnels',
    headline: 'Reach prod without exposing it.',
    body: 'Connect through your existing bastion. Bring your own private key. DataLens never asks you to open a port to the public internet — because that would be a bad idea.',
    icon: ShieldIcon,
  },
  {
    eyebrow: 'Open source',
    headline: 'Audit it. Fork it. Self-host it.',
    body: 'The entire codebase is on GitHub under a permissive license. If you don’t trust us with your credentials, run DataLens on your own box. We’d actually prefer that.',
    icon: GitBranchIcon,
  },
];

export function LandingSecurity() {
  return (
    <section id="security" className="relative px-6 py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.08),transparent)]"
      />

      <div className="mx-auto max-w-[1080px]">
        <div className="mb-14 grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-7">
            <p className="font-mono text-[11px] tracking-wider text-[#62666d] uppercase">
              Security &amp; connections
            </p>
            <h2 className="mt-3 text-[32px] leading-[1.1] font-medium tracking-[-0.022em] text-balance text-[#f7f8f8] md:text-[44px]">
              The boring parts, taken seriously.
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:pt-12">
            <p className="text-[15px] leading-[1.6] text-[#8a8f98]">
              We’re not going to put a SOC 2 badge on the homepage. Here’s what we actually do.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-white/[0.06] bg-white/[0.06] md:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article
                key={pillar.eyebrow}
                className="flex flex-col gap-4 bg-[#08090a] p-8 md:p-10"
              >
                <Icon className="size-4 text-[#8a8f98]" />
                <p className="font-mono text-[11px] tracking-wider text-[#62666d] uppercase">
                  {pillar.eyebrow}
                </p>
                <h3 className="text-[20px] leading-[1.2] font-medium tracking-[-0.015em] text-balance text-[#f7f8f8]">
                  {pillar.headline}
                </h3>
                <p className="text-[14px] leading-[1.6] text-[#8a8f98]">{pillar.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
