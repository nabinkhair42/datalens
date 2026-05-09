'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { memo, useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GitHubIcon, GoogleIcon } from '@/icons';
import { DataLensLogo } from '@/icons/datalens-logo';
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
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-center justify-center h-12 w-12 aspect-square rounded-md bg-primary/10">
          <DataLensLogo className="size-12 mx-auto mb-4" />
        </div>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your DataLens account to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex w-full gap-3 items-center justify-around">
          <Button variant="outline" onClick={handleGitHubSignIn} disabled={isLoading !== null}>
            {isLoading === 'github' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GitHubIcon data-icon="inline-start" />
            )}
            Continue with GitHub
          </Button>

          <Separator orientation="vertical" className="bg-foreground/20" />

          <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading !== null}>
            {isLoading === 'google' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GoogleIcon data-icon="inline-start" />
            )}
            Continue with Google
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <CardDescription className="text-xs leading-relaxed text-muted-foreground">
          By clicking continue, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </CardDescription>
      </CardFooter>
    </Card>
  );
});
