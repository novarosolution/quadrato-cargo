import Link from "next/link";

export function AdminDatabaseError({ message }: { message: string }) {
  const isApiConnection =
    message.toLowerCase().includes("cannot connect") ||
    message.toLowerCase().includes("fetch") ||
    message.toLowerCase().includes("econnrefused");
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-ink">
      <h1 className="font-display text-xl font-semibold text-ink">
        Admin data is unavailable
      </h1>
      <p className="mt-3 text-sm text-muted">
        The admin page could not load data from backend. Fix the connection and
        refresh this page.
      </p>
      {isApiConnection ? (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-ink">
          Backend API is not reachable from frontend. Start the server in{" "}
          <code className="rounded bg-pill px-1 text-xs">/server</code> and verify{" "}
          <code className="rounded bg-pill px-1 text-xs">NEXT_PUBLIC_API_BASE_URL</code>{" "}
          in frontend env points to the same port.
        </p>
      ) : null}
      <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-canvas/80 p-4 text-xs text-rose-300">
        {message}
      </pre>
      <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-muted">
        <li>
          Ensure backend <code className="rounded bg-pill px-1">MONGODB_URI</code> and{" "}
          <code className="rounded bg-pill px-1">MONGODB_DB</code> are valid in{" "}
          <code className="rounded bg-pill px-1">server/.env</code>.
        </li>
        <li>
          Start backend with{" "}
          <code className="rounded bg-pill px-1">cd /Users/kuldip/2\ day/server && npm run dev</code>.
        </li>
        <li>
          Restart frontend after env changes:{" "}
          <code className="rounded bg-pill px-1">cd /Users/kuldip/2\ day/Quadrato\ Cargo && npm run dev</code>.
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
