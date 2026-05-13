import type { ReactNode } from 'react';

type PolicySection = {
  heading: string;
  body: ReactNode;
};

type LandingPolicyProps = {
  eyebrow: string;
  title: string;
  intro: string;
  updatedOn: string;
  sections: readonly PolicySection[];
};

export function LandingPolicy({ eyebrow, title, intro, updatedOn, sections }: LandingPolicyProps) {
  return (
    <article className="relative px-6 pt-32 pb-24 md:pt-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.08),transparent)]"
      />

      <div className="mx-auto max-w-[720px]">
        <header className="mb-14 flex flex-col gap-4">
          <span className="font-mono text-[11px] tracking-wider text-[#62666d] uppercase">
            {eyebrow}
          </span>
          <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-0.022em] text-balance text-[#f7f8f8] md:text-[56px]">
            {title}
          </h1>
          <p className="text-[15px] leading-[1.6] text-[#8a8f98]">{intro}</p>
          <p className="font-mono text-[11px] text-[#62666d]">Last updated · {updatedOn}</p>
        </header>

        <div className="flex flex-col gap-12">
          {sections.map((section) => (
            <section key={section.heading} className="flex flex-col gap-3">
              <h2 className="text-[20px] leading-[1.2] font-medium tracking-[-0.015em] text-[#f7f8f8]">
                {section.heading}
              </h2>
              <div className="space-y-3 text-[14px] leading-[1.7] text-[#8a8f98] [&_a]:text-[#d0d6e0] [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-[#f7f8f8] [&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-[#d0d6e0] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
