import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { LEGAL_UPDATED } from "../legal";

type LegalShellProps = { title: string; intro: string; children: ReactNode };

// Shared frame for the privacy and terms pages: plain, readable, no effects.
export function LegalShell({ title, intro, children }: LegalShellProps) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-brand"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-canvas">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/tutordesk-icon.png"
              alt=""
              width={451}
              height={362}
              sizes="36px"
              className="h-7 w-auto"
            />
            <span className="font-serif text-xl font-semibold tracking-tight text-ink">
              Tutor<span className="text-brand">Desk</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="main-content" className="bg-canvas px-4 py-14 sm:px-6 sm:py-20">
        <article className="mx-auto max-w-3xl">
          <p className="td-eyebrow">Legal</p>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-ink-subtle">Last updated {LEGAL_UPDATED}</p>
          <p className="mt-6 text-lg leading-relaxed text-ink-muted">{intro}</p>
          <div className="mt-10 space-y-10 leading-relaxed text-ink-muted">{children}</div>
          <p className="mt-14 border-t border-border pt-6 text-sm">
            <Link href="/" className="td-link text-ink-muted hover:text-ink">
              &larr; Back to TutorDesk
            </Link>
          </p>
        </article>
      </main>
    </>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-ink-subtle">
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static legal copy, never reordered
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
