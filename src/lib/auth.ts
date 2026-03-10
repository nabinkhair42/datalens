import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@/db';
import * as schema from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  socialProviders: {
    github: {
      clientId: process.env['GITHUB_CLIENT_ID'] ?? '',
      clientSecret: process.env['GITHUB_CLIENT_SECRET'] ?? '',
    },
    google: {
      clientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day

    // Cookie cache: session data stored in a signed cookie so useSession()
    // reads locally instead of hitting the DB/API. This eliminates the 5s
    // session fetch on every page load. The cookie is re-validated after maxAge.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — re-validate with DB every 5 min
    },
  },
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute window
    max: 30, // max 30 requests per window per IP
  },
  advanced: {
    // Use secure (HTTPS-only) cookies in production
    useSecureCookies: process.env['NODE_ENV'] === 'production',
  },
  trustedOrigins: [process.env['BETTER_AUTH_URL'] ?? 'http://localhost:4000'],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
