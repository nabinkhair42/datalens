'use client';

import { DatabaseIcon, RefreshCwIcon, ServerCrashIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function WorkspaceError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Workspace error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <ServerCrashIcon className="size-12 text-destructive" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight">Workspace Error</h1>

        <p className="mb-6 text-muted-foreground">
          Failed to load the workspace. There might be an issue with your database connections.
        </p>

        {error.digest && (
          <p className="mb-6 font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>
        )}

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} size="lg" className="gap-2">
            <RefreshCwIcon />
            Try again
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <Link href="/workspace">
              <DatabaseIcon />
              All connections
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
