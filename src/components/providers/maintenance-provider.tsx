import type { ReactNode } from 'react';
import { LandingMaintenance } from '@/components/landing/landing-maintenance';

type MaintenanceProviderProps = {
  children: ReactNode;
};
const MAINTENANCE_MODE = true;
/**
 * Server-side gate that swaps the whole app for a maintenance page when
 * `MAINTENANCE_MODE=true` is set in the environment.
 *
 * Toggle locally: add `MAINTENANCE_MODE=true` to .env, restart `pnpm dev`.
 * Toggle on Vercel: set the env var in the project settings and redeploy
 * (or use `vercel env add MAINTENANCE_MODE production`).
 *
 * To customize the page, edit src/components/landing/landing-maintenance.tsx
 * or pass an ETA / message via the optional props below.
 */
export function MaintenanceProvider({ children }: MaintenanceProviderProps) {
  if (!MAINTENANCE_MODE) {
    return <>{children}</>;
  }

  const eta = process.env['MAINTENANCE_ETA'];
  const message = process.env['MAINTENANCE_MESSAGE'];

  return <LandingMaintenance {...(eta ? { eta } : {})} {...(message ? { message } : {})} />;
}
