import React, { useState, useRef, useEffect, FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { ThemeToggle } from '../ui/ThemeToggle';
import Image from 'next/image';

const Header: FC = () => {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 로그아웃 처리
  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    router.push('/login');
  };

  // 메뉴 토글
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // 드롭다운 토글
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="border-b border-border bg-[color:hsl(var(--header))]">
      <div className="px-4">
        <div className="flex justify-between items-center py-1">
          {/* 로고 */}
          <div className="flex justify-between items-center gap-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="CodeRacer Logo"
                width={30}
                height={20}
                priority
                className="h-auto w-auto mr-2"
              />
              <p className="text-md font-bold text-[hsl(var(--foreground))]">
                codeRacer
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="hover:text-primary text-sm"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              Dashboard
            </Link>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            {isLoggedIn && user && (
              <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
                <Image
                  src={user.profile_image || '/default-avatar.svg'}
                  alt={`${user.name}'s profile`}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              </div>
            )}
            <button
              onClick={toggleMenu}
              className="p-2 rounded hover:bg-muted"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                style={{ color: 'hsl(var(--foreground))' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* 데스크톱 메뉴 */}
          <nav className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {isLoggedIn && user ? (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
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
                        dropdownOpen ? 'transform rotate-180' : ''
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
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 border border-border"
                      style={{ backgroundColor: 'hsl(var(--background))' }}
                    >
                      <div className="py-1">
                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                            style={{ color: 'hsl(var(--foreground))' }}
                            onClick={() => setDropdownOpen(false)}
                          >
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                          style={{ color: 'hsl(var(--foreground))' }}
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-primary text-sm"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  Login
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* 모바일 메뉴 */}
        {menuOpen && (
          <div className="md:hidden py-4">
            {isLoggedIn && user ? (
              <div className="space-y-3">
                <div className="px-2 text-sm text-[hsl(var(--foreground))] flex items-center space-x-2">
                  <span>Signed in as</span>
                  <span>{user.email}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="block px-2 py-2 text-foreground hover:bg-muted rounded text-[hsl(var(--foreground))]"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block px-2 py-2 text-foreground hover:bg-muted rounded text-[hsl(var(--foreground))]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-2 py-2 text-foreground hover:bg-muted rounded text-[hsl(var(--foreground))]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block px-2 py-2 text-foreground hover:bg-muted rounded text-[hsl(var(--foreground))]"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-2 py-2 text-foreground hover:bg-muted rounded text-[hsl(var(--foreground))]"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
