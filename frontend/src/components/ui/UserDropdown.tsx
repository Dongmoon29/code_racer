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
        className="flex items-center space-x-3 hover:text-primary focus:outline-none cursor-pointer"
        style={{ color: 'hsl(var(--foreground))' }}
      >
        <div className="relative w-6 h-6 rounded-full overflow-hidden">
          <Image
            src={user.profile_image || '/default-avatar.svg'}
            alt={`${user.name}'s profile`}
            fill
            className="object-cover"
            sizes="24px"
          />
        </div>
        <span className="text-sm">{user.name}</span>
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
        <div
          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-[59] border border-border"
          style={{ backgroundColor: 'hsl(var(--background))' }}
        >
          <div className="py-1">
            <button
              onClick={() => {
                onNavigateToProfile();
                onClose();
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted cursor-pointer"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              My Profile
            </button>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="block w-full text-left px-4 py-2 text-sm hover:bg-muted cursor-pointer"
                style={{ color: 'hsl(var(--foreground))' }}
                onClick={onClose}
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={onLogout}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted cursor-pointer"
              style={{ color: 'hsl(var(--foreground))' }}
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
