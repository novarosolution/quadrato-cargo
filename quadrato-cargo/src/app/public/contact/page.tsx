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
        eyebrow="Reach us"
        title="Tell us what you are moving"
        description="Share your pickup and delivery details. We will confirm serviceability, timeline, and quote."
      />

      <section className="page-section">
        <Container>
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h2 className="font-display text-lg font-semibold text-ink">Dispatch</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                For faster support, use the form to share route, service type,
                and contact details in one place.
              </p>
              <dl className="mt-8 space-y-4 text-sm">
                <div className="panel-card">
                  <dt className="font-medium text-ink">Phone</dt>
                  <dd className="mt-1 text-muted">+1 (555) 010-0199</dd>
                </div>
                <div className="panel-card">
                  <dt className="font-medium text-ink">Hours</dt>
                  <dd className="mt-1 text-muted">Mon–Fri 7:00–19:00 local</dd>
                </div>
                <div className="panel-card">
                  <dt className="font-medium text-ink">Urgent support</dt>
                  <dd className="mt-1 text-muted">
                    For active jobs after hours, use the number shared in your booking confirmation.
                  </dd>
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
