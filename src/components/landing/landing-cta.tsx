import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';

export function LandingCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-28">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),#08090a_60%)]"
      />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -z-10 h-[400px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.558_0.288_302.321_/_0.22),transparent_75%)] blur-3xl"
      />

      <div className="mx-auto max-w-[1080px]">
        <div className="grid grid-cols-12 items-center gap-8">
          <div className="col-span-12 md:col-span-8">
            <h2 className="text-[32px] leading-[1.1] font-medium tracking-[-0.022em] text-balance text-[#f7f8f8] md:text-[40px]">
              Stop SSH-ing into prod at 2am.
            </h2>
            <p className="mt-4 max-w-[520px] text-[15px] leading-[1.6] text-[#8a8f98]">
              Open a browser tab, run a query, fix the row, close the tab. That&apos;s the whole
              experience.
            </p>
          </div>
          <div className="col-span-12 flex flex-col gap-3 md:col-span-4 md:items-end">
            <Link
              href="/login"
              className="group flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-[14px] font-medium text-primary-foreground shadow-[0_-1px_1px_rgba(0,0,0,0.18)_inset,0_1px_2px_rgba(0,0,0,0.4)] transition-all hover:brightness-110 md:w-auto"
            >
              Get started
              <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="https://github.com/nabinkhair42/db-viewer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-white/[0.1] bg-white/[0.03] px-4 text-[14px] font-medium text-[#f7f8f8] transition-all hover:bg-white/[0.06] md:w-auto"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
