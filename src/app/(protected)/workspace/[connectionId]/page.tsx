import { redirect } from 'next/navigation';

interface WorkspacePageProps {
  params: Promise<{ connectionId: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { connectionId } = await params;
  redirect(`/workspace/${connectionId}/tables`);
}
