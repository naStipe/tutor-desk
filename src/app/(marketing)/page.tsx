import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "../../components/Button";
import { ThemeToggle } from "../../components/ThemeToggle";
import { HeroPreview } from "../../features/marketing/components/HeroPreview";
import { Patchwork } from "../../features/marketing/components/Patchwork";
import { Reveal } from "../../features/marketing/components/Reveal";
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

const HEADLINE = ["Run", "your", "tutoring", "business", "from"];
const HEADLINE_END = ["one", "place."];

const FEATURES = [
  {
    title: "A calendar that moves with you",
    text: "Drag lessons around, repeat them weekly, and see at a glance which one is happening right now.",
  },
  {
    title: "Students, kept tidy",
    text: "Notes, contacts, a rate per subject, and a separate payer for when a parent covers the bill.",
  },
  {
    title: "Payments and lesson packages",
    text: "See who owes what, mark lessons paid in bulk, and sell prepaid packages that cover lessons on their own.",
  },
  {
    title: "Homework in one thread",
    text: "Set the work, collect what comes back, and leave feedback without scrolling through chats.",
  },
];

const STEPS = [
  { title: "Add your students", text: "Subjects, rates and contact details, once." },
  { title: "Put lessons on the calendar", text: "One-off or repeating, in a few clicks." },
  { title: "Teach, then follow up", text: "Homework, payments and a portal for families." },
];

