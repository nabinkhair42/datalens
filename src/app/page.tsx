import { ArrowRightIcon, GitBranchIcon, LayersIcon, TerminalSquareIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataLensLogo } from '@/icons/datalens-logo';

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
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <DataLensLogo className="size-6" />
            <span className="font-semibold">DataLens</span>
          </div>
          <Button>
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
            <Button size="lg">
              <Link href="/login" className="flex items-center gap-2">
                Get Started Free
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link href="https://github.com/nabinkhair42/db-viewer" target="_blank">
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid w-full max-w-4xl sm:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border bg-muted p-1">
              <div className="flex h-full flex-col items-start rounded-lg bg-background p-6 space-y-4">
                <div className="bg-muted p-2 h-8 w-8 aspect-square flex items-center justify-center rounded border">
                  <feature.icon className="size-5 text-primary" />
                </div>
                <h3 className="mb-1 font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
