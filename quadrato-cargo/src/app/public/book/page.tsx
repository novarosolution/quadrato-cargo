import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { PublicPageHeader } from "@/components/layout/AppPageHeader";
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
    <div className="stack-page content-full">
      <PublicPageSection
        compact
        className="relative overflow-hidden border-b border-border !py-12 sm:!py-16"
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-teal/10 blur-[80px]"
          aria-hidden
        />
        <Container className="relative">
          <PublicPageHeader
            eyebrow="Book"
            title="Courier pickup at your door"
            description="Domestic or international — instant or scheduled pickup in a few steps."
          />
        </Container>
      </PublicPageSection>

      <PublicPageSection compact>
        <Container className="content-narrow">
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
