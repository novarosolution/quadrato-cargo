import { Clock, Globe2, ShieldCheck, Truck, type LucideIcon } from "lucide-react";

export const homeHeroCardData = [
  {
    label: "Book with ZIP / postal code",
    status: "Instant or scheduled pickup",
    time: "Online",
    tone: "teal" as const,
  },
  {
    label: "Field team",
    status: "Pickup target ~10 min where serviceable",
    time: "~10 min",
    tone: "accent" as const,
  },
  {
    label: "Accepted",
    status: "Tracking ID · QR on receipt",
    time: "Track",
    tone: "muted" as const,
  },
];

export const homeValueStoryData: Array<{
  title: string;
  body: string;
  Icon: LucideIcon;
}> = [
  {
    title: "~10 min to your area",
    body: "Instant collection targets about 10 minutes where we serve; traffic and capacity can vary.",
    Icon: Clock,
  },
  {
    title: "International from home",
    body: "Book cross-border pickup; we handle collection, paperwork, and carrier handoff.",
    Icon: Globe2,
  },
  {
    title: "Tracking ID & QR",
    body: "After acceptance you get a Tracking ID; receipt supports QR status lookup.",
    Icon: ShieldCheck,
  },
  {
    title: "Full logistics",
    body: "Rates, lanes, and operations aligned with standard courier workflows.",
    Icon: Truck,
  },
];

export const homeHeroStatData = [
  { value: "~10 min", label: "Pickup target (serviceable areas)" },
  { value: "Instant + schedule", label: "Collection options" },
  { value: "QR receipt", label: "Scan-friendly slip" },
];

export const homeHeroCallToActionData = [
  { href: "/public/register", label: "Create account", kind: "primary" as const },
  { href: "/public/book", label: "Book now", kind: "secondary" as const },
  { href: "/public/contact", label: "Get a quote", kind: "secondary" as const },
  { href: "/public/service", label: "Services", kind: "secondary" as const },
];
