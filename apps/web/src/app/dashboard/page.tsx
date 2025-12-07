'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GitBranch, GitCommit, Clock, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiClient.getStats(),
  });

  const stats = statsResponse?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your GitHub commit tracking
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Repositories
            </CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRepos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Repositories being tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
            <GitCommit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCommits || 0}</div>
            <p className="text-xs text-muted-foreground">
              All commits notified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.commitsLast24h || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Commits in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.commitsLast7d || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Commits in last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Authors</CardTitle>
            <CardDescription>
              Most active commit authors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topAuthors && stats.topAuthors.length > 0 ? (
              <div className="space-y-4">
                {stats.topAuthors.slice(0, 5).map((author, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{author.author_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {author.author_email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{author.commit_count}</p>
                      <p className="text-xs text-muted-foreground">commits</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No authors yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Repositories</CardTitle>
            <CardDescription>
              Most active repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.commitsByRepo && stats.commitsByRepo.length > 0 ? (
              <div className="space-y-4">
                {stats.commitsByRepo.slice(0, 5).map((repo, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{repo.repo_string}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{repo.commit_count}</p>
                      <p className="text-xs text-muted-foreground">commits</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No repositories yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
