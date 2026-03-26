"use client";

export function AppSessionProvider({
  children,
}: {
  children: React.ReactNode;
  session?: unknown;
}) {
  // We keep this wrapper to preserve import sites while auth is API-cookie driven.
  return <>{children}</>;
}
