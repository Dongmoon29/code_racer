import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

export const ConnectingCard: React.FC = () => (
  <div className="max-w-2xl mx-auto p-6">
    <Card className="bg-none">
      <CardContent className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-9)] mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">
          Connecting to matchmaking server...
        </h2>
        <p className="text-[var(--gray-11)]">Please wait a moment</p>
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
    <Card className="border-[var(--red-6)] bg-[var(--red-3)]">
      <CardContent className="p-8 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-[var(--red-11)] mb-4">
          Error occurred
        </h2>
        {message && (
          <p className="text-[var(--red-11)] mb-6">{message}</p>
        )}
        <div className="space-x-4">
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-md border border-[var(--gray-6)] hover:bg-[var(--gray-4)] transition-colors text-[var(--color-text)]"
          >
            Retry
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-md hover:bg-[var(--gray-4)] transition-colors text-[var(--color-text)]"
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
    <Card className="border-[var(--green-6)] bg-[var(--green-3)]">
      <CardContent className="p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-semibold text-[var(--green-11)] mb-2">
          Matching completed!
        </h2>
        <p className="text-[var(--green-11)]">
          Redirecting to game page...
        </p>
      </CardContent>
    </Card>
  </div>
);
