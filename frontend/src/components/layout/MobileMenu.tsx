'use client';

import React, { FC } from 'react';
import Link from 'next/link';
import { User } from '@/stores/authStore';
import { ROUTES } from '@/lib/router';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'next-i18next/pages';

interface MobileMenuProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  user: User | null;
  onLogout: () => void;
  onClose: () => void;
}

const MobileMenu: FC<MobileMenuProps> = ({
  isOpen,
  isLoggedIn,
  user,
  onLogout,
  onClose,
}) => {
  const { t } = useTranslation('common');
  if (!isOpen) return null;

  return (
    <div className="md:hidden py-4 relative z-50 border-t border-[var(--gray-6)] bg-[var(--color-panel)]">
      {isLoggedIn && user ? (
        <div className="space-y-3 px-4">
          <div className="text-sm text-[var(--gray-11)] flex items-center space-x-2">
            <span>{t('nav.signedInAs')}</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <Link
            href={ROUTES.USER_PROFILE(user.id)}
            className="block py-2 text-[var(--color-text)] hover:bg-[var(--gray-4)] rounded transition-colors"
            onClick={onClose}
          >
            {t('nav.dashboard')}
          </Link>
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="block py-2 text-[var(--color-text)] hover:bg-[var(--gray-4)] rounded transition-colors"
              onClick={onClose}
            >
              {t('nav.adminPanel')}
            </Link>
          )}
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="block w-full text-left py-2 text-[var(--color-text)] hover:bg-[var(--gray-4)] rounded transition-colors"
          >
            {t('nav.logout')}
          </button>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          <Link
            href="/login"
            className="block py-2 text-[var(--color-text)] hover:bg-[var(--gray-4)] rounded transition-colors"
            onClick={onClose}
          >
            {t('nav.login')}
          </Link>
          <Link
            href="/register"
            className="block py-2 text-[var(--color-text)] hover:bg-[var(--gray-4)] rounded transition-colors"
            onClick={onClose}
          >
            {t('nav.register')}
          </Link>
        </div>
      )}
      <div className="mt-4 border-t border-[var(--gray-6)] px-4 pt-4">
        <LanguageSwitcher />
      </div>
    </div>
  );
};

export default MobileMenu;
