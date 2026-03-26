import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Wrap";
import { BookCourierForm } from "./Courierftsx";

export const metadata: Metadata = {
  title: "Book courier",
  description:
    "Book domestic or international courier with PIN-based instant or scheduled pickup. Backend-led collection, consignment number after acceptance, QR-oriented receipt.",
};

export default function BookCourierPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-teal/10 blur-[80px]"
          aria-hidden
        />
        <Container className="relative py-12 sm:py-16 lg:py-20">
          <p className="section-eyebrow">Book a shipment</p>
          <h1 className="mt-3 max-w-4xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Book courier — domestic or international at your doorstep
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">
            Choose{" "}
            <strong className="font-medium text-ink">instant collection</strong>{" "}
            (we target ~10 minutes to your PIN where serviceable) or a{" "}
            <strong className="font-medium text-ink">scheduled pickup</strong>{" "}
            with date and time. Enter sender, recipient, and parcel details. If
            your location is deliverable, our backend dispatches logistics staff;
            after acceptance you receive a{" "}
            <strong className="font-medium text-ink">consignment number</strong>.
            International shipments are handled manually through export, customs,
            and handoff to the partner carrier (carrier name hidden initially;
            tracking entered manually at first). Delivery receipts support{" "}
            <strong className="font-medium text-ink">QR-based status</strong>{" "}
            (similar to utility bills).
          </p>
          <ul className="mt-6 max-w-3xl list-inside list-disc space-y-2 text-sm text-muted-soft">
            <li>You submit the booking with collection mode, PIN, and full addresses.</li>
            <li>
              Operations verify serviceability and may contact you for documents
              or slot confirmation.
            </li>
            <li>
              Field staff collect from your pickup PIN; traditional logistics
              flows apply elsewhere on the platform.
            </li>
            <li>
              For international, we continue until the associated courier company
              receives the shipment; QR slips support customer-facing status.
            </li>
          </ul>
        </Container>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <Container className="max-w-3xl">
          <BookCourierForm />
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
