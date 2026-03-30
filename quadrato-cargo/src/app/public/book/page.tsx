import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { Container } from "@/components/Wrap";
import { BookCourierForm } from "./Courierftsx";

function BookFormFallback() {
  return (
    <div aria-hidden>
      <PublicCard className="animate-pulse space-y-4">
      <div className="h-4 w-1/3 rounded bg-pill" />
      <div className="h-10 w-full rounded-xl bg-pill" />
      <div className="h-10 w-full rounded-xl bg-pill" />
      <div className="h-12 w-40 rounded-full bg-pill" />
      </PublicCard>
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
      <PublicPageSection
        compact
        className="relative overflow-hidden border-b border-border !py-12 sm:!py-16"
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-teal/10 blur-[80px]"
          aria-hidden
        />
        <Container className="relative">
          <p className="section-eyebrow">Book</p>
          <h1 className="mt-2 max-w-2xl font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Courier pickup at your door
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
            Domestic or international — instant or scheduled pickup in a few steps.
          </p>
        </Container>
      </PublicPageSection>

      <PublicPageSection compact>
        <Container className="max-w-3xl">
          <Suspense fallback={<BookFormFallback />}>
            <PublicCard className="sm:p-6 md:p-7">
              <BookCourierForm />
            </PublicCard>
          </Suspense>
          <p className="mt-8 text-center text-sm text-muted">
            <Link href="/public/contact" className="font-medium text-teal hover:underline">
              Contact dispatch
            </Link>
          </p>
        </Container>
      </PublicPageSection>
    </div>
  );
}
