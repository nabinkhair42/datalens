'use client';

import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Root error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircleIcon className="size-12 text-destructive" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight">Something went wrong</h1>

        <p className="mb-6 text-muted-foreground">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>

        {error.digest && (
          <p className="mb-6 font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>
        )}

        <Button onClick={reset} size="lg" className="gap-2">
          <RefreshCwIcon />
          Try again
        </Button>
      </div>
    </div>
  );
}
