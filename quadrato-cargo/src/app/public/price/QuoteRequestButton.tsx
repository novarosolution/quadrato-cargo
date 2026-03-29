"use client";

import { useState } from "react";

export function QuoteRequestButton() {
  const [loading, setLoading] = useState(false);

  async function handleQuoteRequest() {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    window.location.assign("/public/contact");
  }

  if (loading) {
    return (
      <div className="mt-6 w-full max-w-xs animate-pulse space-y-2">
        <div className="h-4 w-40 rounded bg-border/70" />
        <div className="h-12 w-full rounded-2xl bg-border/70" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleQuoteRequest()}
      className="btn-primary mt-6 inline-flex h-12 items-center justify-center rounded-2xl border border-teal/70 bg-teal px-8 text-sm font-semibold text-slate-950 shadow-lg shadow-teal/20 transition hover:-translate-y-0.5 hover:bg-teal/90"
    >
      Request a quote
    </button>
  );
}
