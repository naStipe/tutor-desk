import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "../../components/Button";
import { ThemeToggle } from "../../components/ThemeToggle";
import {
  BookIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ReceiptIcon,
  UsersIcon,
} from "../../components/icons";
import { FxLayer } from "../../features/marketing/components/FxLayer";
import { HeroPreview } from "../../features/marketing/components/HeroPreview";
import { Patchwork } from "../../features/marketing/components/Patchwork";
import { Reveal } from "../../features/marketing/components/Reveal";
import { SpotlightCard } from "../../features/marketing/components/SpotlightCard";
import { Tilt } from "../../features/marketing/components/Tilt";
import { WeekCalculator } from "../../features/marketing/components/WeekCalculator";
import { FAQ } from "../../features/marketing/faq";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const PAGE_TITLE = "TutorDesk | Scheduling, homework and payments for private tutors";
const PAGE_DESCRIPTION =
  "Run your tutoring business from one place. Schedule lessons, track homework, manage lesson packages and payments, and share a student portal. No marketplace fees.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "TutorDesk",
    title: "TutorDesk: run your tutoring business from one place",
    description: PAGE_DESCRIPTION,
    url: "/",
    images: ["/brand/tutordesk-logo-green.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TutorDesk: run your tutoring business from one place",
    description: PAGE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "TutorDesk",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: PAGE_DESCRIPTION,
      url: SITE_URL,
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

const HEADLINE = ["Run", "your", "tutoring", "business"];
const HEADLINE_ACCENT = ["from", "one", "calm", "place"];

const BENTO = [
  {
    icon: CalendarIcon,
    label: "A calendar that moves with you",
    description:
      "Click, drag, and reschedule lessons in seconds. Week, month, and day views, with live “in progress” status.",
    className: "md:col-span-2",
    accent: "text-brand bg-brand/10",
  },
  {
    icon: UsersIcon,
    label: "Students, tidy",
    description: "Notes, contacts, per-subject rates, and a different payer when a parent pays.",
    className: "",
    accent: "text-cyan bg-cyan/10",
  },
  {
    icon: ReceiptIcon,
    label: "Payments and packages",
    description:
      "See who owes what, mark lessons paid in bulk, and sell prepaid lesson packages that cover lessons automatically.",
    className: "",
    accent: "text-warning bg-warning/10",
  },
  {
    icon: BookIcon,
    label: "Homework in one thread",
    description:
      "Assign work, collect submissions, and leave feedback without chasing chat messages.",
    className: "md:col-span-2",
    accent: "text-violet bg-violet/10",
  },
];

const STEPS = [
  {
    title: "Add your students",
    text: "Create a roster with subjects, rates, and contact details.",
  },
  { title: "Schedule lessons", text: "Drop lessons on the calendar, one-off or recurring." },
  {
    title: "Teach, then follow up",
    text: "Assign homework, track payments, and share a student portal.",
  },
];

const MARQUEE = [
  "Students",
  "Lessons",
  "Homework",
  "Payments",
  "Lesson packages",
  "Student portal",
  "Recurring series",
  "Dark mode",
  "Works on your phone",
];

export default function HomePage() {
  return (
    <main id="main-content" className="td-grain relative isolate overflow-hidden bg-canvas">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from constants; "<" is escaped
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />
      <FxLayer />
      <div className="td-aurora" aria-hidden data-parallax="70">
        <span />
        <span />
        <span />
      </div>
      <div className="td-grid-bg" aria-hidden data-parallax="40" />

      <header className="td-glass sticky top-0 z-30 border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div id="brand-title" className="flex items-center gap-2">
            <Image
              src="/brand/tutordesk-icon.png"
              alt=""
              width={451}
              height={362}
              priority
              className="h-7 w-auto"
            />
            <span className="text-lg font-bold tracking-tight text-ink">
              Tutor<span className="text-brand">Desk</span>
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            <a
              href="#features"
              className="td-link hidden text-sm font-medium text-ink-muted hover:text-ink sm:inline"
            >
              Features
            </a>
            <a
              href="#how"
              className="td-link hidden text-sm font-medium text-ink-muted hover:text-ink sm:inline"
            >
              How it works
            </a>
            <Link href="/sign-in" className="text-sm font-medium text-ink-muted hover:text-ink">
              Sign in
            </Link>
            <LinkButton href="/sign-up" className="td-cta-shine px-4 py-1.5">
              Get started
            </LinkButton>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
        <span className="td-pop inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-medium text-ink-muted">
          <span className="td-pulse-dot h-1.5 w-1.5 rounded-full bg-brand" />
          Built for independent tutors
        </span>

        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
          {HEADLINE.map((word, i) => (
            <span key={word} className="td-line mr-[0.25em]">
              <span className="td-up" style={{ animationDelay: `${i * 70 + 80}ms` }}>
                {word}
              </span>
            </span>
          ))}
          <br />
          {HEADLINE_ACCENT.map((word, i) => (
            <span key={word} className="td-line mr-[0.25em]">
              <span
                className="td-up"
                style={{ animationDelay: `${(i + HEADLINE.length) * 70 + 80}ms` }}
              >
                <span className="td-gradient-text">{word}</span>
              </span>
            </span>
          ))}
        </h1>

        <p
          className="td-fade-in-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg"
          style={{ animationDelay: "700ms" }}
        >
          Students, lessons, and homework in a single workspace. Schedule classes, track payments,
          and follow up on assignments without juggling spreadsheets and chat threads.
        </p>

        <div
          className="td-fade-in-up mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "850ms" }}
        >
          <LinkButton
            id="sign-in-link"
            href="/sign-in"
            data-magnetic
            className="td-fill td-cta-shine px-7 py-3 text-base shadow-lg shadow-brand/30 hover:-translate-y-0.5"
          >
            Sign in
          </LinkButton>
          <LinkButton
            href="/sign-up"
            variant="secondary"
            data-magnetic
            className="td-fill px-7 py-3 text-base hover:-translate-y-0.5"
          >
            Create a free account &rarr;
          </LinkButton>
        </div>

        <div className="td-fade-in-up relative mt-16 sm:mt-20" style={{ animationDelay: "1000ms" }}>
          <span
            aria-hidden
            className="td-orb -left-10 top-10 h-56 w-56 bg-[var(--td2-cyan)]"
            data-parallax="-50"
          />
          <span
            aria-hidden
            className="td-orb -right-8 bottom-0 h-64 w-64 bg-[var(--td2-violet)]"
            data-parallax="50"
            style={{ animationDelay: "-4s" }}
          />
          <Tilt data-cursor="Your week">
            <HeroPreview />
          </Tilt>
        </div>
      </section>

      <div
        className="td-marquee relative z-10 border-y border-border/70 bg-surface/50 py-4"
        aria-hidden
      >
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
          <div className="td-marquee-track">
            {[...MARQUEE, ...MARQUEE].map((item, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: static decorative list, duplicated for a seamless loop
                key={i}
                className="mx-6 flex items-center gap-6 whitespace-nowrap font-mono text-sm text-ink-muted"
              >
                {item}
                <span className="h-1 w-1 rounded-full bg-brand" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <section
        id="compare"
        aria-labelledby="compare-h"
        className="relative z-10 mx-auto max-w-5xl px-4 pt-24 text-center sm:px-6"
      >
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-brand">
            Your tutoring day
          </p>
          <h2
            id="compare-h"
            className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-5xl"
          >
            With and without TutorDesk
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted">
            Most tutors patch five tools together. Flip the switch.
          </p>
          <Patchwork />
        </Reveal>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-brand">
            Everything in one place
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            Less admin. More teaching.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {BENTO.map(({ icon: Icon, label, description, className, accent }, index) => (
            <Reveal key={label} delay={index * 90} className={className}>
              <SpotlightCard className="h-full p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-8">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="relative z-10 mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <Reveal className="text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-brand">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            Up and running in minutes
          </h2>
        </Reveal>

        <ol className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent md:block"
          />
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={index * 120}>
                <div className="relative text-center">
                  <span className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand/40 bg-surface font-mono text-lg font-bold text-brand shadow-lg shadow-brand/20">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{step.title}</h3>
                  <p className="mx-auto mt-1 max-w-xs text-sm text-ink-muted">{step.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="calculator"
        aria-labelledby="calc-h"
        className="relative z-10 mx-auto max-w-5xl px-4 pb-24 sm:px-6"
      >
        <Reveal>
          <div className="rounded-3xl border border-border bg-surface-muted/60 p-6 sm:p-12">
            <p className="text-center font-mono text-xs uppercase tracking-widest text-brand">
              Your week
            </p>
            <h2
              id="calc-h"
              className="mt-3 text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl"
            >
              See your week in numbers
            </h2>
            <p className="mx-auto mb-10 mt-3 max-w-lg text-center text-ink-muted">
              Slide to match your practice. This is your own estimate, nothing is stored.
            </p>
            <WeekCalculator />
          </div>
        </Reveal>
      </section>

      <section
        id="faq"
        aria-labelledby="faq-h"
        className="relative z-10 mx-auto max-w-3xl px-4 pb-24 sm:px-6"
      >
        <Reveal>
          <h2
            id="faq-h"
            className="text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl"
          >
            Questions tutors ask
          </h2>
          <div className="mt-10 space-y-3">
            {FAQ.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-2xl border border-border bg-surface px-5 transition-colors open:border-brand/40"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden
                    className="text-2xl leading-none text-brand transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-ink-muted">{a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="td-conic">
            <div className="relative overflow-hidden rounded-[calc(1.5rem-1.5px)] bg-surface p-8 text-center sm:p-14">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--td2-accent-surface),transparent_70%)]"
              />
              <div className="relative">
                <ClockIcon className="mx-auto h-8 w-8 text-brand" />
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  Give your evenings back
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-ink-muted">
                  Set up your workspace and start scheduling today. It is free to create an account.
                </p>
                <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-muted">
                  {["Light and dark themes", "Phone-friendly", "Student portal included"].map(
                    (t) => (
                      <li key={t} className="flex items-center gap-1.5">
                        <CheckCircleIcon className="h-4 w-4 text-brand" /> {t}
                      </li>
                    ),
                  )}
                </ul>
                <LinkButton
                  href="/sign-up"
                  data-magnetic
                  data-cursor="Go"
                  className="td-fill td-cta-shine mt-8 px-8 py-3 text-base shadow-lg shadow-brand/30 hover:-translate-y-0.5"
                >
                  Create a free account
                </LinkButton>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="relative z-10 border-t border-border/70 px-4 py-8 text-center text-sm text-ink-subtle">
        TutorDesk · Built for independent tutors
      </footer>
    </main>
  );
}
