'use client';

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env['BETTER_AUTH_URL'] ?? 'http://localhost:4000',
});

export const { signIn, signOut, useSession } = authClient;

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
