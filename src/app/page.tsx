import {
  ArrowRightIcon,
  DatabaseIcon,
  GitBranchIcon,
  LayersIcon,
  TerminalSquareIcon,
  ZapIcon,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: TerminalSquareIcon,
    title: 'SQL Editor',
    description: 'Syntax highlighting, autocomplete, and query execution',
  },
  {
    icon: LayersIcon,
    title: 'Schema Browser',
    description: 'Explore tables, columns, and relationships visually',
  },
  {
    icon: GitBranchIcon,
    title: 'Multi-Database',
    description: 'PostgreSQL, MySQL, SQLite, and more coming soon',
  },
  {
    icon: ZapIcon,
    title: 'Fast & Modern',
    description: 'Built with Next.js 16, React 19, and Turbopack',
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <DatabaseIcon className="size-5 text-primary" />
            <span className="font-semibold">DataLens</span>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Figma for your
            <span className="text-primary"> database</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            The web-native, collaborative database IDE. Query, visualize, and manage your databases
            with a modern interface that works anywhere.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/login" className="flex items-center gap-2">
                Get Started Free
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="https://github.com/nabinkhair42/db-viewer" target="_blank">
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid w-full max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-lg border bg-card p-4">
              <feature.icon className="mb-3 size-8 text-primary" />
              <h3 className="mb-1 font-medium">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <p>Built with Next.js, CodeMirror, and TanStack</p>
          <p>Open Source</p>
        </div>
      </footer>
    </div>
  );
}
