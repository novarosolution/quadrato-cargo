import type { Metadata } from "next";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { ContactForm } from "./Contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Quadrato Cargo for pickup support, shipment queries, and pricing quotes.",
};

export default function ContactPage() {
  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title="Talk to dispatch"
        description="Route, timing, and quote — send details in the form."
      />

      <section className="page-section">
        <Container>
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h2 className="font-display text-lg font-semibold text-ink">Dispatch</h2>
              <p className="mt-2 text-sm text-muted">
                Form is fastest — route, service, and contact in one go.
              </p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="panel-card">
                  <dt className="font-medium text-ink">Phone</dt>
                  <dd className="mt-1 text-muted">+1 (555) 010-0199</dd>
                </div>
                <div className="panel-card">
                  <dt className="font-medium text-ink">Hours</dt>
                  <dd className="mt-1 text-muted">Mon–Fri 7:00–19:00</dd>
                </div>
                <div className="panel-card">
                  <dt className="font-medium text-ink">After hours</dt>
                  <dd className="mt-1 text-muted">Use the number on your booking confirmation.</dd>
                </div>
              </dl>
            </div>
            <div className="panel-card shadow-2xl shadow-black/35 lg:col-span-3 lg:p-10">
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
