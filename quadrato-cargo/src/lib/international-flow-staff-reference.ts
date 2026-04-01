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
  /** How to apply in tools (status, macro override, note, EDD) */
  staffTip: string;
};

export const INTERNATIONAL_SMART_FEATURES_TIP =
  "Customer Track shows only completed steps plus Latest update (macros 0 through current) — no future Upcoming cards. Open the full 12-step preview below in admin/agency to plan ahead. Per-step time: Card time in the editor; otherwise latest card and macro 0 show a clock. EDD on booking page; public search via consignment or barcode.";

export const INTERNATIONAL_MACRO_STAFF_REFERENCE: InternationalMacroStaffBlock[] = [
  {
    macroIndex: 0,
    sectionLabel: "1 · Pickup stage (Origin – Rajkot)",
    checklist: [
      "Shipment created",
      "Pickup scheduled",
      "Shipment picked up",
      "Picked up – Rajkot",
    ],
    staffTip: "Macro 0. Edit title, map line, description, and time in Track editor (bulk or current card).",
  },
  {
    macroIndex: 1,
    sectionLabel: "2 · Origin processing (Rajkot hub)",
    checklist: [
      "Arrived at origin facility – Rajkot",
      "Shipment processed at origin facility",
      "Departed from facility – Rajkot",
    ],
    staffTip: "Macro 1. Reflect hub scans and departures in copy; optional per-card time.",
  },
  {
    macroIndex: 2,
    sectionLabel: "3 · Domestic transit (Rajkot → Ahmedabad / Mumbai)",
    checklist: [
      "In transit to next facility",
      "Arrived at hub – Ahmedabad",
      "Shipment processed at hub",
      "Departed from hub – Ahmedabad",
    ],
    staffTip: "Macro 2. Name the hub in the location line when known.",
  },
  {
    macroIndex: 3,
    sectionLabel: "4 · Export hub processing (Mumbai / Delhi)",
    checklist: [
      "Arrived at export hub – Mumbai",
      "Shipment received at gateway",
      "Security check completed",
      "Handed over to customs",
    ],
    staffTip: "Macro 3. Airport/gateway names (e.g. AMD) go well in the location override.",
  },
  {
    macroIndex: 4,
    sectionLabel: "5 · Export customs (India)",
    checklist: [
      "Customs clearance in progress (India export)",
      "Customs cleared (India export)",
    ],
    staffTip: "Macro 4. Keep wording aligned with actual clearance state.",
  },
  {
    macroIndex: 5,
    sectionLabel: "6 · Air transit (international movement)",
    checklist: [
      "Handed over to airline",
      "Departed from origin country – India",
      "In transit (air cargo)",
      "Arrived at destination country – USA",
    ],
    staffTip: "Macro 5. Use for flight / lane messaging; optional times per milestone.",
  },
  {
    macroIndex: 6,
    sectionLabel: "7 · Import customs (USA)",
    checklist: [
      "Shipment received at import hub",
      "Customs clearance in progress (USA import)",
      "Customs cleared (USA import)",
    ],
    staffTip: "Macro 6. Import gateway (e.g. LAX) in location when relevant.",
  },
  {
    macroIndex: 7,
    sectionLabel: "8 · Destination processing (USA hub)",
    checklist: [
      "Arrived at destination facility",
      "Shipment processed at destination facility",
      "In transit to delivery location",
    ],
    staffTip: "Macro 7. Agency hub name can appear via assignment + location line.",
  },
  {
    macroIndex: 8,
    sectionLabel: "9a · Last mile – Out for delivery",
    checklist: ["Out for delivery"],
    staffTip: "Macro 8. Match status Out for delivery when appropriate; customer note for OTP / access.",
  },
  {
    macroIndex: 9,
    sectionLabel: "9b · Last mile – Delivery attempted",
    checklist: ["Delivery attempted (if failed)"],
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
    staffTip: "Macro 10. Usually with status On hold; international macro override can pin this card as current.",
  },
  {
    macroIndex: 11,
    sectionLabel: "9c · Delivered",
    checklist: ["Delivered · proof of delivery captured"],
    staffTip: "Macro 11. Set status Delivered when POD is confirmed; clear override when journey is complete.",
  },
];
