import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

type Props = {
  children: React.ReactNode;
};

const items = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/admin', label: 'Overview', icon: '📋' },
  { href: '/admin/problems', label: 'Problems', icon: '📝' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
];

export default function AdminLayout({ children }: Props) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto">
          <div className="p-6">
            {/* Brand */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold text-card-foreground">
                  Admin Panel
                </h1>
              </div>
              <ThemeToggle />
            </div>

            {/* Navigation */}
            <nav className="space-y-6">
              <div>
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Management
                </h3>
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive =
                      item.href === '/admin'
                        ? router.pathname === '/admin'
                        : router.pathname.startsWith(item.href);

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
                        <span className="text-lg">{item.icon}</span>
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
