"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { signOutAction } from "../features/auth/actions";
import { BookIcon, CalendarIcon, HomeIcon, ReceiptIcon, UsersIcon } from "./icons";

const NAV_ITEMS = [
  { href: "/dashboard/students", label: "Students", icon: UsersIcon },
  { href: "/dashboard/lessons", label: "Lessons", icon: CalendarIcon },
  { href: "/dashboard/homework", label: "Homework", icon: BookIcon },
];

const COMING_LATER = [{ label: "Invoices", icon: ReceiptIcon }];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const isDashboard = pathname === "/dashboard";
  return (
    <nav className="flex flex-col gap-0.5">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={`group flex items-center gap-2.5 rounded-lg border-l-2 px-2.5 py-2 text-sm font-medium transition-colors ${
          isDashboard
            ? "border-blue-600 bg-blue-50 text-blue-700"
            : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <HomeIcon
          className={`h-4.5 w-4.5 ${isDashboard ? "text-blue-600" : "text-slate-400 group-hover:text-slate-500"}`}
        />
        Dashboard
      </Link>
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-2.5 rounded-lg border-l-2 px-2.5 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon
              className={`h-4.5 w-4.5 ${active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-500"}`}
            />
            {item.label}
          </Link>
        );
      })}
      <p className="mt-5 px-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Coming later
      </p>
      {COMING_LATER.map(({ label, icon: Icon }) => (
        <span
          key={label}
          aria-disabled="true"
          className="flex items-center gap-2.5 rounded-lg border-l-2 border-transparent px-2.5 py-2 text-sm text-slate-400"
        >
          <Icon className="h-4.5 w-4.5 text-slate-300" />
          <span className="flex-1">{label}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            Soon
          </span>
        </span>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
        T
      </span>
      TutorDesk
    </span>
  );
}

export function AppShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
          <Link href="/dashboard" className="px-1">
            <Brand />
          </Link>
          <div className="mt-8 flex-1">
            <NavLinks pathname={pathname} />
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="truncate px-2.5 text-xs text-slate-500">{email}</p>
            <form action={signOutAction} className="mt-2">
              <button
                type="submit"
                className="w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <Link href="/dashboard">
              <Brand />
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-expanded={mobileNavOpen}
              aria-label="Toggle navigation"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                {mobileNavOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </header>

          {mobileNavOpen && (
            <div className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
              <NavLinks pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="px-2.5 text-xs text-slate-500">{email}</p>
                <form action={signOutAction} className="mt-2">
                  <button
                    type="submit"
                    className="w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
