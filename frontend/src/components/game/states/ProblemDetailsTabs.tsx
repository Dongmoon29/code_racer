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
      <div className="flex flex-col flex-1 min-h-0">
        {/* Tab Header */}
        <div className="flex border-b border-[var(--gray-6)] bg-[var(--gray-3)] shrink-0">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative cursor-pointer',
                  'border-r border-[var(--gray-6)] last:border-r-0',
                  isActive
                    ? 'text-[var(--color-text)] bg-transparent'
                    : 'text-[var(--gray-11)] hover:text-[var(--color-text)] hover:bg-[var(--gray-4)]'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4',
                    isActive ? 'text-[var(--accent-9)]' : 'text-[var(--gray-11)]'
                  )}
                />
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-9)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="h-[calc(100vh-12rem)] overflow-y-auto">{children}</div>
      </div>
    );
  }
);

ProblemDetailsTabs.displayName = 'ProblemDetailsTabs';

