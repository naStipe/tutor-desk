"use client";

import Link from "next/link";
import { authClient } from "../../../lib/auth-client";
import { SignOutButton } from "./SignOutButton";

export function AuthStatusCard() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div
        id="auth-loading-state"
        className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-500 animate-pulse"
      >
        Checking authentication session...
      </div>
    );
  }

  if (session?.user) {
    return (
      <div
        id="authenticated-session-card"
        className="p-5 rounded-lg bg-emerald-50/50 border border-emerald-200/80 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                id="session-badge"
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"
              >
                Authenticated
              </span>
              <span className="text-xs text-slate-500">Tutor Session</span>
            </div>
            <h3 id="session-user-name" className="text-base font-semibold text-slate-900">
              {session.user.name || "Tutor"}
            </h3>
            <p id="session-user-email" className="text-xs text-slate-600 font-mono">
              {session.user.email}
            </p>
          </div>

          <div className="pt-2 sm:pt-0">
            <SignOutButton />
          </div>
        </div>

        <div className="pt-3 border-t border-emerald-100 text-xs text-slate-600 flex items-center justify-between">
          <span>Session recognized and verified.</span>
          <span className="text-slate-400">TD-001A Scope</span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="unauthenticated-session-card"
      className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Tutor Authentication UX</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sign in or register a new tutor account to test session recognition.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <Link
            id="sign-in-nav-link"
            href="/sign-in"
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Sign In
          </Link>
          <Link
            id="sign-up-nav-link"
            href="/sign-up"
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
