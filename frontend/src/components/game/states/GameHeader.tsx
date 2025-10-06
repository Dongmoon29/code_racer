import React, { FC, memo } from 'react';
import { Spinner } from '../../ui';
import LanguageSelector from '../LanguageSelector';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/alert';
import { SubmitResult } from '@/types';

interface GameHeaderProps {
  title: string;
  selectedLanguage: 'python' | 'javascript' | 'go';
  submitting: boolean;
  submitResult: SubmitResult | null;
  onLanguageChange: (language: 'python' | 'javascript' | 'go') => void;
  onSubmitCode: () => void;
}

export const GameHeader: FC<GameHeaderProps> = memo(
  ({
    title,
    selectedLanguage,
    submitting,
    submitResult,
    onLanguageChange,
    onSubmitCode,
  }) => {
    return (
      <>
        <div className="p-4 grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 md:col-span-8">
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onChange={onLanguageChange}
              />
            </div>
          </div>
          <div className="col-span-12 md:col-span-4 flex justify-end items-start">
            <Button
              onClick={onSubmitCode}
              disabled={submitting}
              className="w-full md:w-auto"
            >
              {submitting ? <Spinner size="sm" /> : 'Submit Solution'}
            </Button>
          </div>
        </div>

        {submitResult && (
          <Alert
            variant={submitResult.success ? 'success' : 'error'}
            className="px-4 mb-4"
          >
            {submitResult.message}
          </Alert>
        )}
      </>
    );
  }
);

GameHeader.displayName = 'GameHeader';
