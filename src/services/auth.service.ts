// Auth service is now minimal since Better Auth client handles most operations.
// This file exists for any custom auth-related API calls if needed.

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
  user: AuthUser;
}

// Better Auth handles auth via its client.
// See @/lib/auth-client for signIn.social, signOut, useSession.
