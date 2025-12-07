'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, ExternalLink } from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';

export default function CommitsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch commits
  const { data: commitsResponse, isLoading } = useQuery({
    queryKey: ['commits', search, page],
    queryFn: () =>
      apiClient.getCommits({
        search,
        page,
        limit: 20,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commits</h1>
        <p className="text-muted-foreground">
          View all tracked commits from your repositories
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search commits..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Commits Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading commits...
            </div>
          ) : !commitsResponse?.data || commitsResponse.data.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                No commits found. Add repositories to start tracking commits!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>SHA</TableHead>
                  <TableHead className="text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commitsResponse.data.map((commit) => (
                  <TableRow key={commit.id}>
                    <TableCell className="max-w-md">
                      <p className="font-medium line-clamp-2">
                        {commit.message.split('\n')[0]}
                      </p>
                      {commit.message.split('\n').length > 1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {commit.message.split('\n')[1].substring(0, 60)}...
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {commit.author_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {commit.author_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <p>{formatRelativeTime(commit.commit_date)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(commit.commit_date)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-xs">
                        {commit.sha.substring(0, 7)}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={commit.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {commitsResponse?.pagination &&
        commitsResponse.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {commitsResponse.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === commitsResponse.pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
    </div>
  );
}
