'use client';

import { createContext, use, useCallback, useContext, useState } from 'react';

import { WorkspaceHeader } from '@/components/layout/workspace-header';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ connectionId: string }>;
}

export default function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { connectionId } = use(params);
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <SidebarContext value={{ isOpen, toggle, close }}>
      <div className="flex h-screen flex-col">
        <WorkspaceHeader connectionId={connectionId} onToggleSidebar={toggle} />
        <main className="relative flex-1 overflow-hidden">{children}</main>
      </div>
    </SidebarContext>
  );
}
