"use client";

import Link from "next/link";
import { ToastProvider } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";

interface AppShellProps {
  children: React.ReactNode;
  userEmail: string;
  /** Profile display name; when missing or empty, sidebar shows email */
  userName?: string | null;
}

const navItems = [
  {
    label: "Home",
    href: "/dashboard",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    ),
  },
  {
    label: "Upload",
    href: "/dashboard/upload",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
    ),
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text-primary hover:bg-background dark:hover:bg-surface-raised transition-colors cursor-pointer shrink-0"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      )}
    </button>
  );
}

export function AppShell({ children, userEmail, userName }: AppShellProps) {
  const pathname = usePathname();
  const sidebarUserLabel =
    userName?.trim() && userName.trim().length > 0
      ? userName.trim()
      : userEmail;
  /** md–lg: icon rail unless user expands */
  const [narrowExpanded, setNarrowExpanded] = useState(false);
  const [isXl, setIsXl] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const apply = () => {
      setIsXl(mq.matches);
      if (mq.matches) setNarrowExpanded(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const showLabels = isXl || narrowExpanded;
  const sidebarWidthClass = isXl
    ? "w-[220px]"
    : narrowExpanded
      ? "w-56"
      : "w-16";
  const mainMarginClass = isXl
    ? "md:ml-[220px]"
    : narrowExpanded
      ? "md:ml-56"
      : "md:ml-16";

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background w-full">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-60 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>

        {/* Mobile: theme toggle (desktop sidebar is hidden below md) */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm supports-[backdrop-filter]:bg-surface/80 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <span className="min-w-0 truncate font-semibold text-sm text-text-primary">
              FinTrack
            </span>
            <ThemeToggleButton />
          </div>
        </header>

        <aside
          className={`hidden md:flex fixed left-0 top-0 h-screen flex-col border-r border-border bg-surface z-50 transition-[width] duration-200 ease-out ${sidebarWidthClass}`}
        >
          <div className="h-14 flex items-center gap-2 px-3 border-b border-border shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            {showLabels && (
              <span className="font-bold text-text-primary text-sm whitespace-nowrap truncate">
                FinTrack
              </span>
            )}
            {!isXl && (
              <button
                type="button"
                onClick={() => setNarrowExpanded((v) => !v)}
                className="ml-auto p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-background dark:hover:bg-surface-raised cursor-pointer shrink-0"
                title={narrowExpanded ? "Collapse sidebar" : "Expand sidebar"}
                aria-expanded={narrowExpanded}
                aria-label={
                  narrowExpanded ? "Collapse sidebar" : "Expand sidebar"
                }
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {narrowExpanded ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  )}
                </svg>
              </button>
            )}
          </div>

          <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 min-h-10 px-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary-light text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:rounded-r before:bg-primary"
                    : "text-text-secondary hover:bg-background hover:text-text-primary dark:hover:bg-surface-raised"
                }`}
                title={!showLabels ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {showLabels && (
                  <span className="whitespace-nowrap truncate">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="border-t border-border p-2 space-y-2 shrink-0">
            {showLabels ? (
              <>
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-xs text-text-secondary truncate min-w-0">
                    {sidebarUserLabel}
                  </span>
                  <ThemeToggleButton />
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full text-left text-xs text-text-muted hover:text-debit transition-colors cursor-pointer px-1 py-1.5 rounded-lg hover:bg-background dark:hover:bg-surface-raised"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <ThemeToggleButton />
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex justify-center cursor-pointer p-2 rounded-lg hover:bg-background dark:hover:bg-surface-raised"
                  title="Logout"
                >
                  <svg
                    className="w-5 h-5 text-text-muted hover:text-debit transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </aside>

        <main
          id="main-content"
          className={`pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-20 md:pt-0 md:pb-0 ${mainMarginClass}`}
          tabIndex={-1}
        >
          <div className="max-w-[1400px] mx-auto p-4 md:px-6 md:py-5">
            {children}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex items-stretch justify-around z-40 px-1 safe-area-pb">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] min-w-[48px] px-2 rounded-lg text-xs font-medium transition-colors ${
                isActive(item.href) ? "text-primary" : "text-text-muted"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </ToastProvider>
  );
}
