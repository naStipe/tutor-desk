"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { signUpSchema } from "../schemas";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    // Client-side schema validation
    const validationResult = signUpSchema.safeParse({ name, email, password });
    if (!validationResult.success) {
      const formattedErrors: { name?: string; email?: string; password?: string } = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = issue.path[0] as "name" | "email" | "password";
        if (fieldName && !formattedErrors[fieldName]) {
          formattedErrors[fieldName] = issue.message;
        }
      }
      setFieldErrors(formattedErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authClient.signUp.email({
        email: validationResult.data.email,
        password: validationResult.data.password,
        name: validationResult.data.name,
      });

      if (response.error) {
        setServerError(
          response.error.message || "Unable to create account. Please check your details.",
        );
        setIsSubmitting(false);
        return;
      }

      // Success: redirect to home where session-aware UI will welcome the tutor
      router.push("/");
      router.refresh();
    } catch {
      setServerError("An unexpected network error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
      <div className="mb-6">
        <h1 id="signup-heading" className="text-xl font-bold text-slate-900 tracking-tight">
          Create Tutor Account
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Register to begin managing your tutoring sessions and students.
        </p>
      </div>

      {serverError && (
        <div
          id="signup-server-error"
          role="alert"
          className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-slate-700 mb-1">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            placeholder="Jane Doe"
            className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:opacity-50 ${
              fieldErrors.name ? "border-rose-300 ring-1 ring-rose-300" : "border-slate-300"
            }`}
          />
          {fieldErrors.name && (
            <p id="signup-name-error" className="mt-1 text-xs text-rose-600 font-medium">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1">
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            placeholder="tutor@example.com"
            className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:opacity-50 ${
              fieldErrors.email ? "border-rose-300 ring-1 ring-rose-300" : "border-slate-300"
            }`}
          />
          {fieldErrors.email && (
            <p id="signup-email-error" className="mt-1 text-xs text-rose-600 font-medium">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            placeholder="At least 8 characters"
            className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:opacity-50 ${
              fieldErrors.password ? "border-rose-300 ring-1 ring-rose-300" : "border-slate-300"
            }`}
          />
          {fieldErrors.password && (
            <p id="signup-password-error" className="mt-1 text-xs text-rose-600 font-medium">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          id="signup-submit-btn"
          disabled={isSubmitting}
          className="w-full mt-2 py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            id="goto-signin-link"
            href="/sign-in"
            className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
