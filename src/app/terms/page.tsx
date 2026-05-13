import type { Metadata } from 'next';
import { LandingFooter, LandingNav, LandingPolicy } from '@/components/landing';

export const metadata: Metadata = {
  title: 'Terms · DataLens',
  description:
    'The terms of service for using DataLens. Short, plain English, and consistent with the MIT license the source code ships under.',
};

const SECTIONS = [
  {
    heading: 'Agreement',
    body: (
      <p>
        By using DataLens — the hosted product at this site or the open-source code in our GitHub
        repository — you agree to these terms. If you do not agree, do not use the product. The MIT
        license on the source code still applies independently to anyone who downloads it.
      </p>
    ),
  },
  {
    heading: 'The license',
    body: (
      <p>
        The DataLens source code is released under the MIT license. You can read it, fork it, modify
        it, self-host it, and ship it in your own product. The only thing we ask is that you keep
        the copyright notice intact.
      </p>
    ),
  },
  {
    heading: 'Your account',
    body: (
      <ul>
        <li>
          You are responsible for keeping your login credentials safe. We will help you recover an
          account, but we cannot undo damage done by someone who got in.
        </li>
        <li>
          You are responsible for the databases you connect. DataLens executes the queries you
          write, against the credentials you provide. Treat production with care.
        </li>
        <li>
          One human, one account. Sharing logins makes everyone&apos;s life harder when something
          goes wrong.
        </li>
      </ul>
    ),
  },
  {
    heading: 'Acceptable use',
    body: (
      <>
        <p>Do not use DataLens to:</p>
        <ul>
          <li>Access databases you do not have permission to access.</li>
          <li>Attack the service or attempt to extract other users&apos; data.</li>
          <li>
            Run automated workloads designed to abuse free-tier limits or bypass rate limiting.
          </li>
          <li>
            Do anything illegal in your jurisdiction or in the jurisdiction where the service is
            hosted.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: 'No warranty',
    body: (
      <p>
        DataLens is provided <strong>as-is</strong>, without warranty of any kind, express or
        implied. We work hard to keep it stable and your data safe, but software has bugs and
        infrastructure has bad days. Use a real backup strategy on databases that matter.
      </p>
    ),
  },
  {
    heading: 'Limitation of liability',
    body: (
      <p>
        To the maximum extent allowed by law, we are not liable for indirect, incidental, or
        consequential damages arising from your use of DataLens. Our total liability is capped at
        the amount you have paid us in the past twelve months, which for the free tier is zero.
      </p>
    ),
  },
  {
    heading: 'Termination',
    body: (
      <p>
        You can stop using DataLens any time. We can suspend or terminate accounts that violate
        these terms, especially the acceptable-use section. If we do, you can export your saved
        queries and connection metadata first.
      </p>
    ),
  },
  {
    heading: 'Changes to these terms',
    body: (
      <p>
        We may update these terms as the product evolves. If we make material changes, we will email
        account holders and update the &ldquo;Last updated&rdquo; date. Continued use after a change
        means you accept the new terms.
      </p>
    ),
  },
  {
    heading: 'Contact',
    body: (
      <p>
        Questions about these terms can go to{' '}
        <a href="mailto:nabinkhair12@gmail.com">nabinkhair12@gmail.com</a>. For product feedback,
        open an issue on{' '}
        <a
          href="https://github.com/nabinkhair42/db-viewer"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        .
      </p>
    ),
  },
] as const;

export default function TermsPage() {
  return (
    <div className="dark min-h-screen bg-[#08090a] text-[#f7f8f8] [color-scheme:dark]">
      <LandingNav />
      <main>
        <LandingPolicy
          eyebrow="Terms"
          title="The rules for using DataLens."
          intro="A short, plain-English document that covers what you agree to when you use this product. Nothing exotic. Most of it is what you'd expect."
          updatedOn="May 13, 2026"
          sections={SECTIONS}
        />
      </main>
      <LandingFooter />
    </div>
  );
}
