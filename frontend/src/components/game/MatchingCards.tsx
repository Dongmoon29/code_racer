import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

export const ConnectingCard: React.FC = () => (
  <div className="max-w-2xl mx-auto p-6">
    <Card>
      <CardContent className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">
          Connecting to matchmaking server...
        </h2>
        <p className="text-muted-foreground">Please wait a moment</p>
      </CardContent>
    </Card>
  </div>
);

export const ErrorCard: React.FC<{
  message?: string;
  onRetry: () => void;
  onBack: () => void;
}> = ({ message, onRetry, onBack }) => (
  <div className="max-w-2xl mx-auto p-6">
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
      <CardContent className="p-8 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Error occurred
        </h2>
        {message && (
          <p className="text-red-600 dark:text-red-400 mb-6">{message}</p>
        )}
        <div className="space-x-4">
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-md border border-border hover:bg-accent"
          >
            Retry
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-md hover:bg-accent"
          >
            Back to Dashboard
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const FoundCard: React.FC = () => (
  <div className="max-w-2xl mx-auto p-6">
    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
      <CardContent className="p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
          Matching completed!
        </h2>
        <p className="text-green-600 dark:text-green-400">
          Redirecting to game page...
        </p>
      </CardContent>
    </Card>
  </div>
);
