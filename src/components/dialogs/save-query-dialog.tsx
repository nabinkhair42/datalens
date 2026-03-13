'use client';

import { memo, useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SaveQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onSave: (name: string, description: string | undefined) => Promise<void>;
  isSaving?: boolean;
}

export const SaveQueryDialog = memo(function SaveQueryDialog({
  open,
  onOpenChange,
  query,
  onSave,
  isSaving = false,
}: SaveQueryDialogProps) {
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (!queryName.trim()) {
      setSaveError('Query name is required');
      return;
    }

    setSaveError(null);

    try {
      await onSave(queryName.trim(), queryDescription.trim() || undefined);
      setQueryName('');
      setQueryDescription('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save query');
    }
  }, [queryName, queryDescription, onSave]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setQueryName('');
        setQueryDescription('');
        setSaveError(null);
      }
      onOpenChange(value);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Query</DialogTitle>
          <DialogDescription>Save this query for quick access later.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="query-name">Name</Label>
            <Input
              id="query-name"
              placeholder="My query"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="query-description">Description (optional)</Label>
            <Input
              id="query-description"
              placeholder="What does this query do?"
              value={queryDescription}
              onChange={(e) => setQueryDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Query Preview</Label>
            <div className="max-h-24 overflow-auto rounded-md bg-muted p-2 font-mono text-xs">
              {query}
            </div>
          </div>
          {saveError && <p className="text-sm text-destructive">{saveError}</p>}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave} disabled={isSaving || !queryName.trim()} hotKeys="Mod+S">
            {isSaving ? 'Saving...' : 'Save Query'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
