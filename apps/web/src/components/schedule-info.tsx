'use client';

import { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import {
  getNextSyncTime,
  getLastSyncTime,
  formatTimeUntil,
  formatTimeAgo,
} from '@/lib/schedule';

export function ScheduleInfo() {
  const [lastSync, setLastSync] = useState<string>('');
  const [nextSync, setNextSync] = useState<string>('');

  useEffect(() => {
    // Update schedule times
    const updateTimes = () => {
      setLastSync(formatTimeAgo(getLastSyncTime()));
      setNextSync(formatTimeUntil(getNextSyncTime()));
    };

    // Initial update
    updateTimes();

    // Update every minute
    const interval = setInterval(updateTimes, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render until client-side hydration is complete
  if (!lastSync || !nextSync) {
    return (
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
          <RefreshCw className="h-4 w-4" />
          <span>Sync Schedule</span>
        </div>
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
        <RefreshCw className="h-4 w-4" />
        <span>Sync Schedule</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Last:</span>
          <span className="font-medium">{lastSync}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-green-500" />
          <span className="text-muted-foreground">Next:</span>
          <span className="font-medium text-green-600 dark:text-green-400">
            {nextSync}
          </span>
        </div>
      </div>
    </div>
  );
}
