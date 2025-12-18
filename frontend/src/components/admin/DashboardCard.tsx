import Link from 'next/link';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  stats?: {
    label: string;
    value: string | number;
  };
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  href,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-50',
  stats,
}) => {
  return (
    <Link href={href} className="block group h-full">
      <div className="relative h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:border-blue-500 dark:group-hover:border-blue-400">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative p-6 flex flex-col h-full">
          {/* Icon and Title Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg ${iconBgColor} dark:bg-opacity-20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {title}
                </h3>
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 transform group-hover:translate-x-1 transition-transform duration-300"
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

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
            {description}
          </p>

          {/* Stats Section (optional) */}
          {stats && (
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {stats.label}
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats.value}
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
              <span>Manage</span>
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>
    </Link>
  );
};
