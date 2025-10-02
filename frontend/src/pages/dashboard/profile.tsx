import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';

const ProfilePage = () => {
  const { user } = useAuthStore();

  return (
    <DashboardLayout>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account and preferences</div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Account Information</h3>
            <div className="space-y-4">
              {user ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                    <p className="text-muted-foreground">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                    <p className="text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Loading user information...</p>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Games Played</span>
                <span className="font-semibold text-foreground">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-semibold text-foreground">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average Time</span>
                <span className="font-semibold text-foreground">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Rating</span>
                <span className="font-semibold text-foreground">1200</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-card rounded-lg border border-border p-6">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Preferences</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">Dark Mode</div>
                <div className="text-sm text-muted-foreground">Use dark theme</div>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full p-1">
                <div className="w-4 h-4 bg-white rounded-full float-right"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Get notified about matches</div>
              </div>
              <div className="w-12 h-6 bg-muted rounded-full p-1">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
