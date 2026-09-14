import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "../../components/Button";
import { ThemeToggle } from "../../components/ThemeToggle";
import { BookIcon, CalendarIcon, UsersIcon } from "../../components/icons";

const FEATURES = [
  {
    icon: UsersIcon,
    label: "Students",
    description: "Keep a clean roster with notes, contact info, and per-subject rates.",
  },
  {
    icon: CalendarIcon,
    label: "Lessons",
    description: "An interactive calendar you can click, drag, and reschedule in seconds.",
  },
  {
    icon: BookIcon,
    label: "Homework",
    description: "Assign work, collect submissions, and leave feedback — all in one thread.",
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden bg-canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(ellipse_at_top,_var(--color-brand)_0%,_transparent_60%)] opacity-[0.08]"
      />

      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center sm:px-12">
        <div id="brand-title" className="flex items-center gap-2">
          <Image
            src="/brand/tutordesk-icon.png"
            alt=""
            width={451}
            height={362}
            priority
            className="h-9 w-auto"
          />
          <span className="text-2xl font-bold tracking-tight text-ink">
            Tutor<span className="text-brand">Desk</span>
          </span>
        </div>

        <span className="mt-6 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
          Built for independent tutors
        </span>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
          Run your tutoring business from one calm place
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
          Students, lessons, and homework in a single workspace — schedule classes, track payments,
          and follow up on assignments without juggling spreadsheets and chat threads.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <LinkButton id="sign-in-link" href="/sign-in" className="px-6 py-2.5 text-base">
            Sign in
          </LinkButton>
          <Link
            href="/sign-up"
            className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Create a free account &rarr;
          </Link>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, label, description }, index) => (
            <div
              key={label}
              style={{ animationDelay: `${index * 80}ms` }}
              className="td-fade-in-up rounded-xl border border-border bg-surface p-5 text-left shadow-sm shadow-black/[0.03] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">{label}</p>
              <p className="mt-1 text-sm text-ink-muted">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
