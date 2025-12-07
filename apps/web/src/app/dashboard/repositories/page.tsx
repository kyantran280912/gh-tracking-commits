'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Edit, Search, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function RepositoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRepoString, setNewRepoString] = useState('');
  const [error, setError] = useState('');

  // Fetch repositories
  const { data: reposResponse, isLoading } = useQuery({
    queryKey: ['repositories', search],
    queryFn: () => apiClient.getRepositories({ search }),
  });

  // Create repository mutation
  const createMutation = useMutation({
    mutationFn: (repoString: string) =>
      apiClient.createRepository({ repoString }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      setShowAddDialog(false);
      setNewRepoString('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to add repository');
    },
  });

  // Delete repository mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteRepository(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });

  // Test notifications mutation
  const testNotificationsMutation = useMutation({
    mutationFn: () => apiClient.testRepositoryNotifications(),
    onSuccess: (response) => {
      const data = response.data;
      if (data) {
        toast({
          title: 'Test completed!',
          description: `Processed ${data.reposProcessed} repositories and sent ${data.messagesSent} messages.`,
          variant: data.errors.length > 0 ? 'destructive' : 'default',
        });

        if (data.errors.length > 0) {
          console.error('Test errors:', data.errors);
        }
      }
    },
    onError: (err: any) => {
      toast({
        title: 'Test failed',
        description: err.message || 'Failed to send test notifications',
        variant: 'destructive',
      });
    },
  });

  // Send commits demo mutation
  const sendCommitsMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/repositories/${id}/send-commits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to send commits' }));
        throw new Error(error.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Commits sent!',
        description: data.message || `Successfully sent commits to Telegram`,
        variant: 'default',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to send commits',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleAddRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoString.trim()) {
      setError('Repository string is required');
      return;
    }
    createMutation.mutate(newRepoString.trim());
  };

  const handleDeleteRepo = (id: number, repoString: string) => {
    if (
      confirm(`Are you sure you want to stop tracking "${repoString}"?`)
    ) {
      deleteMutation.mutate(id);
    }
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
            onClick={() => testNotificationsMutation.mutate()}
            disabled={testNotificationsMutation.isPending || !reposResponse?.data || reposResponse.data.length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            {testNotificationsMutation.isPending ? 'Sending...' : 'Test Notifications'}
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Repository
          </Button>
        </div>
      </div>

      {/* Add Repository Dialog */}
      {showAddDialog && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Repository</CardTitle>
            <CardDescription>
              Enter the repository in format: owner/repo or owner/repo:branch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRepo} className="space-y-4">
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
                  value={newRepoString}
                  onChange={(e) => setNewRepoString(e.target.value)}
                  disabled={createMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Examples: facebook/react, vercel/next.js:canary
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Repository'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewRepoString('');
                    setError('');
                  }}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
                  <TableHead>Last Check</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reposResponse.data.map((repo) => (
                  <TableRow key={repo.id}>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {repo.last_check_time
                        ? formatDate(repo.last_check_time)
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(repo.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendCommitsMutation.mutate(repo.id)}
                          disabled={sendCommitsMutation.isPending}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {sendCommitsMutation.isPending ? 'Sending...' : 'Send Commits'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteRepo(repo.id, repo.repo_string)
                          }
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {reposResponse?.pagination && reposResponse.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" disabled={reposResponse.pagination.page === 1}>
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
