import React, { FC } from 'react';
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
          <div className="w-full border-t border-[var(--gray-6)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-[var(--color-background)] text-[var(--gray-11)] rounded-full">
            Or continue with
          </span>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          type="button"
          className="h-11 w-11 flex items-center justify-center rounded-full mb-4 bg-white  border border-[var(--gray-6)] transition-colors shadow-sm text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          onClick={() => handleOAuthLogin('google')}
          disabled={disabled}
          aria-label="Continue with Google"
        >
          <GoogleIcon aria-hidden="true" />
        </button>

        <button
          type="button"
          className="h-11 w-11 flex items-center justify-center rounded-full mb-4 bg-white  border border-[var(--gray-6)] transition-colors shadow-sm text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          onClick={() => handleOAuthLogin('github')}
          disabled={disabled}
          aria-label="Continue with GitHub"
        >
          <GitHubIcon aria-hidden="true" />
        </button>
      </div>
    </>
  );
};
