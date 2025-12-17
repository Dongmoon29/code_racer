'use client';

import React, { RefObject, FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@/stores/authStore';

interface UserDropdownProps {
  user: User;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  dropdownRef: RefObject<HTMLDivElement | null>;
  onLogout: () => void;
  onNavigateToProfile: () => void;
}

const UserDropdown: FC<UserDropdownProps> = ({
  user,
  isOpen,
  onToggle,
  onClose,
  dropdownRef,
  onLogout,
  onNavigateToProfile,
}) => {
  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="flex items-center space-x-3 text-[var(--color-text)] hover:text-[var(--accent-9)] focus:outline-none cursor-pointer transition-colors"
      >
        <div className="relative w-6 h-6 rounded-full overflow-hidden">
          <Image
            src={user.profile_image || '/default-avatar.svg'}
            alt={`${user.name}'s profile`}
            fill
            className="object-cover"
            sizes="24px"
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        </div>
        <span className="text-sm font-medium">{user.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-[59] border border-[var(--gray-6)] bg-[var(--color-background)]">
          <div className="py-1">
            <button
              onClick={() => {
                onNavigateToProfile();
                onClose();
              }}
              className="block w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--gray-4)] cursor-pointer transition-colors"
            >
              My Profile
            </button>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="block w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--gray-4)] cursor-pointer transition-colors"
                onClick={onClose}
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={onLogout}
              className="block w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--gray-4)] cursor-pointer transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
