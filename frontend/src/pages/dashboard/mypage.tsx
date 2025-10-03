import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  profile_image?: string;
  role: string;
  homepage?: string;
  linkedin?: string;
  github?: string;
  company?: string;
  job_title?: string;
  fav_language?: string;
  created_at: string;
}

const MyPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data as {
        success: boolean;
        user: UserInfo;
      };
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-8">
          <div className="flex items-center justify-center">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="py-8">
          <div className="flex items-center justify-center">
            <div className="text-lg text-red-600">
              Failed to load user information
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const user = data?.user;

  return (
    <DashboardLayout>
      <div className="py-2">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Page</h1>
          <p className="text-muted-foreground">
            Manage your profile and account settings
          </p>
        </div>

        <div className="max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center">
                  {user?.profile_image ? (
                    <Image
                      src={user.profile_image}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="text-2xl font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user?.name}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Profile Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Company
                      </label>
                      <p className="mt-1 text-sm">
                        {user?.company || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Job Title
                      </label>
                      <p className="mt-1 text-sm">
                        {user?.job_title || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Favorite Language
                      </label>
                      <p className="mt-1 text-sm">
                        {user?.fav_language || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Social Links</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Homepage
                      </label>
                      <p className="mt-1 text-sm">
                        {user?.homepage ? (
                          <a
                            href={user.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {user.homepage}
                          </a>
                        ) : (
                          'Not specified'
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        LinkedIn
                      </label>
                      <p className="mt-1 text-sm">
                        {user?.linkedin ? (
                          <a
                            href={user.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {user.linkedin}
                          </a>
                        ) : (
                          'Not specified'
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        GitHub
                      </label>
                      <p className="mt-1 text-sm">
                        {user?.github ? (
                          <a
                            href={user.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {user.github}
                          </a>
                        ) : (
                          'Not specified'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Account Information
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Member since{' '}
                      {new Date(user?.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    Edit Profile
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyPage;
