import React from 'react';
import Head from 'next/head';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { LAYOUT_PADDING, LAYOUT_WIDTH } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { useTranslation } from 'next-i18next/pages';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <>
      <Head>
        <title>{t('settings.title')} - CodeRacer</title>
        <meta
          name="description"
          content={t('settings.description')}
        />
      </Head>

      <div className={LAYOUT_PADDING.PAGE_VERTICAL}>
        <div className={cn(LAYOUT_WIDTH.CONTAINER_SMALL, 'space-y-6')}>
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
              {t('settings.title')}
            </h1>
          </div>

          <section className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              {t('settings.theme')}
            </h2>
            <p className="mt-1 text-sm text-[var(--gray-11)]">
              {t('settings.themeDescription')}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[var(--color-text)]">
                {t('settings.appearance')}
              </span>
              <ThemeToggle />
            </div>
          </section>

          <section className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              {t('settings.language')}
            </h2>
            <p className="mt-1 text-sm text-[var(--gray-11)]">
              {t('settings.languageDescription')}
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-[var(--color-text)]">
                {t('settings.displayLanguage')}
              </span>
              <LanguageSwitcher className="self-start sm:self-auto" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
