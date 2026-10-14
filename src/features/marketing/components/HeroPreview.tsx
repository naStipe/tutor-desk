import type { CSSProperties } from "react";
import { ClockIcon } from "../../../components/icons";
import { CountUp } from "./CountUp";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Decorative product preview with made-up demo data. Not real student or revenue figures.
const BLOCKS = [
  { day: 0, top: 14, height: 26, name: "Maya · Algebra", tone: "bg-brand/20 border-brand" },
  { day: 1, top: 40, height: 22, name: "Leo · Physics", tone: "bg-cyan/20 border-cyan" },
  { day: 2, top: 8, height: 22, name: "Ines · Essay", tone: "bg-violet/20 border-violet" },
  {
    day: 2,
    top: 52,
    height: 26,
    name: "Sam · Calculus",
    tone: "bg-hue-orange/20 border-hue-orange",
  },
  { day: 3, top: 26, height: 28, name: "Maya · Algebra", tone: "bg-brand/20 border-brand" },
  { day: 4, top: 12, height: 24, name: "Noah · French", tone: "bg-hue-pink/20 border-hue-pink" },
  { day: 4, top: 50, height: 22, name: "Leo · Physics", tone: "bg-cyan/20 border-cyan" },
];

export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="relative overflow-hidden rounded-lg border border-border-strong bg-surface text-left shadow-[0_40px_80px_-40px_rgba(40,30,10,0.35)]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="ml-3 rounded-md bg-surface-muted px-3 py-0.5 font-mono text-xs text-ink-subtle">
            tutordesk / schedule
          </span>
        </div>

        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-[1fr_15rem]">
          <div className="bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">This week</p>
              <span className="flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                7 lessons
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {DAYS.map((day, index) => (
                <div key={day} className="relative h-44 rounded-lg bg-surface-muted/70 sm:h-52">
                  <p className="px-2 pt-1.5 text-xs font-medium text-ink-subtle">{day}</p>
                  {BLOCKS.filter((block) => block.day === index).map((block, i) => (
                    <div
                      key={block.name + block.top}
                      style={{
                        top: `${block.top + 12}%`,
                        height: `${block.height}%`,
                        animationDelay: `${600 + index * 130 + i * 90}ms`,
                      }}
                      className={`td-block-grow absolute inset-x-1 overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-xs font-medium leading-tight text-ink ${block.tone}`}
                    >
                      <span className="line-clamp-2">{block.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden flex-col gap-3 bg-surface p-4 sm:flex">
            <div className="rounded-xl border border-border bg-surface-muted/60 p-3">
              <p className="text-xs text-ink-subtle">Outstanding</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
                <CountUp to={420} prefix="$" />
              </p>
              <svg viewBox="0 0 120 32" className="mt-2 h-8 w-full" fill="none" aria-hidden>
                <path
                  d="M2 26 C 18 24, 24 12, 40 14 S 66 24, 80 12 S 106 4, 118 6"
                  stroke="var(--td2-accent-dot)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="td-draw"
                  style={{ "--td-len": 160 } as CSSProperties}
                />
              </svg>
            </div>
            <div className="rounded-xl border border-border bg-surface-muted/60 p-3">
              <p className="text-xs text-ink-subtle">Up next</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
                <ClockIcon className="h-4 w-4 text-cyan" /> Maya · 4:00 PM
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">Quadratics, homework review</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-muted/60 p-3">
              <p className="text-xs text-ink-subtle">Homework</p>
              <p className="mt-1 text-sm font-semibold text-ink">2 to review</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
