import type { ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
  headerContent?: ReactNode;
}

/**
 * Shared layout container component for standard page framing.
 */
export function Shell({ children, headerContent }: ShellProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {headerContent && <header className="mb-6">{headerContent}</header>}
      <section>{children}</section>
    </div>
  );
}
