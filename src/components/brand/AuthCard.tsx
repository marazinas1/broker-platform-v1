import type { ReactNode } from "react";

/**
 * Centred paper card used by the secondary auth screens (password reset).
 */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-media border border-border bg-card p-8">
        {children}
      </div>
    </div>
  );
}
