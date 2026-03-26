import type { Metadata } from "next";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { ContactForm } from "./Contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Quadrato Cargo — international courier at your doorstep, PIN instant pickup zones, scheduled collection, and quotes.",
};

export default function ContactPage() {
  return (
    <div>
      <PageHero
        eyebrow="Reach us"
        title="Tell us what you are moving"
        description="Share pickup and delivery PINs, lane (domestic or international), and parcel type — we confirm instant-collection eligibility, scheduled options, and pricing, usually the same business day."
      />

      <section className="py-16 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h2 className="font-display text-lg font-semibold text-ink">Dispatch</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                For fastest routing, use the form — it captures addresses and
                time windows in one place. Replace placeholders with your real
                details when you go live.
              </p>
              <dl className="mt-8 space-y-4 text-sm">
                <div className="rounded-2xl border border-border bg-surface-elevated/50 p-5 backdrop-blur-sm">
                  <dt className="font-medium text-ink">Phone</dt>
                  <dd className="mt-1 text-muted">+1 (555) 010-0199</dd>
                </div>
                <div className="rounded-2xl border border-border bg-surface-elevated/50 p-5 backdrop-blur-sm">
                  <dt className="font-medium text-ink">Hours</dt>
                  <dd className="mt-1 text-muted">Mon–Fri 7:00–19:00 local</dd>
                </div>
                <div className="rounded-2xl border border-border bg-surface-elevated/50 p-5 backdrop-blur-sm">
                  <dt className="font-medium text-ink">Emergencies</dt>
                  <dd className="mt-1 text-muted">
                    After-hours line for active jobs — on your booking
                    confirmation.
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-surface-elevated/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-md lg:col-span-3 lg:p-10">
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
