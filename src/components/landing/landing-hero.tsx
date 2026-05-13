import { ArrowRightIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import { formatStars, getRepoStars } from '@/lib/github';
import { GradientHalo } from './gradient-halo';

export async function LandingHero() {
  const stars = await getRepoStars('nabinkhair42', 'db-viewer');
  const starsLabel = formatStars(stars);

  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32">
      <GradientHalo variant="hero" />

      <div className="mx-auto max-w-[1080px] px-6">
        <div className="flex flex-col items-start gap-6">
          <div className="inline-flex h-7 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 font-mono text-[11px] text-[#d0d6e0]">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>v0.x · open source · self-hostable</span>
          </div>

          <h1 className="max-w-[920px] text-[40px] leading-[1.05] font-medium tracking-[-0.022em] text-balance text-[#f7f8f8] md:text-[64px]">
            The database client your team{' '}
            <span className="text-[#8a8f98]">actually wants to use.</span>
          </h1>

          <p className="max-w-[640px] text-[17px] leading-[1.5] text-[#8a8f98]">
            A fast, web-native, encrypted SQL workspace for engineers who are tired of desktop
            clients from 2014. Connect, query, edit, ship — without leaving your browser.
          </p>

          <div className="mt-2 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="group flex h-10 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-[14px] font-medium text-primary-foreground shadow-[0_-1px_1px_rgba(0,0,0,0.18)_inset,0_1px_2px_rgba(0,0,0,0.4)] transition-all hover:brightness-110"
            >
              Get started — it&apos;s free
              <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="https://github.com/nabinkhair42/db-viewer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-white/[0.1] bg-white/[0.03] px-4 text-[14px] font-medium text-[#f7f8f8] transition-all hover:bg-white/[0.06]"
            >
              <StarIcon className="size-3.5" />
              Star on GitHub
              {starsLabel && (
                <span className="font-mono text-[12px] text-[#8a8f98]">· {starsLabel}</span>
              )}
            </Link>
          </div>

          <p className="mt-2 font-mono text-[11px] text-[#62666d]">
            No credit card. No telemetry. Your credentials never leave your machine.
          </p>
        </div>

        <ProductScreenshotPlaceholder />
      </div>
    </section>
  );
}

function ProductScreenshotPlaceholder() {
  return (
    <div className="relative mx-auto mt-20 max-w-[1080px]">
      <div
        aria-hidden
        className="absolute -inset-x-20 -top-10 -bottom-10 -z-10 bg-[radial-gradient(60%_60%_at_50%_40%,oklch(0.558_0.288_302.321_/_0.22),transparent_75%)] blur-2xl"
      />
      <div
        className="relative aspect-[16/9] overflow-hidden rounded-[14px] border border-dashed border-white/[0.12] bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]"
        style={{
          transform: 'perspective(2400px) rotateX(6deg)',
          transformOrigin: 'center top',
        }}
      >
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="font-mono text-[11px] tracking-wider text-[#62666d] uppercase">
            Product screenshot
          </span>
          <span className="text-[13px] text-[#62666d]">
            SQL editor · schema explorer · results grid
          </span>
        </div>
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 -bottom-px h-32 bg-gradient-to-b from-transparent to-[#08090a]"
      />
    </div>
  );
}
