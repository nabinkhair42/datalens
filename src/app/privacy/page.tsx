import type { Metadata } from 'next';
import { LandingFooter, LandingNav, LandingPolicy } from '@/components/landing';

export const metadata: Metadata = {
  title: 'Privacy · DataLens',
  description:
    'How DataLens handles your data, credentials, and connection metadata. Short version: we try not to.',
};

const SECTIONS = [
  {
    heading: 'The short version',
    body: (
      <>
        <p>
          DataLens is an open-source database client. Queries run from your browser against the
          databases <em>you</em> connect to. We do not sit between your app and your data, we do not
          warehouse your rows, and we do not sell anything to anyone.
        </p>
        <p>
          If you self-host DataLens (which we recommend for production databases), this page is
          mostly informational — your data never leaves your infrastructure.
        </p>
      </>
    ),
  },
  {
    heading: 'What we collect',
    body: (
      <>
        <p>
          When you sign up for the hosted version of DataLens, we store the minimum we need to make
          the product work:
        </p>
        <ul>
          <li>Your email address, for authentication and product communication.</li>
          <li>
            Your encrypted connection strings. They are encrypted with <code>AES-256-GCM</code>{' '}
            using a key we do not log and decrypted only in-memory at query time.
          </li>
          <li>
            Metadata about saved queries, query history, and table preferences scoped to your
            account.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: 'What we do not collect',
    body: (
      <ul>
        <li>The contents of your queries beyond what is needed to render history.</li>
        <li>The rows returned by your queries.</li>
        <li>Anonymous analytics, session replays, or third-party trackers.</li>
        <li>Anything from a self-hosted instance. Self-hosting talks to your own backend.</li>
      </ul>
    ),
  },
  {
    heading: 'Credentials and SSH keys',
    body: (
      <p>
        Connection credentials and SSH private keys are encrypted at rest with{' '}
        <code>AES-256-GCM</code>. The encryption key is held outside the database and rotated
        independently. Credentials are decrypted in memory only for the duration of a query and are
        never written to logs.
      </p>
    ),
  },
  {
    heading: 'Third-party services',
    body: (
      <ul>
        <li>
          <strong>Authentication</strong> is handled by our auth provider. They see your email and
          the timestamps of your logins. Nothing else.
        </li>
        <li>
          <strong>Hosting</strong> runs on Vercel. Vercel sees standard request metadata (IP, user
          agent) to serve the app and mitigate abuse.
        </li>
        <li>We do not share data with advertisers. There are no advertisers.</li>
      </ul>
    ),
  },
  {
    heading: 'Your rights',
    body: (
      <p>
        You can export everything we have about you, delete your account, or contact us with
        questions any time. Email <a href="mailto:nabinkhair12@gmail.com">nabinkhair12@gmail.com</a>
        . We aim to reply within a few business days.
      </p>
    ),
  },
  {
    heading: 'Changes to this policy',
    body: (
      <p>
        If we update this policy, the &ldquo;Last updated&rdquo; date at the top will change and we
        will note material changes in the changelog. We will not quietly broaden what we collect.
      </p>
    ),
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="dark min-h-screen bg-[#08090a] text-[#f7f8f8] [color-scheme:dark]">
      <LandingNav />
      <main>
        <LandingPolicy
          eyebrow="Privacy"
          title="What we do (and don't do) with your data."
          intro="A plain-English summary of what DataLens collects, what it doesn't, and how your credentials are stored. If something here is unclear, open an issue on GitHub."
          updatedOn="May 13, 2026"
          sections={SECTIONS}
        />
      </main>
      <LandingFooter />
    </div>
  );
}
