import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { DataLensLogo } from '@/icons/datalens-logo';
import { GitHubIcon } from '@/icons/github';

type LandingMaintenanceProps = {
  /** Optional ETA shown under the headline, e.g. "Back online in ~30 minutes" */
  eta?: string;
  /** Optional override for the body copy */
  message?: string;
};

export function LandingMaintenance({ eta, message }: LandingMaintenanceProps) {
  return (
    <div className="dark relative flex min-h-screen flex-col bg-[#08090a] text-[#f7f8f8] [color-scheme:dark]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.558_0.288_302.321_/_0.22),transparent_75%)] blur-3xl" />
        <div className="absolute top-[60%] left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.558_0.288_302.321_/_0.12),transparent_75%)] blur-2xl" />
      </div>

      <header className="px-6 pt-8">
        <Link
          href="/"
          className="-ml-2 inline-flex items-center gap-2.5 rounded-md px-2 py-1 transition-colors hover:bg-white/[0.04]"
        >
          <DataLensLogo className="size-5" />
          <span className="text-[14px] font-medium tracking-tight text-[#f7f8f8]">DataLens</span>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-7 text-center">
          <span className="inline-flex h-7 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 font-mono text-[11px] text-[#d0d6e0]">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative size-1.5 rounded-full bg-primary" />
            </span>
            <span>Scheduled maintenance</span>
          </span>

          <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-0.022em] text-balance text-[#f7f8f8] md:text-[56px]">
            We&apos;ll be <span className="text-[#8a8f98]">right back.</span>
          </h1>

          <p className="max-w-[480px] text-[16px] leading-[1.6] text-[#8a8f98]">
            {message ??
              "DataLens is briefly offline while we ship an update. Your data and connections are safe — we're just swapping out a few things under the hood."}
          </p>

          {eta && <p className="font-mono text-[12px] text-[#62666d]">{eta}</p>}

          <div className="mt-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <a
              href="https://github.com/nabinkhair42/db-viewer"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-white/[0.1] bg-white/[0.03] px-4 text-[14px] font-medium text-[#f7f8f8] transition-all hover:bg-white/[0.06]"
            >
              <GitHubIcon className="size-3.5" />
              Follow updates on GitHub
              <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </main>

      <footer className="px-6 pb-8">
        <p className="text-center font-mono text-[11px] text-[#62666d]">
          © {new Date().getFullYear()} DataLens · status updates at the GitHub repo
        </p>
      </footer>
    </div>
  );
}
