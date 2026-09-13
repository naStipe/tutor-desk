import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "../components/Button";
import { ThemeToggle } from "../components/ThemeToggle";
import { BookIcon, CalendarIcon, UsersIcon } from "../components/icons";

const FEATURES = [
  {
    icon: UsersIcon,
    label: "Students",
    description: "Keep a clean roster with notes and contact info.",
  },
  {
    icon: CalendarIcon,
    label: "Lessons",
    description: "An interactive calendar you can click and drag.",
  },
  {
    icon: BookIcon,
    label: "Homework",
    description: "Assign work, collect it, and leave feedback.",
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="relative min-h-screen bg-canvas">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center sm:px-12">
        <div
          id="brand-title"
          className="flex items-center rounded-xl bg-white px-3 py-2 shadow-sm shadow-black/[0.03]"
        >
          <Image
            src="/brand/tutordesk-logo-green.png"
            alt="TutorDesk"
            width={2172}
            height={724}
            priority
            className="h-8 w-auto"
          />
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Run your tutoring business from one place
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
          Students, lessons, and homework in a single calm workspace — built for independent tutors,
          not agencies.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <LinkButton id="sign-in-link" href="/sign-in">
            Sign in
          </LinkButton>
          <Link href="/sign-up" className="text-sm font-medium text-ink-muted hover:text-ink">
            Create account &rarr;
          </Link>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-surface p-5 text-left shadow-sm shadow-black/[0.03]"
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
