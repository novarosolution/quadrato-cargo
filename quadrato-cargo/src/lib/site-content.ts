import { Clock, Globe2, ShieldCheck, Truck, type LucideIcon } from "lucide-react";

export const homeHeroCardData = [
  {
    label: "Book with PIN",
    status: "Instant or scheduled pickup at your postal code",
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
    status: "Consignment number · QR slip on delivery receipt",
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
    title: "~10 minutes to your PIN",
    body: "For instant collection, we target reaching your pickup PIN or address in about 10 minutes where the area is serviceable — traffic, access, and backend dispatch capacity affect every job.",
    Icon: Clock
  },
  {
    title: "International at your doorstep",
    body: "Customers book out-of-country courier from home or work. Our backend assigns logistics staff for collection, then manages paperwork, export, customs, and handoff to the associated carrier — you don’t see which partner in the early stage.",
    Icon: Globe2
  },
  {
    title: "Consignment & QR receipt",
    body: "After our field team accepts your parcel you get a consignment number. Tracking is updated manually at first; your delivery receipt is built for a QR-oriented slip so status can be pulled by scan (like many utility bills).",
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
    title: "Book with PIN or postal code",
    body: "Choose instant collection or schedule a date and time. Enter pickup and delivery addresses — international bookings include full sender, recipient, and parcel details."
  },
  {
    step: "2",
    title: "Backend assigns logistics staff",
    body: "If your location is deliverable for pickup, our team dispatches field staff to collect at your PIN. We then handle the shipment manually until it is handed to the partner courier company."
  },
  {
    step: "3",
    title: "Consignment number & onward",
    body: "Once the parcel is accepted in the field, you receive a consignment number. Tracking records are maintained manually at the start; your receipt supports QR-based status lookup."
  }
];

export const homeHeroStatData = [
  { value: "~10 min", label: "Pickup target (serviceable PINs)" },
  { value: "PIN + schedule", label: "Instant or booked window" },
  { value: "QR receipt", label: "Scan-friendly slip" }
];

export const homeHeroCallToActionData = [
  { href: "/public/register", label: "Create free account", kind: "primary" as const },
  { href: "/public/book", label: "Book courier", kind: "secondary" as const },
  { href: "/public/contact", label: "Get a quote", kind: "secondary" as const },
  { href: "/public/service", label: "Services", kind: "secondary" as const }
];
