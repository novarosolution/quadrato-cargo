"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDbIssue =
    /database|Prisma|Mongo|connector|query|unauthorized|admin api/i.test(error.message) ||
    error.message.includes("DATABASE_URL");

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border-strong bg-surface-elevated/80 p-8 text-center">
      <h1 className="font-display text-xl font-semibold text-ink">
        Admin couldn&apos;t load this page
      </h1>
      <p className="mt-3 text-sm text-muted">
        {isDbIssue ? "Backend connection or admin access check failed." : error.message}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-xl border border-border bg-ghost-fill px-4 py-2 text-sm font-medium text-ink transition hover:bg-pill-hover"
      >
        Try again
      </button>
    </div>
  );
}
