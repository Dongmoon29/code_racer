import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRightToLine, ArrowLeftToLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUTTON_STYLES } from "@/lib/styles";
import Logo from "./Logo";
import { NavigationLink } from "./NavigationLink";

export interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  pattern?: string;
}

interface DashboardSidebarProps {
  navigationItems: NavigationItem[];
  isCollapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({
  navigationItems,
  isCollapsed,
  onToggle,
}: DashboardSidebarProps) {
  const router = useRouter();

  const primaryItems = navigationItems.filter((item) => item.label !== "Admin");
  const bottomItems = navigationItems.filter((item) => item.label === "Admin");

  return (
    <aside
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex h-[calc(4.75rem+env(safe-area-inset-bottom))] shrink-0 border-t border-[var(--gray-6)] bg-[color:var(--color-panel)]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl md:sticky md:inset-auto md:top-0 md:h-screen md:flex-col md:overflow-y-auto md:border-r md:border-t-0 md:pb-0 md:shadow-none md:transition-[width] md:duration-300",
        isCollapsed ? "md:w-[4.5rem]" : "md:w-60",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "hidden h-20 shrink-0 items-center border-b border-[var(--gray-6)] md:flex",
          isCollapsed ? "justify-center px-3" : "justify-between px-4",
        )}
      >
        <Link
          href="/"
          aria-label="Go to home"
          className={cn(
            "flex min-w-0 items-center rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]",
            isCollapsed ? "justify-center" : "gap-2.5",
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gray-3)]">
            <Logo />
          </span>
          {!isCollapsed && (
            <span className="truncate text-base font-semibold tracking-tight text-[var(--color-text)]">
              codeRacer
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        className="flex min-w-0 flex-1 items-stretch justify-around gap-0.5 px-1.5 py-1.5 md:w-full md:flex-col md:justify-start md:gap-1 md:px-2 md:py-4"
        aria-label="Main navigation"
      >
        {primaryItems.map((item) => {
          const isActive = item.pattern
            ? router.pathname.startsWith(item.pattern)
            : router.pathname === item.href;

          return (
            <NavigationLink
              key={item.href}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
            />
          );
        })}
      </nav>

      {bottomItems.length > 0 && (
        <nav
          className="flex w-1/5 min-w-0 items-stretch py-1.5 pr-1.5 md:w-full md:flex-col md:gap-1 md:border-t md:border-[var(--gray-6)] md:px-2 md:py-3"
          aria-label="Admin navigation"
        >
          {bottomItems.map((item) => {
            const isActive = item.pattern
              ? router.pathname.startsWith(item.pattern)
              : router.pathname === item.href;

            return (
              <NavigationLink
                key={item.href}
                item={item}
                isActive={isActive}
                isCollapsed={isCollapsed}
              />
            );
          })}
        </nav>
      )}

      <div className="hidden border-t border-[var(--gray-6)] p-3 md:block">
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center rounded-xl py-2 text-sm font-medium",
            isCollapsed ? "justify-center px-2" : "gap-3 px-3",
            BUTTON_STYLES.ICON_BUTTON.TEXT,
            "hover:bg-[var(--gray-3)] hover:text-[var(--color-text)]",
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {isCollapsed ? (
            <ArrowRightToLine className="h-5 w-5" />
          ) : (
            <>
              <ArrowLeftToLine className="h-5 w-5" />
              <span>Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
