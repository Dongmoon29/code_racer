import React from 'react';
import Head from 'next/head';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LAYOUT_PADDING, LAYOUT_WIDTH } from '@/lib/styles';
import { cn } from '@/lib/utils';

const SettingsPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Settings - CodeRacer</title>
        <meta
          name="description"
          content="Customize your CodeRacer experience"
        />
      </Head>

      <div className={LAYOUT_PADDING.PAGE_VERTICAL}>
        <div className={cn(LAYOUT_WIDTH.CONTAINER_SMALL, 'space-y-6')}>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">
              Settings
            </h1>
            <p className="mt-1 text-sm text-[var(--gray-11)]">
              Personalize your experience. You can change the theme here and
              more options will be added soon.
            </p>
          </div>

          <section className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Theme
            </h2>
            <p className="mt-1 text-sm text-[var(--gray-11)]">
              Switch between light and dark mode.
            </p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[var(--color-text)]">
                Appearance
              </span>
              <ThemeToggle />
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;


