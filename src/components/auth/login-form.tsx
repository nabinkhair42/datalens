'use client';

import { Database, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { memo, useCallback, useState } from 'react';

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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-medium">
          <Database className="size-6" />
          <span>DataLens</span>
        </div>

        <blockquote className="space-y-2">
          <p className="text-lg opacity-80">
            &ldquo;DataLens has transformed how our team explores and visualizes database schemas.
            The intuitive interface saves us hours of work every week.&rdquo;
          </p>
          <footer className="text-sm opacity-60">— Alex Chen, Engineering Lead</footer>
        </blockquote>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex flex-col bg-background">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <div className="flex items-center gap-2 text-lg font-medium">
            <Database className="size-5" />
            <span>DataLens</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in to DataLens</h1>
              <p className="text-sm text-muted-foreground">Connect your account to get started</p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={handleGitHubSignIn}
                disabled={isLoading !== null}
              >
                {isLoading === 'github' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <GitHubIcon />
                    Continue with GitHub
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-10"
                onClick={handleGoogleSignIn}
                disabled={isLoading !== null}
              >
                {isLoading === 'google' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <GoogleIcon />
                    Continue with Google
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              By clicking continue, you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
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
