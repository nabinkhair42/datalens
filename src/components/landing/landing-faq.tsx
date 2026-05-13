import { PlusIcon } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Is my data sent to your servers?',
    a: 'No. Queries run from your browser, through our backend only when you need server-side execution (e.g. SSH tunneling). Results are not stored. Connection strings are encrypted with AES-256-GCM, decrypted in-memory at query time, and never logged.',
  },
  {
    q: 'Can I self-host it?',
    a: "Yes. DataLens is open source. Clone the repo, set DATABASE_URL and an encryption key, and run docker compose up. We'd genuinely prefer you do this for production databases.",
  },
  {
    q: 'How does it compare to TablePlus or DBeaver?',
    a: 'TablePlus is fast but native and paid. DBeaver does everything but feels like a Java app from 2011. DataLens is web-native (no install), free, open source, and built for the keyboard. We are not trying to replace either for every use case — we are trying to be the one you actually open.',
  },
  {
    q: "What's on the roadmap?",
    a: 'Short term: MySQL and SQLite support, a command palette, query sharing, and a stable diff-and-apply migration flow. Longer term: collaborative cursors, saved dashboards, and a Postgres EXPLAIN visualizer. We ship in public — check the GitHub repo.',
  },
  {
    q: 'Is it really free?',
    a: 'Yes, the open-source version is free forever. If we ship a managed hosted version later, it will have a generous free tier. We will tell you well in advance and never paywall a feature you already had.',
  },
  {
    q: 'Can I contribute?',
    a: "Please. The repo has 'good first issue' tags, a contributor guide, and a Discord. PRs that fix a bug, add a database adapter, or improve performance go to the top of the queue.",
  },
] as const;

export function LandingFAQ() {
  return (
    <section id="faq" className="relative px-6 py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.08),transparent)]"
      />

      <div className="mx-auto max-w-[1080px]">
        <div className="mb-14 grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-7">
            <p className="font-mono text-[11px] tracking-wider text-[#62666d] uppercase">FAQ</p>
            <h2 className="mt-3 text-[32px] leading-[1.1] font-medium tracking-[-0.022em] text-balance text-[#f7f8f8] md:text-[44px]">
              Questions we get asked.
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:pt-12">
            <p className="text-[15px] leading-[1.6] text-[#8a8f98]">
              If something isn&apos;t here, open an issue on GitHub. We reply to most of them.
            </p>
          </div>
        </div>

        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(255,255,255,0.015)]">
          {FAQ_ITEMS.map((item) => (
            <li key={item.q}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 transition-colors hover:bg-white/[0.02]">
                  <span className="text-[15px] font-medium text-[#f7f8f8]">{item.q}</span>
                  <PlusIcon className="size-4 shrink-0 text-[#8a8f98] transition-transform group-open:rotate-45" />
                </summary>
                <div className="px-6 pb-5 text-[14px] leading-[1.65] text-[#8a8f98]">{item.a}</div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
