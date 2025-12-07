'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface UseRepositoryMutationsOptions {
  search: string;
  onCreateSuccess?: () => void;
}

export function useRepositoryMutations({
  search,
  onCreateSuccess,
}: UseRepositoryMutationsOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create repository mutation
  const createMutation = useMutation({
    mutationFn: (repoString: string) =>
      apiClient.createRepository({ repoString }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      onCreateSuccess?.();
    },
  });

  // Delete repository mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteRepository(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      toast({
        title: 'Repository deleted',
        description: 'Repository has been removed from tracking',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to delete',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
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
    onError: (err: Error) => {
      toast({
        title: 'Test failed',
        description: err.message || 'Failed to send test notifications',
        variant: 'destructive',
      });
    },
  });

  // Send commits mutation
  const sendCommitsMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/repositories/${id}/send-commits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
      });
      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ error: 'Failed to send commits' }));
        throw new Error(error.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Commits sent!',
        description: data.message || 'Successfully sent commits to Telegram',
        variant: 'default',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to send commits',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Update notification interval mutation with optimistic update
  const updateIntervalMutation = useMutation({
    mutationFn: ({ id, interval }: { id: number; interval: number }) =>
      apiClient.updateRepository(id, { notification_interval: interval }),
    onMutate: async ({ id, interval }) => {
      await queryClient.cancelQueries({ queryKey: ['repositories'] });

      const previousRepos = queryClient.getQueryData(['repositories', search]);

      queryClient.setQueryData(['repositories', search], (old: any) => ({
        ...old,
        data: old?.data?.map((repo: any) =>
          repo.id === id ? { ...repo, notification_interval: interval } : repo
        ),
      }));

      return { previousRepos };
    },
    onError: (err: Error, _variables, context) => {
      queryClient.setQueryData(
        ['repositories', search],
        context?.previousRepos
      );
      toast({
        title: 'Failed to update interval',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Interval updated',
        description: 'Notification interval has been updated successfully',
      });
    },
  });

  // Handler for delete with confirmation
  const handleDelete = (id: number, repoString: string) => {
    if (confirm(`Are you sure you want to stop tracking "${repoString}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return {
    createMutation,
    deleteMutation,
    testNotificationsMutation,
    sendCommitsMutation,
    updateIntervalMutation,
    handleDelete,
  };
}
