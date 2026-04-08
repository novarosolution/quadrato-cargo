import Link from "next/link";
import { adminUi } from "@/components/admin/admin-ui";

export function AdminDatabaseError({ message }: { message: string }) {
  const lower = message.toLowerCase();
  const isApiConnection =
    lower.includes("cannot connect") ||
    lower.includes("fetch") ||
    lower.includes("econnrefused");
  const isUnauthorized =
    lower.includes("unauthorized") || lower.includes("admin_api_secret");
  return (
    <div className={`mx-auto max-w-2xl ${adminUi.errorPanel}`}>
      <h1 className="font-display text-xl font-semibold text-ink">Data unavailable</h1>
      <p className="mt-2 text-sm text-muted">Fix the API connection and refresh.</p>
      {isUnauthorized ? (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-ink">
          Admin reads use the header{" "}
          <code className="rounded bg-pill px-1 text-xs">x-admin-secret</code> from{" "}
          <code className="rounded bg-pill px-1 text-xs">ADMIN_API_SECRET</code> in your
          Next env. Copy the same value into the API server{" "}
          <code className="rounded bg-pill px-1 text-xs">ADMIN_API_SECRET</code> (no extra
          spaces or quotes). This is separate from{" "}
          <code className="rounded bg-pill px-1 text-xs">ADMIN_SECRET</code> used for
          signing the admin login session.
        </p>
      ) : null}
      {isApiConnection ? (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-ink">
          Backend API is not reachable from Next. Start the API (e.g.{" "}
          <code className="rounded bg-pill px-1 text-xs">quadrato-cargo/server</code> or repo{" "}
          <code className="rounded bg-pill px-1 text-xs">server</code>) and set{" "}
          <code className="rounded bg-pill px-1 text-xs">NEXT_PUBLIC_API_BASE_URL</code> to
          that origin (e.g. <code className="rounded bg-pill px-1 text-xs">http://localhost:4010</code>
          ).
        </p>
      ) : null}
      <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-canvas/80 p-4 text-xs text-rose-300">
        {message}
      </pre>
      <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-muted">
        <li>
          Ensure API <code className="rounded bg-pill px-1">MONGODB_URI</code> and{" "}
          <code className="rounded bg-pill px-1">MONGODB_DB</code> are valid in the API
          server&apos;s <code className="rounded bg-pill px-1">.env</code> (MongoDB must be
          running).
        </li>
        <li>
          Start API:{" "}
          <code className="rounded bg-pill px-1">cd quadrato-cargo/server && npm run dev</code>{" "}
          (or <code className="rounded bg-pill px-1">cd server && npm run dev</code> if you use
          the repo-root server folder).
        </li>
        <li>
          Start Next app from <code className="rounded bg-pill px-1">quadrato-cargo</code> and
          restart it after any <code className="rounded bg-pill px-1">.env.local</code> change.
        </li>
      </ul>
      <p className="mt-6 text-sm">
        <Link href="/admin/dashboard" className="text-teal hover:underline">
          Try again
        </Link>
      </p>
    </div>
  );
}
