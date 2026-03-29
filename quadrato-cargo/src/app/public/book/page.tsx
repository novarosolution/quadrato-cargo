import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/Wrap";
import { BookCourierForm } from "./Courierftsx";

function BookFormFallback() {
  return (
    <div
      className="panel-card animate-pulse space-y-4 border border-border p-6"
      aria-hidden
    >
      <div className="h-4 w-1/3 rounded bg-pill" />
      <div className="h-10 w-full rounded-xl bg-pill" />
      <div className="h-10 w-full rounded-xl bg-pill" />
      <div className="h-12 w-40 rounded-full bg-pill" />
    </div>
  );
}

export const metadata: Metadata = {
  title: "Book Courier",
  description:
    "Book domestic or international courier with instant or scheduled pickup.",
};

export default function BookCourierPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border page-section-compact">
        <div
          className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-teal/10 blur-[80px]"
          aria-hidden
        />
        <Container className="relative">
          <p className="section-eyebrow">Book a shipment</p>
          <h1 className="mt-3 max-w-4xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Book courier pickup at your doorstep
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">
            Choose domestic or international shipment, fill sender and recipient
            details, and submit your parcel request in a few steps.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-muted-soft">
            Instant and scheduled pickup options are available based on serviceability.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-border-strong bg-surface-elevated/70 px-3 py-1.5 text-xs font-semibold text-ink">
              Doorstep pickup
            </span>
            <span className="rounded-full border border-border-strong bg-surface-elevated/70 px-3 py-1.5 text-xs font-semibold text-ink">
              Domestic & international
            </span>
            <span className="rounded-full border border-border-strong bg-surface-elevated/70 px-3 py-1.5 text-xs font-semibold text-ink">
              Live tracking updates
            </span>
          </div>
        </Container>
      </section>

      <section className="page-section-compact">
        <Container className="max-w-3xl">
          <Suspense fallback={<BookFormFallback />}>
            <BookCourierForm />
          </Suspense>
          <p className="mt-10 text-center text-sm text-muted">
            Questions first?{" "}
            <Link href="/public/contact" className="font-semibold text-teal hover:underline">
              Contact dispatch
            </Link>
          </p>
        </Container>
      </section>
    </div>
  );
}
