import { Clock, Globe2, ShieldCheck, Truck, type LucideIcon } from "lucide-react";

export const homeHeroCardData = [
  {
    label: "Book with Postal Code / ZIP",
    status: "Instant or scheduled pickup in your area",
    time: "Online",
    tone: "teal" as const
  },
  {
    label: "Field team",
    status: "Logistics staff to your door — target ~10 min where serviceable",
    time: "~10 min",
    tone: "accent" as const
  },
  {
    label: "Accepted",
    status: "Tracking ID · QR slip on delivery receipt",
    time: "Manual track",
    tone: "muted" as const
  }
];

export const homeValueStoryData: Array<{
  title: string;
  body: string;
  Icon: LucideIcon;
}> = [
  {
    title: "~10 minutes to your Postal Code / ZIP",
    body: "For instant collection, we target reaching your pickup postal code / ZIP area in about 10 minutes where service is available — traffic, access, and dispatch capacity can affect timing.",
    Icon: Clock
  },
  {
    title: "International at your doorstep",
    body: "Customers book out-of-country courier from home or work. Our backend assigns logistics staff for collection, then manages paperwork, export, customs, and handoff to the associated carrier — you don’t see which partner in the early stage.",
    Icon: Globe2
  },
  {
    title: "Tracking ID & QR receipt",
    body: "After our field team accepts your parcel you get a Tracking ID. Tracking is updated manually at first; your delivery receipt supports QR-based status lookup.",
    Icon: ShieldCheck
  },
  {
    title: "Traditional logistics, too",
    body: "Beyond the doorstep collection story, the rest of the site follows familiar logistics management — rates, lanes, and operations comparable to what you see elsewhere in the market.",
    Icon: Truck
  }
];

export const homeProcessStepData = [
  {
    step: "1",
    title: "Book with Postal Code / ZIP",
    body: "Choose instant collection or schedule a date and time. Enter pickup and delivery addresses — international bookings include full sender, recipient, and parcel details."
  },
  {
    step: "2",
    title: "Backend assigns logistics staff",
    body: "If your location is deliverable for pickup, our team dispatches field staff to collect at your postal code / ZIP area. We then handle the shipment manually until handoff to the partner courier company."
  },
  {
    step: "3",
    title: "Tracking ID & onward",
    body: "Once the parcel is accepted in the field, you receive a Tracking ID. Tracking records are maintained manually at the start; your receipt supports QR-based status lookup."
  }
];

export const homeHeroStatData = [
  { value: "~10 min", label: "Pickup target (serviceable postal code / ZIP areas)" },
  { value: "Postal + schedule", label: "Instant or booked window" },
  { value: "QR receipt", label: "Scan-friendly slip" }
];

export const homeHeroCallToActionData = [
  { href: "/public/register", label: "Create free account", kind: "primary" as const },
  { href: "/public/book", label: "Book Now", kind: "secondary" as const },
  { href: "/public/contact", label: "Get a quote", kind: "secondary" as const },
  { href: "/public/service", label: "Services", kind: "secondary" as const }
];
