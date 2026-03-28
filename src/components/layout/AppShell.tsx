"use client";

import Link from "next/link";
import { ToastProvider } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
  userEmail: string;
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

export function AppShell({ children, userEmail }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background w-full ">
        {/* Skip to content — keyboard accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-60 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>

        {/* Desktop Sidebar — expands as overlay, content never shifts */}
        <aside
          className={`hidden md:flex fixed left-0 top-0 h-screen flex-col border-r border-border bg-surface z-50 transition-all duration-200 shadow-lg ${
            sidebarExpanded ? "w-56" : "w-16 shadow-none"
          }`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            {sidebarExpanded && (
              <span className="ml-3 font-bold text-text-primary text-sm whitespace-nowrap">
                FinTrack
              </span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 space-y-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 h-10 px-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-background hover:text-text-primary"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {sidebarExpanded && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-3">
            {sidebarExpanded ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary truncate max-w-[120px]">
                  {userEmail}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-xs text-text-muted hover:text-debit transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex justify-center cursor-pointer"
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
            )}
          </div>
        </aside>

        {/* Main content — always offset by collapsed sidebar width */}
        <main
          id="main-content"
          className="pb-20 md:pb-0 md:ml-16"
          tabIndex={-1}
        >
          <div className="max-w-7xl mx-auto p-4 md:p-8">{children}</div>
        </main>

        {/* Mobile Bottom Nav */}
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
