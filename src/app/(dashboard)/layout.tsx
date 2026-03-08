import { ProtectedContent } from '@/components/providers/auth-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedContent>{children}</ProtectedContent>;
}
