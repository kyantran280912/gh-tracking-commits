'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Send } from 'lucide-react';
import { useRepositoryMutations } from '@/hooks/useRepositoryMutations';
import {
  AddRepositoryDialog,
  RepositoryTableRow,
} from '@/components/repositories';

export default function RepositoriesPage() {
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [createError, setCreateError] = useState('');

  // Fetch repositories
  const { data: reposResponse, isLoading } = useQuery({
    queryKey: ['repositories', search],
    queryFn: () => apiClient.getRepositories({ search }),
  });

  // All mutations in a single hook
  const mutations = useRepositoryMutations({
    search,
    onCreateSuccess: () => {
      setShowAddDialog(false);
      setCreateError('');
    },
  });

  const handleCreate = (repoString: string) => {
    setCreateError('');
    mutations.createMutation.mutate(repoString, {
      onError: (err: Error) => {
        setCreateError(err.message || 'Failed to add repository');
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">
            Manage GitHub repositories to track
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => mutations.testNotificationsMutation.mutate()}
            disabled={
              mutations.testNotificationsMutation.isPending ||
              !reposResponse?.data ||
              reposResponse.data.length === 0
            }
          >
            <Send className="mr-2 h-4 w-4" />
            {mutations.testNotificationsMutation.isPending
              ? 'Sending...'
              : 'Test Notifications'}
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Repository
          </Button>
        </div>
      </div>

      {/* Add Repository Dialog */}
      <AddRepositoryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleCreate}
        isPending={mutations.createMutation.isPending}
        error={createError}
      />

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Repositories Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading repositories...
            </div>
          ) : !reposResponse?.data || reposResponse.data.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No repositories found. Add one to get started!
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Repository
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Last Check</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reposResponse.data.map((repo) => (
                  <RepositoryTableRow
                    key={repo.id}
                    repo={repo}
                    onDelete={mutations.handleDelete}
                    onUpdateInterval={(id, interval) =>
                      mutations.updateIntervalMutation.mutate({ id, interval })
                    }
                    onSendCommits={(id) =>
                      mutations.sendCommitsMutation.mutate(id)
                    }
                    isUpdatingInterval={mutations.updateIntervalMutation.isPending}
                    isSendingCommits={mutations.sendCommitsMutation.isPending}
                    isDeleting={mutations.deleteMutation.isPending}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {reposResponse?.pagination && reposResponse.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={reposResponse.pagination.page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {reposResponse.pagination.page} of{' '}
            {reposResponse.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={
              reposResponse.pagination.page ===
              reposResponse.pagination.totalPages
            }
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
