import React, { ReactNode } from 'react';
import { User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Header from './Header';

type Props = {
  children: ReactNode;
};

// const items = [
//   { href: '/dashboard', label: 'Race Hub', icon: <Zap className="w-5 h-5" /> },
//   {
//     href: '/dashboard/history',
//     label: 'History',
//     icon: <Clock className="w-5 h-5" />,
//   },
//   {
//     href: '/dashboard/leaderboard',
//     label: 'Leaderboard',
//     icon: <Trophy className="w-5 h-5" />,
//   },
//   {
//     href: '/dashboard/profile',
//     label: 'Profile',
//     icon: <User className="w-5 h-5" />,
//   },
// ];

export default function DashboardLayout({ children }: Props) {
  // const router = useRouter();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border h-[calc(100vh-60px)] sticky top-0 overflow-y-auto">
          <div className="p-6">
            {/* User Info */}
            {user && (
              <div className="mb-6 p-3 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-accent-foreground">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.role === 'admin' ? 'Admin' : 'Player'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            {/* <nav className="space-y-6">
              <div>
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Navigation
                </h3>
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
            </nav> */}
            <div className="space-y-6">WIP</div>
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
