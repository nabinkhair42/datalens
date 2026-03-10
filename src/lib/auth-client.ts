'use client';

import { createAuthClient } from 'better-auth/react';

// BETTER_AUTH_URL is a server-only env var (no NEXT_PUBLIC_ prefix).
// Use NEXT_PUBLIC_APP_URL for the client, or default to current origin
// which works because the auth API is at /api/auth/* on the same app.
export const authClient = createAuthClient({
  baseURL: process.env['NEXT_PUBLIC_APP_URL'] ?? '',
});

export const { signIn, signOut, useSession, getSession } = authClient;

// Social sign-in helpers
export async function signInWithGitHub(callbackURL = '/') {
  return signIn.social({
    provider: 'github',
    callbackURL,
  });
}

export async function signInWithGoogle(callbackURL = '/') {
  return signIn.social({
    provider: 'google',
    callbackURL,
  });
}
