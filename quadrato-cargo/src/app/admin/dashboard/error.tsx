"use client";

import { useEffect } from "react";

export default function AdminProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDbIssue =
    /database|Prisma|Mongo|connector|query/i.test(error.message) ||
    error.message.includes("DATABASE_URL");

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border-strong bg-surface-elevated/80 p-8 text-center">
      <h1 className="font-display text-xl font-semibold text-ink">
        Admin couldn&apos;t load this page
      </h1>
      <p className="mt-3 text-sm text-muted">
        {isDbIssue ? (
          <>
            The database may be unreachable or{" "}
            <code className="rounded bg-pill px-1 py-0.5 text-xs text-ink">
              DATABASE_URL
            </code>{" "}
            may be wrong. Use a MongoDB URI and ensure the server is running
            (for example{" "}
            <code className="rounded bg-pill px-1 py-0.5 text-xs text-ink">
              docker compose up -d
            </code>{" "}
            if you use the repo&apos;s Compose file).
          </>
        ) : (
          error.message
        )}
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
