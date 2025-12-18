import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

export interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accentColor?: 'blue' | 'purple' | 'green' | 'orange' | 'red';
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
  accentColor = 'blue',
  stats,
}) => {
  // Radix UI color mappings
  const colorClasses = {
    blue: {
      iconBg: 'bg-[var(--blue-3)] hover:bg-[var(--blue-4)]',
      iconColor: 'text-[var(--blue-11)]',
      hoverBorder: 'group-hover:border-[var(--blue-7)]',
      hoverText: 'group-hover:text-[var(--blue-11)]',
      accentGradient: 'from-[var(--blue-9)] to-[var(--blue-10)]',
      actionText: 'text-[var(--blue-11)]',
    },
    purple: {
      iconBg: 'bg-[var(--purple-3)] hover:bg-[var(--purple-4)]',
      iconColor: 'text-[var(--purple-11)]',
      hoverBorder: 'group-hover:border-[var(--purple-7)]',
      hoverText: 'group-hover:text-[var(--purple-11)]',
      accentGradient: 'from-[var(--purple-9)] to-[var(--purple-10)]',
      actionText: 'text-[var(--purple-11)]',
    },
    green: {
      iconBg: 'bg-[var(--green-3)] hover:bg-[var(--green-4)]',
      iconColor: 'text-[var(--green-11)]',
      hoverBorder: 'group-hover:border-[var(--green-7)]',
      hoverText: 'group-hover:text-[var(--green-11)]',
      accentGradient: 'from-[var(--green-9)] to-[var(--green-10)]',
      actionText: 'text-[var(--green-11)]',
    },
    orange: {
      iconBg: 'bg-[var(--orange-3)] hover:bg-[var(--orange-4)]',
      iconColor: 'text-[var(--orange-11)]',
      hoverBorder: 'group-hover:border-[var(--orange-7)]',
      hoverText: 'group-hover:text-[var(--orange-11)]',
      accentGradient: 'from-[var(--orange-9)] to-[var(--orange-10)]',
      actionText: 'text-[var(--orange-11)]',
    },
    red: {
      iconBg: 'bg-[var(--red-3)] hover:bg-[var(--red-4)]',
      iconColor: 'text-[var(--red-11)]',
      hoverBorder: 'group-hover:border-[var(--red-7)]',
      hoverText: 'group-hover:text-[var(--red-11)]',
      accentGradient: 'from-[var(--red-9)] to-[var(--red-10)]',
      actionText: 'text-[var(--red-11)]',
    },
  };

  const colors = colorClasses[accentColor];

  return (
    <Link href={href} className="block group h-full">
      <div className={`relative h-full bg-[var(--color-panel)] rounded-xl border border-[var(--gray-6)] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${colors.hoverBorder}`}>
        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.accentGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

        <div className="relative p-6 flex flex-col h-full">
          {/* Icon and Title Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg ${colors.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300`}
              >
                <Icon className={`w-6 h-6 ${colors.iconColor}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold text-[var(--gray-12)] ${colors.hoverText} transition-colors`}>
                  {title}
                </h3>
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg
                className={`w-5 h-5 ${colors.actionText} transform group-hover:translate-x-1 transition-transform duration-300`}
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
          <p className="text-sm text-[var(--gray-11)] mb-4 flex-grow">
            {description}
          </p>

          {/* Stats Section (optional) */}
          {stats && (
            <div className="mt-auto pt-4 border-t border-[var(--gray-6)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--gray-11)] uppercase tracking-wider">
                  {stats.label}
                </span>
                <span className="text-lg font-bold text-[var(--gray-12)]">
                  {stats.value}
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4 pt-4 border-t border-[var(--gray-6)]">
            <div className={`flex items-center ${colors.actionText} font-medium text-sm group-hover:translate-x-1 transition-transform duration-300`}>
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
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.accentGradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
      </div>
    </Link>
  );
};
