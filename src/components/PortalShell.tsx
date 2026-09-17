"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { signOutAction } from "../features/auth/actions";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/portal/schedule", label: "Schedule" },
  { href: "/portal/lessons", label: "Lessons" },
  { href: "/portal/homework", label: "Homework" },
  { href: "/portal/teacher", label: "Teacher" },
];

export function PortalShell({
  students,
  children,
}: {
  students: { id: string; name: string; role: string }[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const selected = students.find((student) => student.id === searchParams.get("student")) ?? students[0];
  const showSwitcher = students.length > 1;
  const query = showSwitcher && selected ? `?student=${selected.id}` : "";

  function handleSwitch(nextId: string) {
    router.push(`${pathname}?student=${nextId}`);
  }

  return (
    <div className="min-h-screen bg-[var(--td2-bg-page)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-brand"
      >
        Skip to content
      </a>
      <header className="border-b border-[var(--td2-border-rail)] bg-[var(--td2-bg-rail)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="flex items-center gap-1.5">
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
          <div className="flex items-center gap-2">
            {showSwitcher ? (
              <label className="hidden sm:block">
                <span className="sr-only">Viewing student</span>
                <select
                  value={selected?.id}
                  onChange={(event) => handleSwitch(event.target.value)}
                  className="rounded-lg border border-[var(--td2-border-rail)] bg-transparent px-2 py-1 text-sm text-[var(--td2-text-muted)]"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="hidden text-sm text-[var(--td2-text-muted)] sm:inline">
                {selected?.name}
              </span>
            )}
            <ThemeToggle />
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-lg px-2 py-1.5 text-[13px] font-medium text-[var(--td2-text-muted)] hover:bg-[var(--td2-bg-inset-2)] hover:text-[var(--td2-text-primary)]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={`${item.href}${query}`}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-[10px] border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-[var(--td2-border-strong)] bg-[var(--td2-bg-inset)] font-medium text-[var(--td2-text-primary)]"
                    : "border-transparent text-[var(--td2-text-muted)] hover:bg-[var(--td2-bg-inset-2)] hover:text-[var(--td2-text-primary)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main id="main-content" className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
        {children}
      </main>
    </div>
  );
}
