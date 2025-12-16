import React, { FC, memo, useState } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ProblemDetailsTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export const ProblemDetailsTabs: FC<ProblemDetailsTabsProps> = memo(
  ({ tabs, activeTab, onTabChange, children }) => {
    return (
      <div className="flex flex-col h-full">
        {/* Tab Header */}
        <div className="flex border-b border-border bg-[hsl(var(--muted))] rounded-t-lg">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative cursor-pointer',
                  'border-r border-border last:border-r-0',
                  isActive
                    ? 'text-white bg-transparent'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-white hover:bg-[hsl(var(--muted))]/50'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4',
                    isActive ? 'text-blue-400' : 'text-[hsl(var(--muted-foreground))]'
                  )}
                />
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    );
  }
);

ProblemDetailsTabs.displayName = 'ProblemDetailsTabs';

