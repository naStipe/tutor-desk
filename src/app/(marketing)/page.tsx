import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "../../components/Button";
import { ThemeToggle } from "../../components/ThemeToggle";
import { AccountDeletedNotice } from "../../features/marketing/components/AccountDeletedNotice";
import { FxLayer } from "../../features/marketing/components/FxLayer";
import { HeroPreview } from "../../features/marketing/components/HeroPreview";
import { MobileNav } from "../../features/marketing/components/MobileNav";
import { Patchwork } from "../../features/marketing/components/Patchwork";
import { Reveal } from "../../features/marketing/components/Reveal";
import { WeekCalculator } from "../../features/marketing/components/WeekCalculator";
import { FAQ } from "../../features/marketing/faq";
import { CONTACT_EMAIL } from "../../features/marketing/legal";
import { PLAN_INCLUDES, PRICE, PRICE_LABEL } from "../../features/marketing/pricing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const PAGE_TITLE = "TutorDesk | Scheduling, homework and payments for private tutors";
const PAGE_DESCRIPTION =
  "Run your tutoring business from one place. Schedule lessons, track homework, manage lesson packages and payments, and share a student portal. No marketplace fees.";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "TutorDesk",
    title: "TutorDesk: run your tutoring business from one place",
    description: PAGE_DESCRIPTION,
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TutorDesk: run your tutoring business from one place",
    description: PAGE_DESCRIPTION,
    images: ["/opengraph-image"],
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
      offers: {
        "@type": "Offer",
        price: PRICE.amount,
        priceCurrency: PRICE.currency,
      },
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
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-brand"
      >
        Skip to content
      </a>
      <main id="main-content" className="relative overflow-x-clip bg-canvas">
        <FxLayer />
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from constants; "<" is escaped
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
        />
        <AccountDeletedNotice />
        <header className="sticky top-0 z-30 border-b border-border bg-canvas">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <div id="brand-title" className="flex items-center gap-2">
              <Image
                src="/brand/tutordesk-icon.png"
                alt=""
                width={451}
                height={362}
                sizes="36px"
                priority
                className="h-7 w-auto"
              />
              <span className="font-serif text-xl font-semibold tracking-tight text-ink">
                Tutor<span className="text-brand">Desk</span>
              </span>
            </div>
            <nav className="flex items-center gap-2 md:gap-5">
              <a
                href="#features"
                className="td-link hidden whitespace-nowrap text-sm font-medium text-ink-muted hover:text-ink md:inline"
              >
                Features
              </a>
              <a
                href="#how"
                className="td-link hidden whitespace-nowrap text-sm font-medium text-ink-muted hover:text-ink md:inline"
              >
                How it works
              </a>
              <a
                href="#pricing"
                className="td-link hidden whitespace-nowrap text-sm font-medium text-ink-muted hover:text-ink md:inline"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="td-link hidden whitespace-nowrap text-sm font-medium text-ink-muted hover:text-ink md:inline"
              >
                FAQ
              </a>
              <Link
                href="/sign-in"
                className="td-link hidden whitespace-nowrap text-sm font-medium text-ink-muted hover:text-ink md:inline"
              >
                Sign in
              </Link>
              <LinkButton href="/sign-up" className="td-fill whitespace-nowrap px-4 py-1.5">
                Get started
              </LinkButton>
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              <MobileNav />
            </nav>
          </div>
        </header>

        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="td-fade-in-up td-eyebrow flex items-center gap-2.5">
              <span className="td-pulse-dot h-1.5 w-1.5 rounded-full bg-brand" />
              For independent private tutors
            </p>

            <h1 className="td-fade-in-up mt-4 font-serif text-5xl font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl xl:text-7xl">
              Run your tutoring business from <span className="italic text-brand">one place.</span>
            </h1>

            <p
              className="td-fade-in-up mt-7 max-w-lg text-lg leading-relaxed text-ink-muted"
              style={{ animationDelay: "80ms" }}
            >
              Your calendar, spreadsheet and payment reminders in one tool, so the evenings you
              spend on admin go back to teaching.
            </p>

            <div
              className="td-fade-in-up mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "160ms" }}
            >
              <LinkButton href="/sign-up" className="td-fill px-7 py-3 text-base">
                Create your account &rarr;
              </LinkButton>
              <LinkButton
                id="sign-in-link"
                href="/sign-in"
                variant="secondary"
                className="td-fill px-7 py-3 text-base"
              >
                Sign in
              </LinkButton>
            </div>

            <p
              className="td-fade-in-up mt-6 text-sm text-ink-subtle"
              style={{ animationDelay: "240ms" }}
            >
              No marketplace, no commission. Your students stay yours.
            </p>
          </div>

          <div className="td-fade-in-up" style={{ animationDelay: "200ms" }}>
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
              className="font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
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
            <h2 className="max-w-2xl font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Everything a solo tutor needs, nothing a school does.
            </h2>
            <span className="td-rule" />
          </Reveal>
          <ol className="mt-14 border-t border-border-strong">
            {FEATURES.map((feature, index) => (
              <li key={feature.title}>
                <Reveal delay={index * 90}>
                  <div className="group grid gap-3 border-b border-border px-3 py-8 transition-colors hover:bg-surface-muted/40 sm:grid-cols-[4rem_1.1fr_1fr] sm:gap-8">
                    <span className="font-serif text-2xl italic text-ink-subtle">0{index + 1}</span>
                    <h3 className="font-serif text-2xl font-semibold text-ink transition-colors group-hover:text-brand">
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
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Set up in one sitting
            </h2>
            <span className="td-rule" />
          </Reveal>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="td-lift">
                <Reveal delay={index * 100}>
                  <span className="font-serif text-6xl font-semibold italic text-brand">
                    {index + 1}
                  </span>
                  <h3 className="mt-2 text-xl font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-base leading-relaxed text-ink-muted">{step.text}</p>
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
                className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
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

        <section
          id="pricing"
          aria-labelledby="pricing-h"
          className="mx-auto max-w-5xl px-4 pb-24 sm:px-6"
        >
          <Reveal>
            <p className="td-eyebrow mb-5">Pricing</p>
            <div className="grid gap-10 rounded-lg border border-border-strong bg-surface p-6 sm:p-14 md:grid-cols-[1fr_1.2fr]">
              <div>
                <h2
                  id="pricing-h"
                  className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
                >
                  One plan, every feature
                </h2>
                <p className="mt-6 flex items-baseline gap-2 text-ink">
                  <span className="font-serif text-6xl font-semibold tracking-tight">
                    {PRICE_LABEL}
                  </span>
                  <span className="text-ink-muted">per {PRICE.period}</span>
                </p>
                <p className="mt-3 text-sm text-ink-subtle">
                  No commission on your lessons. Your students stay yours.
                </p>
                <LinkButton href="/sign-up" className="td-fill mt-8 px-7 py-3 text-base">
                  Create your account
                </LinkButton>
              </div>
              <ul className="space-y-4 self-center border-t border-border pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
                {PLAN_INCLUDES.map((item) => (
                  <li key={item} className="flex gap-3 text-ink">
                    <span aria-hidden className="mt-0.5 text-brand">
                      &#10003;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>

        <section id="faq" aria-labelledby="faq-h" className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
          <Reveal>
            <h2
              id="faq-h"
              className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
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
            <div className="td-on-brand rounded-lg bg-brand-strong px-6 py-16 text-center text-on-brand sm:px-14 sm:py-24">
              <h2 className="mx-auto max-w-xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                Give your evenings back.
              </h2>
              <p className="mx-auto mt-4 max-w-md opacity-90">
                Set up your workspace and start scheduling today, for {PRICE_LABEL} per{" "}
                {PRICE.period}.
              </p>
              <LinkButton
                href="/sign-up"
                variant="secondary"
                className="td-fill mt-8 !border-transparent !bg-canvas px-8 py-3 text-base !text-ink hover:!bg-surface"
              >
                Create your account
              </LinkButton>
            </div>
          </Reveal>
        </section>

        <footer className="border-t border-border px-4 py-10 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-5 text-sm text-ink-subtle sm:flex-row">
            <p>© {new Date().getFullYear()} TutorDesk · Built for independent tutors</p>
            <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="#features" className="td-link hover:text-ink">
                Features
              </a>
              <a href="#how" className="td-link hover:text-ink">
                How it works
              </a>
              <a href="#pricing" className="td-link hover:text-ink">
                Pricing
              </a>
              <a href="#faq" className="td-link hover:text-ink">
                FAQ
              </a>
              <Link href="/sign-in" className="td-link hover:text-ink">
                Sign in
              </Link>
              <Link href="/sign-up" className="td-link hover:text-ink">
                Create an account
              </Link>
              <Link href="/privacy" className="td-link hover:text-ink">
                Privacy
              </Link>
              <Link href="/terms" className="td-link hover:text-ink">
                Terms
              </Link>
              <a href={`mailto:${CONTACT_EMAIL}`} className="td-link hover:text-ink">
                Contact
              </a>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}