export default function HomePage() {
  return (
    <main id="main-content" className="relative overflow-hidden bg-canvas">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from constants; "<" is escaped
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />
      <header className="sticky top-0 z-30 border-b border-border bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div id="brand-title" className="flex items-center gap-2">
            <Image
              src="/brand/tutordesk-icon.png"
              alt=""
              width={451}
              height={362}
              priority
              className="h-7 w-auto"
            />
            <span className="font-serif text-2xl font-semibold tracking-tight text-ink">
              Tutor<span className="text-brand">Desk</span>
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-5">
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
            <a
              href="#faq"
              className="td-link hidden text-sm font-medium text-ink-muted hover:text-ink sm:inline"
            >
              FAQ
            </a>
            <Link
              href="/sign-in"
              className="td-link text-sm font-medium text-ink-muted hover:text-ink"
            >
              Sign in
            </Link>
            <LinkButton href="/sign-up" className="px-4 py-1.5">
              Get started
            </LinkButton>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <p className="td-fade-in-up td-eyebrow">For independent private tutors</p>

          <h1 className="mt-4 font-serif text-6xl font-medium leading-[1] tracking-tight text-ink sm:text-7xl xl:text-8xl">
            {HEADLINE.map((word, i) => (
              <span key={word} className="td-line mr-[0.22em]">
                <span className="td-up" style={{ animationDelay: `${i * 70 + 80}ms` }}>
                  {word}
                </span>
              </span>
            ))}
            {HEADLINE_END.map((word, i) => (
              <span key={word} className="td-line mr-[0.22em]">
                <span
                  className="td-up italic text-brand"
                  style={{ animationDelay: `${(i + HEADLINE.length) * 70 + 80}ms` }}
                >
                  {word}
                </span>
              </span>
            ))}
          </h1>

          <p
            className="td-fade-in-up mt-7 max-w-lg text-lg leading-relaxed text-ink-muted"
            style={{ animationDelay: "600ms" }}
          >
            Your calendar, spreadsheet and payment reminders in one tool, so the evenings you spend
            on admin go back to teaching.
          </p>

          <div
            className="td-fade-in-up mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "750ms" }}
          >
            <LinkButton id="sign-in-link" href="/sign-in" className="px-7 py-3 text-base">
              Sign in
            </LinkButton>
            <LinkButton href="/sign-up" variant="secondary" className="px-7 py-3 text-base">
              Create a free account &rarr;
            </LinkButton>
          </div>

          <p
            className="td-fade-in-up mt-6 text-sm text-ink-subtle"
            style={{ animationDelay: "900ms" }}
          >
            No marketplace, no commission. Your students stay yours.
          </p>
        </div>

        <div className="td-fade-in-up" style={{ animationDelay: "500ms" }}>
          <HeroPreview />
        </div>
      </section>

      <section
        id="compare"
        aria-labelledby="compare-h"
        className="border-y border-border bg-surface-muted/50 px-4 py-28 text-center sm:px-6"
      >
        <Reveal className="mx-auto max-w-5xl">
          <h2
            id="compare-h"
            className="font-serif text-5xl font-medium tracking-tight text-ink sm:text-6xl"
          >
            Most tutors run on five tools
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted">
            A calendar here, a spreadsheet there, reminders in a chat. Flip the switch to see the
            difference.
          </p>
          <Patchwork />
        </Reveal>
      </section>

      <section id="features" className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <Reveal>
          <p className="td-eyebrow mb-5">Features</p>
          <h2 className="max-w-2xl font-serif text-5xl font-medium tracking-tight text-ink sm:text-6xl">
            Everything a solo tutor needs, nothing a school does.
          </h2>
        </Reveal>
        <ol className="mt-14 border-t border-border-strong">
          {FEATURES.map((feature, index) => (
            <li key={feature.title}>
              <Reveal>
                <div className="group grid gap-3 border-b border-border py-8 transition-colors hover:bg-surface-muted/40 sm:grid-cols-[4rem_1.1fr_1fr] sm:gap-8">
                  <span className="font-serif text-2xl italic text-ink-subtle">0{index + 1}</span>
                  <h3 className="font-serif text-3xl font-medium text-ink transition-colors group-hover:text-brand">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-ink-muted">{feature.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section id="how" className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <Reveal>
          <p className="td-eyebrow mb-5">How it works</p>
          <h2 className="font-serif text-5xl font-medium tracking-tight text-ink sm:text-6xl">
            Set up in one sitting
          </h2>
        </Reveal>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={index * 100}>
                <span className="font-serif text-7xl font-medium italic text-brand">
                  {index + 1}
                </span>
                <h3 className="mt-2 text-base font-medium tracking-wide text-ink">{step.title}</h3>
                <p className="mt-1 text-ink-muted">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="calculator"
        aria-labelledby="calc-h"
        className="mx-auto max-w-5xl px-4 pb-24 sm:px-6"
      >
        <Reveal>
          <div className="rounded-lg border border-border-strong bg-surface p-6 sm:p-14">
            <h2
              id="calc-h"
              className="font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl"
            >
              See your week in numbers
            </h2>
            <p className="mb-10 mt-3 max-w-lg text-ink-muted">
              Slide to match your practice. This is your own estimate, nothing is stored.
            </p>
            <WeekCalculator />
          </div>
        </Reveal>
      </section>

      <section id="faq" aria-labelledby="faq-h" className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <Reveal>
          <h2
            id="faq-h"
            className="font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl"
          >
            Questions tutors ask
          </h2>
          <div className="mt-8 border-t border-border-strong">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group border-b border-border">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-2 font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden
                    className="text-2xl leading-none text-brand transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 leading-relaxed text-ink-muted">{a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="rounded-lg bg-brand-strong px-6 py-16 text-center text-on-brand sm:px-14 sm:py-24">
            <h2 className="mx-auto max-w-xl font-serif text-5xl font-medium tracking-tight sm:text-6xl">
              Give your evenings back.
            </h2>
            <p className="mx-auto mt-4 max-w-md opacity-90">
              Set up your workspace and start scheduling today. Creating an account is free.
            </p>
            <LinkButton
              href="/sign-up"
              variant="secondary"
              className="mt-8 !border-transparent !bg-canvas px-8 py-3 text-base !text-ink hover:!bg-surface"
            >
              Create a free account
            </LinkButton>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-ink-subtle">
        TutorDesk · Built for independent tutors
      </footer>
    </main>
  );
}
