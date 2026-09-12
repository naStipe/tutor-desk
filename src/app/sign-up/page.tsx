"use client";

import Link from "next/link";
import { Shell } from "../../components/Shell";
import { authClient } from "../../lib/auth-client";
import { SignUpForm } from "../../features/auth/components/SignUpForm";
import { SignOutButton } from "../../features/auth/components/SignOutButton";

export default function SignUpPage() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <Shell
      headerContent={
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <Link
            href="/"
            className="text-lg font-bold text-slate-900 tracking-tight hover:text-blue-600 transition-colors"
          >
            TutorDesk
          </Link>
          <span className="text-xs text-slate-500">Tutor Registration</span>
        </div>
      }
    >
      <div className="py-8">
        {isPending ? (
          <div className="w-full max-w-md mx-auto p-6 bg-white border border-slate-200 rounded-xl text-center text-sm text-slate-500 animate-pulse">
            Checking session...
          </div>
        ) : session?.user ? (
          <div
            id="already-authenticated-notice"
            className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-xs"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Already Signed In
            </div>
            <h2 className="text-lg font-bold text-slate-900">Active Tutor Session</h2>
            <p className="text-sm text-slate-600">
              You are already logged in as{" "}
              <span className="font-semibold text-slate-800">{session.user.email}</span>.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-center"
              >
                Return to Home
              </Link>
              <SignOutButton className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors" />
            </div>
          </div>
        ) : (
          <SignUpForm />
        )}
      </div>
    </Shell>
  );
}
