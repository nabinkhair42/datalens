'use client';

import { AlertCircleIcon, HomeIcon, RefreshCwIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircleIcon className="size-12 text-destructive" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight">Dashboard Error</h1>

        <p className="mb-6 text-muted-foreground">
          We encountered an error loading the dashboard. This might be a temporary issue.
        </p>

        {error.digest && (
          <p className="mb-6 font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>
        )}

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} size="lg" className="gap-2">
            <RefreshCwIcon className="size-4" />
            Try again
          </Button>
          <Button variant="outline" size="lg" asChild className="gap-2">
            <Link href="/">
              <HomeIcon className="size-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
