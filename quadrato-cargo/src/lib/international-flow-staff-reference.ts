import { siteName } from "@/lib/site";

/**
 * Staff-only reference: maps each international **macro index** (0–11, same as Track cards and
 * `internationalAgencyStage`) to the professional sub-flow checklist. Keeps admin/agency aligned
 * with the product international journey without changing flat step indices in
 * {@link international-tracking-flow}.
 */
export type InternationalMacroStaffBlock = {
  macroIndex: number;
  /** Short heading for UI */
  sectionLabel: string;
  /** Checklist lines shown to staff */
  checklist: string[];
  /** Default customer map line when no per-card override (aligned with live Track hub copy). */
  bulkLocationLine: string;
  /** How to apply in tools (status, macro override, note, EDD) */
  staffTip: string;
};

export const INTERNATIONAL_SMART_FEATURES_TIP =
  "Customers see a simple vertical timeline (completed steps + current); the current row is unbadged, past steps show Completed. Staff preview still shows Latest update / Upcoming labels. Tracker edit sets default copy; overrides replace hub lines. Per-step time optional; macro 0 can use booking time. EDD on booking; public search via consignment or barcode.";

export const INTERNATIONAL_MACRO_STAFF_REFERENCE: InternationalMacroStaffBlock[] = [
  {
    macroIndex: 0,
    sectionLabel: `1 · Pickup stage (${siteName})`,
    checklist: [
      "Shipment created",
      "Pickup scheduled",
      "Shipment picked up",
      "Picked up – origin",
    ],
    bulkLocationLine:
      "Pickup zone (sender city or agency area); with courier: “Courier name · collecting from …”",
    staffTip: "Macro 0. Edit title, map line, description, and time in Tracker edit system (bulk or current card).",
  },
  {
    macroIndex: 1,
    sectionLabel: "2 · Origin processing (assigned agency)",
    checklist: [
      "Arrived at origin facility",
      "Shipment processed at origin facility",
      "Departed from origin facility",
    ],
    bulkLocationLine: "{Agency hub city} origin hub — or agency name + hub if city missing",
    staffTip:
      "Macro 1. Default card title uses the Dispatch-assigned agency display name when set; otherwise the catalog fallback.",
  },
  {
    macroIndex: 2,
    sectionLabel: "3 · Domestic transit (agency hub → main sort hub)",
    checklist: [
      "In transit to next facility",
      "Arrived at main sort hub",
      "Shipment processed at hub",
      "Departed from main sort hub",
    ],
    bulkLocationLine: "{Origin hub city} → {main sort hub from site settings}",
    staffTip:
      "Macro 2. Live Track uses each agency’s hub city plus the site “main sort hub” setting in the default location line.",
  },
  {
    macroIndex: 3,
    sectionLabel: "4 · Export hub processing",
    checklist: [
      "Arrived at export gateway",
      "Shipment received at gateway",
      "Security check completed",
      "Handed over to customs",
    ],
    bulkLocationLine:
      "{Sender country from booking} export gateway — override with airport code when known",
    staffTip:
      "Macro 3. Default map line uses booking sender country; airport/gateway codes go well in overrides.",
  },
  {
    macroIndex: 4,
    sectionLabel: "5 · Export customs (origin)",
    checklist: ["Export customs in progress", "Export customs cleared"],
    bulkLocationLine: "{Sender country} export customs",
    staffTip: "Macro 4. Keep wording aligned with actual clearance state.",
  },
  {
    macroIndex: 5,
    sectionLabel: "6 · Air transit (international movement)",
    checklist: [
      "Handed over to airline",
      "Departed origin country",
      "In transit (air cargo)",
      "Arrived in destination country",
    ],
    bulkLocationLine: "International air cargo ({sender country} → {recipient country}) from booking",
    staffTip: "Macro 5. Route countries come from the booking; use overrides for flight / lane detail.",
  },
  {
    macroIndex: 6,
    sectionLabel: "7 · Import customs (destination)",
    checklist: [
      "Shipment received at import hub",
      "Import customs in progress",
      "Import customs cleared",
    ],
    bulkLocationLine: "{Recipient country} import hub / gateway — add airport code in override when known",
    staffTip: "Macro 6. Import gateway (e.g. LAX) in location when relevant.",
  },
  {
    macroIndex: 7,
    sectionLabel: "8 · Destination processing (import hub)",
    checklist: [
      "Arrived at destination facility",
      "Shipment processed at destination facility",
      "In transit to delivery location",
    ],
    bulkLocationLine: "{Assigned agency} or {recipient country} destination hub",
    staffTip: "Macro 7. Prefers agency name when set; else destination country from booking.",
  },
  {
    macroIndex: 8,
    sectionLabel: "9a · Last mile – Out for delivery",
    checklist: ["Out for delivery"],
    bulkLocationLine: "Recipient area / address — “Out for delivery · recipient area” if anonymized",
    staffTip: "Macro 8. Match status Out for delivery when appropriate; customer note for OTP / access.",
  },
  {
    macroIndex: 9,
    sectionLabel: "9b · Last mile – Delivery attempted",
    checklist: ["Delivery attempted (if failed)"],
    bulkLocationLine: "Recipient area — delivery attempt",
    staffTip: "Macro 9. Use with status Delivery attempted; explain retry in customer note.",
  },
  {
    macroIndex: 10,
    sectionLabel: "10 · Exception / problem status",
    checklist: [
      "Shipment delayed – weather / operational issue",
      "Shipment on hold – customs",
      "Address issue – customer action required",
      "Delivery rescheduled",
    ],
    bulkLocationLine: "Operations / customs / dispatch review",
    staffTip: "Macro 10. Usually with status On hold; international macro override can pin this card as current.",
  },
  {
    macroIndex: 11,
    sectionLabel: "9c · Delivered",
    checklist: ["Delivered · proof of delivery captured"],
    bulkLocationLine: "Recipient · delivery completed",
    staffTip: "Macro 11. Set status Delivered when POD is confirmed; clear override when journey is complete.",
  },
];
