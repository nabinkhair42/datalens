import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { DataLensLogo } from '@/icons/datalens-logo';

export function LandingNav() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50">
      <div className="absolute inset-0 -z-10 border-b border-white/[0.06] bg-[rgba(8,9,10,0.65)] backdrop-blur-xl" />
      <nav className="mx-auto flex h-14 max-w-[1080px] items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="-ml-2 inline-flex items-center gap-2.5 rounded-md px-2 py-1 transition-colors hover:bg-white/[0.04]"
        >
          <DataLensLogo className="size-5" />
          <span className="flex items-baseline gap-2">
            <span className="text-[14px] font-medium tracking-tight text-[#f7f8f8]">DataLens</span>
            <span className="hidden font-mono text-[10px] tracking-wider text-[#62666d] uppercase sm:inline">
              v0.1 · beta
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="hidden h-8 items-center rounded-md px-3 text-[13px] font-medium text-[#8a8f98] transition-colors hover:bg-white/[0.05] hover:text-[#f7f8f8] sm:inline-flex"
          >
            Sign in
          </Link>

          <Link
            href="/login"
            className="group inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground shadow-[0_-1px_1px_rgba(0,0,0,0.16)_inset,0_1px_2px_rgba(0,0,0,0.4)] transition-all hover:brightness-110"
          >
            Open app
            <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
