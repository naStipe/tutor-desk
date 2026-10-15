"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ThemeToggle } from "../../../components/ThemeToggle";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const ITEM_CLASS =
  "flex min-h-11 items-center rounded-lg px-3 text-base font-medium text-ink hover:bg-surface-muted";

// Disclosure menu for the landing header below the `md` breakpoint, where the inline anchor links
// and the theme toggle are hidden. The panel is positioned against the sticky header (its nearest
// positioned ancestor).
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (document.getElementById(panelId)?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, panelId]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open ? (
        <div
          id={panelId}
          className="td-fade-in-up absolute inset-x-0 top-full border-b border-border bg-canvas px-4 py-2"
        >
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={ITEM_CLASS} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/sign-in" className={ITEM_CLASS} onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </li>
            <li className="flex min-h-11 items-center justify-between px-3 text-base font-medium text-ink">
              Theme
              <ThemeToggle className="h-11 w-11" />
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
