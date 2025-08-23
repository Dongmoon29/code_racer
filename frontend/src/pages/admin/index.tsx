import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import AdminNav from '../../components/admin/AdminNav';
import Link from 'next/link';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      // router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const adminFeatures = [
    {
      title: 'LeetCode Problem Management',
      description: 'Add new coding problems and edit/delete existing ones.',
      href: '/admin/leetcode',
      icon: '📝',
      color: 'bg-blue-500',
    },
    // Future admin features to be added
    // {
    //   title: 'User Management',
    //   description: 'Manage user permissions and monitor accounts.',
    //   href: '/admin/users',
    //   icon: '👥',
    //   color: 'bg-green-500'
    // },
    // {
    //   title: 'System Analytics',
    //   description: 'View application usage statistics and performance metrics.',
    //   href: '/admin/analytics',
    //   icon: '📊',
    //   color: 'bg-purple-500'
    // }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="block group"
            >
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl mr-4 ${feature.color} text-white`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                  <span className="text-sm font-medium">Manage</span>
                  <svg
                    className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* User Information */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Current Administrator Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <p className="text-lg text-gray-900">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="text-lg text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <span className="inline-flex px-2 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                {user.role}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Login
              </label>
              <p className="text-lg text-gray-900">
                {new Date().toLocaleDateString('en-US')}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              User Information
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>User ID: {user.id}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <Link
            href="/admin/leetcode/create"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add New LeetCode Problem
          </Link>
        </div>
      </div>
    </div>
  );
}
