import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "../../../components/ThemeToggle";

// Shared animated shell for sign-in, sign-up and password pages.
export function AuthBackdrop({ children }: { children: ReactNode }) {
  return (
    <main
      id="main-content"
      className="td-grain relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas p-6"
    >
      <div className="td-aurora" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="td-grid-bg" aria-hidden />

      <Link
        href="/"
        className="absolute left-4 top-4 z-10 flex items-center gap-2 sm:left-6 sm:top-6"
      >
        <Image
          src="/brand/tutordesk-icon.png"
          alt=""
          width={451}
          height={362}
          className="h-7 w-auto"
        />
        <span className="font-bold tracking-tight text-ink">
          Tutor<span className="text-brand">Desk</span>
        </span>
      </Link>
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="td-fade-in-up relative z-10 w-full max-w-md">{children}</div>
    </main>
  );
}
