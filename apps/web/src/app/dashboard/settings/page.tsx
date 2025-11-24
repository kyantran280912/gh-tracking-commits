'use client';

import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Username</p>
            <p className="text-sm text-muted-foreground">{user?.username}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Role</p>
            <p className="text-sm text-muted-foreground capitalize">
              {user?.role}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Member Since</p>
            <p className="text-sm text-muted-foreground">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>More Settings Coming Soon</CardTitle>
          <CardDescription>
            Additional settings and configurations will be available in future updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Password change</li>
            <li>Notification preferences</li>
            <li>API tokens</li>
            <li>Webhook configurations</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
