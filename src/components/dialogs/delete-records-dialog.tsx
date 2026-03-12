'use client';

import { memo } from 'react';

import { ConfirmDialog } from '@/components/dialogs';

interface DeleteRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export const DeleteRecordsDialog = memo(function DeleteRecordsDialog({
  open,
  onOpenChange,
  count,
  isLoading,
  onConfirm,
}: DeleteRecordsDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Records"
      description={`Are you sure you want to delete ${count} record${count !== 1 ? 's' : ''}? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  );
});
