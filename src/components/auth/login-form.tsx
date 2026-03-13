'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { memo, useCallback, useState } from 'react';

import { AuthDivider } from '@/components/auth/auth-divider';
import { DecorIcon } from '@/components/auth/decor-icon';
import { DataLensLogo } from '@/components/icons/datalens-logo';
import { Button } from '@/components/ui/button';
import { GitHubIcon, GoogleIcon } from '@/icons';
import { signInWithGitHub, signInWithGoogle } from '@/lib/auth-client';

export const LoginForm = memo(function LoginForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/workspace';

  const [isLoading, setIsLoading] = useState<'github' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGitHubSignIn = useCallback(async () => {
    setIsLoading('github');
    setError(null);
    try {
      await signInWithGitHub(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with GitHub');
      setIsLoading(null);
    }
  }, [callbackUrl]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading('google');
    setError(null);
    try {
      await signInWithGoogle(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsLoading(null);
    }
  }, [callbackUrl]);

  return (
    <div className="flex flex-col bg-background">
      {/* Mobile header */}
      <div className="flex items-center justify-between p-6 lg:hidden">
        <div className="flex items-center gap-2 text-lg font-medium">
          <DataLensLogo className="size-5" />
          <span>DataLens</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 md:px-8">
        <div className="relative flex w-full max-w-sm flex-col p-8 md:p-10 dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)]">
          {/* Border lines */}
          <div className="absolute -inset-y-8 -left-px w-px bg-border" />
          <div className="absolute -inset-y-8 -right-px w-px bg-border" />
          <div className="absolute -inset-x-8 -top-px h-px bg-border" />
          <div className="absolute -inset-x-8 -bottom-px h-px bg-border" />
          <DecorIcon position="top-left" />
          <DecorIcon position="bottom-right" />

          <div className="w-full max-w-sm space-y-10">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-base text-muted-foreground">
                Sign in to your DataLens account to continue
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <Button
                variant="outline"
                size="lg"
                className="h-11 w-full text-sm"
                onClick={handleGitHubSignIn}
                disabled={isLoading !== null}
              >
                {isLoading === 'github' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GitHubIcon data-icon="inline-start" />
                )}
                Continue with GitHub
              </Button>

              <AuthDivider>or</AuthDivider>

              <Button
                variant="outline"
                size="lg"
                className="h-11 w-full text-sm"
                onClick={handleGoogleSignIn}
                disabled={isLoading !== null}
              >
                {isLoading === 'google' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GoogleIcon data-icon="inline-start" />
                )}
                Continue with Google
              </Button>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              By clicking continue, you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
