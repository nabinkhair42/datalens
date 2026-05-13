import Link from 'next/link';
import { DataLensLogo } from '@/icons/datalens-logo';
import { GitHubIcon } from '@/icons/github';

const BOTTOM_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
] as const;

export function LandingFooter() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#08090a] px-6 pt-16 pb-10">
      <div className="mx-auto max-w-[1080px]">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[360px]">
            <Link href="/" className="inline-flex items-center gap-2">
              <DataLensLogo className="size-5" />
              <span className="text-[14px] font-medium tracking-tight text-[#f7f8f8]">
                DataLens
              </span>
            </Link>
            <p className="mt-4 text-[13px] leading-[1.6] text-[#8a8f98]">
              The web-native, open-source database client for engineers who don&apos;t want another
              desktop app.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <a
              href="https://github.com/nabinkhair42/db-viewer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-[13px] font-medium text-[#d0d6e0] transition-colors hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-[#f7f8f8]"
            >
              <GitHubIcon className="size-3.5" />
              Star on GitHub
            </a>
            <p className="font-mono text-[11px] text-[#62666d]">Open source · MIT licensed</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse items-start justify-between gap-4 border-t border-white/[0.06] pt-6 md:flex-row md:items-center">
          <p className="font-mono text-[11px] text-[#62666d]">
            © {new Date().getFullYear()} DataLens
          </p>
          <ul className="flex items-center gap-5">
            {BOTTOM_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-[12px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
