import { FileText, Users } from 'lucide-react';
import { DashboardCard, DashboardCardProps } from '@/components/admin/DashboardCard';

export default function AdminPage() {
  const adminFeatures: DashboardCardProps[] = [
    {
      title: 'Problem Management',
      description: 'Add new coding problems and edit/delete existing ones.',
      href: '/admin/problems',
      icon: FileText,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'User Management',
      description: 'Manage user permissions and monitor accounts.',
      href: '/admin/users',
      icon: Users,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your platform's problems and users
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature) => (
          <DashboardCard key={feature.href} {...feature} />
        ))}
      </div>
    </div>
  );
}
