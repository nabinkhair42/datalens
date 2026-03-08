'use client';

import { use } from 'react';

import { WorkspaceHeader } from '@/components/layout/workspace-header';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ connectionId: string }>;
}

export default function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { connectionId } = use(params);

  return (
    <div className="flex h-screen flex-col">
      <WorkspaceHeader connectionId={connectionId} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
