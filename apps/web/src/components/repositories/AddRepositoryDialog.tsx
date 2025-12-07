'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AddRepositoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (repoString: string) => void;
  isPending: boolean;
  error?: string;
}

export function AddRepositoryDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  error: externalError,
}: AddRepositoryDialogProps) {
  const [repoString, setRepoString] = useState('');
  const [localError, setLocalError] = useState('');

  const error = externalError || localError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoString.trim()) {
      setLocalError('Repository string is required');
      return;
    }
    setLocalError('');
    onSubmit(repoString.trim());
  };

  const handleClose = () => {
    onOpenChange(false);
    setRepoString('');
    setLocalError('');
  };

  if (!open) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Repository</CardTitle>
        <CardDescription>
          Enter the repository in format: owner/repo or owner/repo:branch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="repoString">Repository</Label>
            <Input
              id="repoString"
              placeholder="facebook/react or vercel/next.js:canary"
              value={repoString}
              onChange={(e) => setRepoString(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Examples: facebook/react, vercel/next.js:canary
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Adding...' : 'Add Repository'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
