'use client';

import { memo } from 'react';

import { ConfirmDialog } from './confirm-dialog';

interface DropTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: string;
  table: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export const DropTableDialog = memo(function DropTableDialog({
  open,
  onOpenChange,
  schema,
  table,
  onConfirm,
  isLoading = false,
}: DropTableDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Drop table "${table}"?`}
      description={`This will permanently delete the table "${schema}"."${table}" and all its data. This action cannot be undone.`}
      confirmLabel="Yes, Drop table"
      cancelLabel="No, Cancel"
      variant="destructive"
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  );
});
