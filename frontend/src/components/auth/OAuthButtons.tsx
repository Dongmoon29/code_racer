import React, { FC } from 'react';
import { Button } from '../ui/Button';
import { GoogleIcon, GitHubIcon } from '../ui/icons';

interface OAuthButtonsProps {
  disabled?: boolean;
}

export const OAuthButtons: FC<OAuthButtonsProps> = ({ disabled = false }) => {
  const handleOAuthLogin = (provider: 'google' | 'github') => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}`;
  };

  return (
    <>
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[hsl(var(--border))]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] rounded-2xl">
            Or continue with
          </span>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-12 flex items-center justify-center gap-3 bg-gray-300 mb-4 rounded-full"
          onClick={() => handleOAuthLogin('google')}
          disabled={disabled}
          aria-label="Continue with Google"
        >
          <GoogleIcon aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-12 w-12 flex items-center justify-center gap-3 bg-gray-300 mb-4 rounded-full text-gray-800 dark:text-white"
          onClick={() => handleOAuthLogin('github')}
          disabled={disabled}
          aria-label="Continue with GitHub"
        >
          <GitHubIcon aria-hidden="true" />
        </Button>
      </div>
    </>
  );
};
