import {
  Boxes,
  Briefcase,
  CalendarClock,
  CircleCheck,
  Clock,
  Globe2,
  Headphones,
  MapPin,
  Package,
  PackageSearch,
  Phone,
  Route,
  ShieldCheck,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";

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

/** Services page — grid cards */
export const servicesPageCards: Array<{
  title: string;
  body: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Instant collection",
    body: "Request pickup now; we dispatch where your area is serviceable.",
    Icon: Zap,
  },
  {
    title: "Scheduled pickup",
    body: "Pick a date and window; we align collection to it.",
    Icon: CalendarClock,
  },
  {
    title: "International",
    body: "Cross-border moves with docs, transit, and carrier handoff.",
    Icon: Globe2,
  },
  {
    title: "Tracking",
    body: "Milestones in the tracking flow so you can follow progress.",
    Icon: PackageSearch,
  },
  {
    title: "Delivery confirmation",
    body: "Final status and references kept for support and records.",
    Icon: CircleCheck,
  },
  {
    title: "Business logistics",
    body: "Cargo, lane pricing, and standard ops for business flows.",
    Icon: Briefcase,
  },
];

/** Pricing — coverage zone cards */
export const pricingZoneCards: Array<{
  name: string;
  range: string;
  note: string;
  Icon: LucideIcon;
}> = [
  {
    name: "Instant pickup",
    range: "ZIP / postal codes with fast dispatch",
    note: "Urgent collection.",
    Icon: Zap,
  },
  {
    name: "Scheduled coverage",
    range: "Booked windows, wider city",
    note: "Distance, window, and vehicle affect price.",
    Icon: MapPin,
  },
  {
    name: "International & cargo",
    range: "Cross-border and heavy",
    note: "Compliance and handling stages included.",
    Icon: Globe2,
  },
];

export const pricingWeightBands: Array<{ label: string; hint: string; Icon: LucideIcon }> = [
  { label: "Document / small parcel", hint: "Up to ~5 kg, hand carry", Icon: Package },
  { label: "Standard cargo", hint: "Cartons, totes, midsize items", Icon: Truck },
  { label: "Pallet / tail-lift", hint: "Skids, bulky equipment", Icon: Boxes },
];

/** How it works — ordered steps */
export const howItWorksSteps: Array<{
  title: string;
  body: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Book",
    body: "Sender, recipient, parcel details. Instant or scheduled pickup; we check serviceability first.",
    Icon: CalendarClock,
  },
  {
    title: "Pickup assigned",
    body: "We assign staff and run scheduled windows as you selected.",
    Icon: Truck,
  },
  {
    title: "Tracking ID",
    body: "After acceptance you get a reference; track with booking or tracking ID on the site.",
    Icon: PackageSearch,
  },
  {
    title: "In transit",
    body: "Sorting, movement, and partner handoff — international lanes include customs where needed.",
    Icon: Route,
  },
  {
    title: "Delivered",
    body: "Status updates for you and support; tracking stays on the tracking page.",
    Icon: CircleCheck,
  },
];

/** Contact sidebar — dispatch info */
export const contactDispatchChannels: Array<{
  id: string;
  label: string;
  value: string;
  Icon: LucideIcon;
}> = [
  { id: "phone", label: "Phone", value: "+1 (555) 010-0199", Icon: Phone },
  { id: "hours", label: "Hours", value: "Mon–Fri 7:00–19:00", Icon: Clock },
  { id: "after", label: "After hours", value: "Use the number on your booking confirmation.", Icon: Headphones },
];
