import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { PublicPageHeader } from "@/components/layout/AppPageHeader";
import { Container } from "@/components/Wrap";
import { publicUi } from "@/components/public/public-ui";
import { BookCourierForm } from "./Courierftsx";

function BookFormFallback() {
  return (
    <div aria-hidden>
      <div className="book-form-card animate-pulse space-y-6 p-6 sm:p-8 md:p-10">
        <div className="h-4 w-1/3 rounded-md bg-pill" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-pill" />
          ))}
        </div>
        <div className="h-40 w-full rounded-2xl bg-pill" />
        <div className="h-12 w-full rounded-2xl bg-pill" />
        <div className="h-12 max-w-xs rounded-2xl bg-pill" />
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Book Courier",
  description:
    "Book domestic or international courier with instant or scheduled pickup.",
};

const SHORT_STEPS = [
  { n: 1, label: "Route & pickup" },
  { n: 2, label: "Sender" },
  { n: 3, label: "Recipient" },
  { n: 4, label: "Parcel & send" },
] as const;

export default function BookCourierPage() {
  return (
    <div className={publicUi.page}>
      <PublicPageSection
        compact
        className="book-page-hero relative overflow-hidden border-b border-border-strong/40 py-10 sm:py-14"
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-teal/10 blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-accent/8 blur-[80px]"
          aria-hidden
        />
        <Container className="relative z-[1]">
          <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
            <PublicPageHeader
              eyebrow="Book"
              title="Courier pickup at your door"
              description="Four quick steps — route, sender, recipient, then parcel details. Save addresses in your profile to fly through steps 2–3."
            />
          </div>
          <div
            className="mx-auto mt-8 max-w-3xl lg:mx-0"
            aria-labelledby="book-short-method-heading"
          >
            <h2
              id="book-short-method-heading"
              className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-soft lg:text-left"
            >
              At a glance
            </h2>
            <ol className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3 lg:justify-start">
              {SHORT_STEPS.map((item) => (
                <li
                  key={item.n}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border-strong/55 bg-surface-elevated/50 px-3.5 py-2 text-sm text-ink shadow-sm ring-1 ring-teal/5 backdrop-blur-sm"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal/15 text-xs font-bold text-teal tabular-nums"
                    aria-hidden
                  >
                    {item.n}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted sm:text-sm lg:text-left">
              Tip:{" "}
              <Link href="/public/profile#saved-addresses" className={publicUi.link}>
                Saved addresses
              </Link>{" "}
              auto-fill pickup and delivery.{" "}
              <Link href="/public/tsking" className={publicUi.linkQuiet}>
                Track a shipment →
              </Link>
            </p>
          </div>
        </Container>
      </PublicPageSection>

      <PublicPageSection compact className="pb-16 pt-8 sm:pb-20 sm:pt-10">
        <Container className="content-narrow max-w-2xl">
          <Suspense fallback={<BookFormFallback />}>
            <div className="book-form-card overflow-hidden p-6 sm:p-8 md:p-10">
              <BookCourierForm />
            </div>
          </Suspense>
          <nav
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border-strong/40 pt-8 text-center text-sm text-muted"
            aria-label="Related links"
          >
            <Link href="/public/tsking" className={publicUi.link}>
              Track shipment
            </Link>
            <Link href="/public/contact" className={publicUi.link}>
              Contact dispatch
            </Link>
            <Link href="/public/howwork" className={publicUi.linkQuiet}>
              How it works
            </Link>
          </nav>
        </Container>
      </PublicPageSection>
    </div>
  );
}
