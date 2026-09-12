"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";

interface SignOutButtonProps {
  className?: string;
  id?: string;
}

export function SignOutButton({
  className = "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  id = "sign-out-btn",
}: SignOutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
            router.refresh();
          },
          onError: (ctx: { error: { message?: string } }) => {
            setError(ctx.error.message || "Failed to sign out. Please try again.");
          },
        },
      });
    } catch {
      setError("An unexpected error occurred during sign out.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        id={id}
        onClick={handleSignOut}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? "Signing out..." : "Sign Out"}
      </button>
      {error && (
        <p className="text-xs text-rose-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
