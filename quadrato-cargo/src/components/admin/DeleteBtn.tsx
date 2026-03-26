"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  label: string;
  action: () => Promise<void>;
  /** After delete, navigate here (e.g. list page from detail view). */
  redirectAfter?: string;
};

export function DeleteRowButton({ label, action, redirectAfter }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        // Destructive actions always require a synchronous native confirm as last guard.
        if (!window.confirm("Delete this record permanently?")) return;
        startTransition(async () => {
          await action();
          if (redirectAfter) router.push(redirectAfter);
          else router.refresh();
        });
      }}
      className="text-sm text-rose-400 hover:text-rose-300 disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}
