"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { signOutAction } from "../features/auth/actions";
import { displayNameFromEmail, initialsFromEmail } from "../lib/display-name";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Today", exact: true },
  { href: "/dashboard/students", label: "Students", exact: false },
  { href: "/dashboard/lessons", label: "Lessons", exact: false },
  { href: "/dashboard/homework", label: "Homework", exact: false },
  { href: "/dashboard/subjects", label: "Subjects", exact: false },
];

function NavPill({
  active,
  count,
  children,
}: {
  active: boolean;
  count?: number;
  children: ReactNode;
}) {
  return (
    <span
      className={`group flex items-center gap-2.5 rounded-[11px] border px-3 py-2.5 text-sm transition-colors ${
        active
          ? "border-[var(--td2-border-strong)] bg-[var(--td2-bg-inset)] font-medium text-[var(--td2-text-primary)]"
          : "border-transparent text-[var(--td2-text-muted)] hover:bg-[var(--td2-bg-inset-2)] hover:text-[var(--td2-text-primary)]"
      }`}
    >
      <span className="flex-1">{children}</span>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-[20px] bg-[var(--td2-attention)] px-1.5 py-px font-mono text-[11px] font-medium text-[var(--td2-attention-ink)]">
          {count}
        </span>
      )}
      {active && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--td2-accent-dot)]"
        />
      )}
    </span>
  );
}

function NavLinks({
  pathname,
  homeworkCount,
  onNavigate,
}: {
  pathname: string;
  homeworkCount: number;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate}>
            <NavPill active={active} count={item.label === "Homework" ? homeworkCount : undefined}>
              {item.label}
            </NavPill>
          </Link>
        );
      })}

      <p className="mt-6 px-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--td2-text-disabled)]">
        Coming later
      </p>
      <span
        aria-disabled="true"
        className="flex items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-sm text-[var(--td2-text-disabled)]"
      >
        <span className="flex-1">Invoices</span>
        <span className="rounded-[20px] border border-[var(--td2-border-chip)] bg-[var(--td2-bg-inset)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--td2-text-disabled)]">
          SOON
        </span>
      </span>
    </nav>
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-1.5 px-1.5">
      <Image
        src="/brand/tutordesk-icon.png"
        alt=""
        width={451}
        height={362}
        priority
        className="h-6 w-auto"
      />
      <span className="text-[17px] font-bold tracking-[-0.02em] text-[var(--td2-text-primary)]">
        Tutor<span className="text-[var(--td2-accent-text-strong)]">Desk</span>
      </span>
    </span>
  );
}

function Footer({ email }: { email: string }) {
  return (
    <div className="mt-auto flex items-center gap-2.5 border-t border-[var(--td2-border-rail)] pt-4">
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[var(--td2-border-card)] bg-[var(--td2-bg-inset)] text-[12px] font-medium text-[var(--td2-text-secondary)]">
        {initialsFromEmail(email)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[var(--td2-text-primary)]">
          {displayNameFromEmail(email) || "Tutor"}
        </p>
        <p className="truncate font-mono text-[10px] text-[var(--td2-text-faint)]">{email}</p>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          title="Sign out"
          aria-label="Sign out"
          className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-[var(--td2-text-muted)] hover:bg-[var(--td2-bg-inset-2)] hover:text-[var(--td2-text-primary)]"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

export function AppShell({
  email,
  homeworkCount = 0,
  children,
}: {
  email: string;
  homeworkCount?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--td2-bg-page)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[232px] shrink-0 flex-col gap-[34px] border-r border-[var(--td2-border-rail)] bg-[var(--td2-bg-rail)] px-[18px] py-[26px] lg:flex">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <Brand />
            </Link>
            <ThemeToggle />
          </div>
          <div className="flex-1">
            <NavLinks pathname={pathname} homeworkCount={homeworkCount} />
          </div>
          <Footer email={email} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-[var(--td2-border-rail)] bg-[var(--td2-bg-rail)] px-4 py-3 lg:hidden">
            <Link href="/dashboard">
              <Brand />
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileNavOpen((open) => !open)}
                aria-expanded={mobileNavOpen}
                aria-label="Toggle navigation"
                className="rounded-lg border border-[var(--td2-border-card)] p-2 text-[var(--td2-text-muted)] hover:bg-[var(--td2-bg-inset-2)]"
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </header>

          {mobileNavOpen && (
            <div className="border-b border-[var(--td2-border-rail)] bg-[var(--td2-bg-rail)] px-4 py-4 lg:hidden">
              <NavLinks
                pathname={pathname}
                homeworkCount={homeworkCount}
                onNavigate={() => setMobileNavOpen(false)}
              />
              <div className="mt-4 border-t border-[var(--td2-border-rail)] pt-4">
                <Footer email={email} />
              </div>
            </div>
          )}

          <main
            className={
              pathname === "/dashboard" ? "flex-1" : "flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10"
            }
          >
            {pathname === "/dashboard" ? (
              children
            ) : (
              <div className="mx-auto max-w-6xl">{children}</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
