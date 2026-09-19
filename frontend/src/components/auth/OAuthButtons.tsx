import React, { FC } from "react";
import { GoogleIcon, GitHubIcon } from "../ui/icons";

interface OAuthButtonsProps {
  disabled?: boolean;
}

export const OAuthButtons: FC<OAuthButtonsProps> = ({ disabled = false }) => {
  const handleOAuthLogin = (provider: "google" | "github") => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}`;
  };

  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--gray-6)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="rounded-full bg-[var(--color-panel)] px-3 text-xs font-medium uppercase tracking-[0.14em] text-[var(--gray-10)]">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex h-11 items-center justify-center rounded-xl border border-[var(--gray-6)] bg-white text-gray-900 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => handleOAuthLogin("google")}
          disabled={disabled}
          aria-label="Continue with Google"
        >
          <GoogleIcon aria-hidden="true" />
        </button>

        <button
          type="button"
          className="flex h-11 items-center justify-center rounded-xl border border-[var(--gray-6)] bg-white text-gray-900 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => handleOAuthLogin("github")}
          disabled={disabled}
          aria-label="Continue with GitHub"
        >
          <GitHubIcon aria-hidden="true" />
        </button>
      </div>
    </>
  );
};
