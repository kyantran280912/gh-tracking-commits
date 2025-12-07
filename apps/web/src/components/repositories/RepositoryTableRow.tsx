'use client';

import type { DbRepository } from '@repo/shared';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Trash2, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface RepositoryTableRowProps {
  repo: DbRepository;
  onDelete: (id: number, repoString: string) => void;
  onUpdateInterval: (id: number, interval: number) => void;
  onSendCommits: (id: number) => void;
  isUpdatingInterval: boolean;
  isSendingCommits: boolean;
  isDeleting: boolean;
}

export function RepositoryTableRow({
  repo,
  onDelete,
  onUpdateInterval,
  onSendCommits,
  isUpdatingInterval,
  isSendingCommits,
  isDeleting,
}: RepositoryTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <a
          href={`https://github.com/${repo.owner}/${repo.repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {repo.owner}/{repo.repo}
        </a>
      </TableCell>
      <TableCell>
        <code className="px-2 py-1 bg-muted rounded text-xs">
          {repo.branch || 'default'}
        </code>
      </TableCell>
      <TableCell>
        <select
          value={repo.notification_interval || 3}
          onChange={(e) => onUpdateInterval(repo.id, parseInt(e.target.value))}
          disabled={isUpdatingInterval}
          className="px-2 py-1 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value={1}>1h</option>
          <option value={2}>2h</option>
          <option value={3}>3h</option>
          <option value={6}>6h</option>
          <option value={12}>12h</option>
          <option value={24}>24h</option>
        </select>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {repo.last_check_time ? formatDate(repo.last_check_time) : 'Never'}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(repo.created_at)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendCommits(repo.id)}
            disabled={isSendingCommits}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSendingCommits ? 'Sending...' : 'Send Commits'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(repo.id, repo.repo_string)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
