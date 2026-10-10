"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/schedule", label: "Schedule" },
  { href: "/homework", label: "Homework" },
  { href: "/billing", label: "Billing" },
  { href: "/contacts", label: "Contacts" },
  { href: "/portal", label: "Portal access" },
];

export function StudentTabs({ studentId }: { studentId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/students/${studentId}`;

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive = pathname === href;
        return (
          <Link
            key={tab.href}
            href={href}
            className={`-mb-px shrink-0 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-3 text-sm sm:py-2 font-medium transition-[color,transform] duration-100 active:scale-95 motion-reduce:active:scale-100 ${
              isActive
                ? "border-brand text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
