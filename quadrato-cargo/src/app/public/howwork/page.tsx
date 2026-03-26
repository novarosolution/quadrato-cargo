import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Quadrato Cargo books international courier at your doorstep — PIN-based instant or scheduled pickup, backend dispatch, consignment numbers, and QR receipts.",
};

const steps = [
  {
    title: "You book with your PIN or postal code",
    body: "Online, pick instant collection or a scheduled date and time. Enter pickup and delivery details; for international shipments include accurate contents and addresses for customs.",
    detail:
      "If the pickup location is serviceable, our backend assigns logistics staff — otherwise we coordinate alternatives with you.",
  },
  {
    title: "Field team collects the parcel",
    body: "Logistics staff travel to your PIN or address. For instant requests we target about 10 minutes where operations allow; scheduled jobs follow the window you chose.",
    detail:
      "Weather, access, and volume can add time — we communicate slippage when we see it.",
  },
  {
    title: "Acceptance & consignment number",
    body: "When our team accepts the courier in the field, you receive a consignment number. Partner carrier identity is not shown to the customer in the initial stage.",
    detail:
      "Tracking records are maintained manually at first; later phases can connect to carrier APIs if you choose.",
  },
  {
    title: "Backend handles until partner handoff",
    body: "Operations manage paperwork, export, customs, and handoff to the associated courier company for the next leg — especially for out-of-country lanes.",
    detail:
      "Other parts of the platform follow traditional logistics management comparable to other market sites.",
  },
  {
    title: "QR delivery receipt",
    body: "On delivery, customers can receive a QR-oriented slip (similar in spirit to Gujarat Gas / Adani Gas style bills) so scanning pulls the latest status without logging into a portal.",
    detail:
      "Exact QR payload and branding are configured when you connect production printing or customer apps.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <PageHero
        eyebrow="Workflow"
        title="Doorstep booking → field acceptance → consignment"
        description="Customers book courier for international and domestic lanes from their location. We dispatch collection staff to the PIN, issue consignment numbers after acceptance, operate manually until carrier handoff, and support QR-based receipts."
      />

      <section className="py-16 sm:py-24">
        <Container>
          <ol className="space-y-10">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-6 md:flex-row md:gap-12"
              >
                <div className="flex shrink-0 items-start md:w-44">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-teal/70 text-lg font-bold text-slate-950 shadow-lg shadow-teal/25">
                    {i + 1}
                  </span>
                </div>
                <div className="card-interactive flex-1 rounded-2xl border border-border bg-surface-elevated/70 p-6 backdrop-blur-sm md:p-8">
                  <h2 className="font-display text-xl font-semibold text-ink">
                    {step.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                  <p className="mt-5 border-t border-border pt-5 text-sm text-ink/90">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-16 flex flex-col gap-6 rounded-[1.5rem] border border-border bg-gradient-to-br from-surface-elevated to-surface px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <p className="max-w-md text-sm leading-relaxed text-muted">
              See how we zone instant pickup vs scheduled coverage — then brief
              us with your PINs for a written quote.
            </p>
            <Link
              href="/public/price"
              className="btn-primary inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-accent-deep to-accent px-6 py-3 text-sm font-semibold text-white shadow-md shadow-accent/25"
            >
              View pricing
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
