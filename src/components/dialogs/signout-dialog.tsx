'use client';

import { memo } from 'react';

import { ConfirmDialog } from './confirm-dialog';

interface SignoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const SignoutDialog = memo(function SignoutDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: SignoutDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out"
      description="Are you sure you want to sign out? You will need to sign in again to access your workspace."
      confirmLabel="Yes, Sign out"
      cancelLabel="No, Close dialog"
      variant="destructive"
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  );
});
