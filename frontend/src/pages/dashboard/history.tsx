import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const HistoryPage = () => {
  return (
    <DashboardLayout>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Game History
          </h1>
          <p className="text-muted-foreground">
            View your past coding competitions and results
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              No Games Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Start your first race to see your competition history here
            </p>
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Start Racing
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HistoryPage;
