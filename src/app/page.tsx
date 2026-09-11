import Link from "next/link";

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
      <div id="foundation-card" className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <h1 id="brand-title" className="text-2xl font-bold tracking-tight text-slate-900">
              TutorDesk
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Management SaaS for independent private tutors
            </p>
          </div>
          <span
            id="status-badge"
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            TD-000 Initialized
          </span>
        </div>

        <div className="py-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-800">
            Project Foundation Established
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            This minimal application shell verifies that the Next.js App Router, Tailwind CSS, TypeScript, and Drizzle ORM configuration are operating correctly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
              <span className="font-semibold text-slate-700 block mb-1">Architecture</span>
              <span className="text-slate-500">TypeScript Modular Monolith</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
              <span className="font-semibold text-slate-700 block mb-1">Persistence</span>
              <span className="text-slate-500">PostgreSQL + Drizzle ORM</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
              <span className="font-semibold text-slate-700 block mb-1">Authentication</span>
              <span className="text-slate-500">Better Auth Plumbing</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
              <span className="font-semibold text-slate-700 block mb-1">Next Milestone</span>
              <span className="text-slate-500">TD-001 (Auth & Ownership)</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <Link
            id="health-check-link"
            href="/api/health"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4"
          >
            Verify API Health Endpoint &rarr;
          </Link>
          <span className="text-xs text-slate-400">
            Single-repo production foundation
          </span>
        </div>
      </div>
    </main>
  );
}
