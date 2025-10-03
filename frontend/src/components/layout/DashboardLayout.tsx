import React, { ReactNode } from 'react';
import { Car, Trophy, User } from 'lucide-react';
import Header from './Header';
import Link from 'next/link';
import { useRouter } from 'next/router';

type Props = {
  children: ReactNode;
};

const items = [
  {
    href: '/dashboard/mypage',
    label: 'My Page',
    icon: <User className="w-5 h-5" />,
  },
  {
    href: '/dashboard/leaderboard',
    label: 'Leaderboard',
    icon: <Trophy className="w-5 h-5" />,
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <Car className="w-5 h-5" />,
  },
];

export default function DashboardLayout({ children }: Props) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border h-[calc(100vh-60px)] sticky top-0 overflow-y-auto">
          <div className="p-6">
            {/* Navigation */}
            <nav className="space-y-6">
              <div>
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive = router.pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                          ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }
                        `}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
