/**
 * Agency hub — all user-facing strings and status templates in one place.
 * Update copy here; components should import from this module instead of hardcoding.
 */

export const agencyMeta = {
  layoutTitle: "Agency hub",
  /** Default when no template */
  layoutDefaultTitle: "Agency hub",
  pageTitleIntake: "Bookings",
  pageTitleBooking: "Manage booking",
  pageTitleHub: "Hub profile",
  pageTitleHandover: "Handover",
  pageTitleGuide: "Guide",
} as const;

export const agencyDefaults = {
  /** When the user has not set a display name */
  navDisplayName: "Agency partner",
  /** Fallback in tables / job context */
  hubDisplayName: "Your agency hub",
} as const;

/** Nav + shared labels */
export const agencyNavCopy = {
  phonePrefix: "Phone ·",
} as const;

/**
 * All agency area routes — used by header tabs; edit here to rename or reorder sections.
 */
export const agencySections = [
  {
    id: "bookings" as const,
    href: "/agency",
    label: "Bookings",
    shortHint: "Assigned jobs",
  },
  {
    id: "hub" as const,
    href: "/agency/hub",
    label: "Hub",
    shortHint: "Your hub details",
  },
  {
    id: "handover" as const,
    href: "/agency/handover",
    label: "Handover",
    shortHint: "Reference + OTP",
  },
  {
    id: "guide" as const,
    href: "/agency/guide",
    label: "Guide",
    shortHint: "How the portal works",
  },
] as const;

export type AgencySectionId = (typeof agencySections)[number]["id"];

export const agencyIntakePageCopy = {
  pageEyebrow: "Agency portal",
  headerTitle: "Your bookings",
  headerLead: "Search, expand a row for quick edits, or open full page for the full workspace.",
  bookingsSectionBlurb: "Filter by status or reference. Handover OTP is on each job or under Handover.",
  footerPickupPrefix: "Courier app:",
  footerPickupLinkLabel: "Open courier portal",
} as const;

/** Labels for read-only shipment summary in job controls (edit in one place). */
export const agencyShipmentSummaryLabels = {
  contents: "Contents",
  weightKg: "Weight (kg)",
  dimensionsCm: "Dimensions (cm)",
  dimensions: "Dimensions",
  declaredValue: "Declared value",
  senderPhone: "Sender phone",
  recipientPhone: "Recipient phone",
  senderAddress: "Sender address",
  recipientAddress: "Recipient address",
} as const;

/** Courier / pickup extras block on timeline panel */
export const agencyCourierContextLabels = {
  pickupPreference: "Pickup preference",
  pickupInstructions: "Courier / pickup instructions",
} as const;

/** Timeline & tracker panels — agency booking editor */
export const agencyTimelinePanelCopy = {
  courierPanelTitle: "Courier context",
  courierPanelBlurb: "Read-only — same notes the courier sees.",
  courierNameLabel: "Pickup courier",
  courierRecordIdLabel: "Account id (internal)",
  noCourierYet: "No courier assigned yet.",
  courierNamePending: "Assigned — add display name on courier user in Admin",
  staffPreviewTitle: "Full tracker preview (staff)",
  staffPreviewBlurbInternational: "Staff view of all 12 steps (customers see a shorter track).",
  staffPreviewBlurbDomestic: "Staff view of domestic steps (matches public track layout).",
  currentStepTitle: "Current timeline step",
  currentStepBlurbBefore: "What customers see on Track for today’s status (",
  currentStepBlurbAfterMode: " step ",
  currentStepBlurbAfterIndex:
    "). Edit below to fill missing copy or override admin defaults — saves apply on public tracking immediately.",
  cardTimePrefix: "Card time:",
  allStepsToggle: "All timeline steps",
  allStepsIntro: "Expand a step to edit title, location, hint, and time. Each step has its own Save.",
  stepHeading: "Step",
  currentStatusBadge: "· current status",
  previewPublicToggle: "Preview as on public Track",
  /** Full booking page: main timeline workspace */
  pageWorkspaceSectionTitle: "All timeline steps",
  pageWorkspaceSectionIntro: "Each row maps to public Track. Teal highlights the current status step.",
  stepFormDefaultsLead: "Site defaults when empty:",
  stepFormCardTitleLabel: "Card title",
  stepFormLocationLabel: "Location line",
  stepFormHintLabel: "Hint",
  stepFormCardTimeLabel: "Card time (optional)",
  stepFormSavePending: "Saving…",
  stepFormSaveButton: "Save step",
  stepFormFooter: "Clear fields to fall back to automatic copy on public Track.",
} as const;

/** Dedicated /agency/bookings/[id] workspace */
export const agencyBookingDetailPageCopy = {
  backToBookings: "All bookings",
  headerEyebrow: "Booking",
  headerDescription:
    "Work in three steps: handover, then status & customer message, then timeline cards one at a time. Use Back and Next so nothing is buried in one long page.",
  guideLinkLabel: "How this works",
  guideHref: "/agency/guide#workspace",
} as const;

/** Step labels for the full-page booking tracking wizard */
export const agencyTrackingWizardCopy = {
  progressLabel: "Tracking workflow",
  stepHandover: "Handover",
  stepHandoverHint: "OTP and hub details",
  stepUpdates: "Status & message",
  stepUpdatesHint: "One save for agency status + customer text",
  stepTimeline: "Timeline",
  stepTimelineHint: "Courier, then each Track card, then preview",
  back: "Back",
  next: "Next",
  nextToUpdates: "Continue to status & message",
  nextToTimeline: "Continue to timeline",
  finishTimeline: "Finish",
  handoverRequiredForNext: "Accept handover with the OTP to continue.",
  wizardStepOf: (current: number, total: number) => `Step ${current} of ${total}`,
  timelineSubstepOf: (current: number, total: number) => `Timeline ${current} of ${total}`,
  timelineSubCourier: "Courier & pickup context",
  timelineSubStage: "Edit Track card",
  timelineSubPreview: "Full customer preview",
} as const;

export const agencyHubPageCopy = {
  pageEyebrow: "Agency portal",
  headerTitle: "Hub profile",
  headerBlurb: "Name, address, and city used on customer tracking. One save updates all fields.",
  guideLinkLabel: "What customers see",
  guideHref: "/agency/guide#hub",
} as const;

/** Hub edit panel + sidebar — edit strings in one place */
export const agencyHubFormCopy = {
  bulkSaveHint: "One Save updates every field below.",
  panelTitle: "Hub details",
  panelSubtitle: "Keep hub city accurate — it appears on public timeline routes.",
} as const;

export const agencyHandoverPageCopy = {
  pageEyebrow: "Agency portal",
  headerTitle: "Handover",
  headerBlurb: "Reference + 6-digit courier OTP — same as Accept & open on a booking row.",
  formPanelTitle: "Verify handover",
  formPanelSubtitle: "Enter the reference, then the OTP from the courier.",
  guideLinkLabel: "Handover tips",
  guideHref: "/agency/guide#handover",
} as const;

/** Consolidated help — linked from booking, hub, and handover pages. */
export const agencyGuidePageCopy = {
  pageEyebrow: "Agency portal",
  headerTitle: "Guide",
  headerBlurb: "Everything you need for day-to-day work in one place.",
  backBookingsLabel: "Bookings",
  backBookingsHref: "/agency",
  sections: [
    {
      id: "bookings-list",
      title: "Bookings list",
      bullets: [
        "Search by reference, sender, recipient, or customer update text.",
        "Expand a row for OTP, status, and message without leaving the list.",
        "Use Full page when you need the full timeline editor.",
      ] as const,
    },
    {
      id: "workspace",
      title: "Full booking page",
      bullets: [
        "Three steps: Handover → Status & message → Timeline. Use Back and Next so each part stays focused.",
        "Status & message: one save applies agency status, international macro (if shown), and customer text.",
        "Timeline: courier context first, then each public Track card one screen at a time (each has its own Save), then a full preview.",
        "After handover, a Save shortcut can stay at the bottom on the status step.",
        "Only admin can change the assigned courier.",
      ] as const,
    },
    {
      id: "handover",
      title: "Handover",
      bullets: [
        "Use the exact reference (tracking ID or booking id) shown on the label.",
        "The 6-digit OTP is from the courier for this booking only.",
        "OTP auto-verifies when all digits are entered; you can still tap Verify.",
      ] as const,
    },
    {
      id: "hub",
      title: "Hub profile",
      bullets: [
        "Hub name and city appear on customer tracking for linked bookings.",
        "Street address helps couriers; city drives timeline route text on Track.",
        "Save once after any change — you will see confirmation under the button.",
      ] as const,
    },
  ] as const,
} as const;

export const agencyIntakeTableCopy = {
  emptyState: "No agency-assigned bookings yet. Ask admin to assign your agency on the booking.",
  emptyFilterState: "No bookings match your search or status filter.",
  columns: {
    bookedUtc: "Booked (UTC)",
    reference: "Reference",
    route: "Route",
    shipment: "Shipment",
    status: "Status",
    customerUpdate: "Customer update",
    actions: "Actions",
  },
  fromPrefix: "From:",
  toPrefix: "To:",
  acceptOpen: "Accept & open",
  open: "Open",
  close: "Close",
  openFullPage: "Full page",
  openFullPageTitle: "Open full booking workspace in a dedicated page",
  filterSearchLabel: "Search",
  filterSearchPlaceholder: "Reference, sender, recipient, or customer update…",
  filterStatusLabel: "Status",
  filterStatusAll: "All statuses",
  panelTitle: "Quick workspace",
  panelBlurb: "OTP → status → customer message. Use Full page for timeline editing.",
  closePanel: "Close panel",
} as const;

export const agencyProfileCopy = {
  blockIdentity: "Hub name",
  blockIdentityHint: "This label appears to customers when a booking is tied to your hub.",
  blockLocation: "Address",
  blockLocationHint:
    "Full street address for couriers and your team. It is not shown on the public Track page — only the hub city below appears there.",
  blockContact: "Phone",
  blockContactHint: "Operations or dispatch line for this hub.",
  nameLabel: "Agency / hub name",
  nameHint: "Shown to customers on tracking when this account is linked to a booking.",
  addressLabel: "Hub address",
  addressPlaceholder: "Street, city, postal code, country",
  cityLabel: "Hub city (public tracking)",
  cityHint:
    "Customers see this city on the shipment timeline (e.g. linehaul from your city to the main hub). Use the same city name you use on bookings.",
  cityPlaceholder: "e.g. Rajkot",
  phoneLabel: "Operations phone",
  savePending: "Saving…",
  save: "Save hub details",
  saveFooterHint: "Changes apply to new tracking views after save.",
} as const;

export const agencyHandoverFormCopy = {
  stepReferenceTitle: "Step 1 — Reference",
  stepReferenceHint: "Booking or tracking id for this handover.",
  stepOtpTitle: "Step 2 — Courier OTP",
  referenceLabel: "Reference (Tracking ID or booking ID)",
  referencePlaceholder: "QC-2026-0001 or booking id",
  otpLabel: "Agency handover OTP",
  otpPlaceholder: "Enter OTP",
  otpHint: "OTP is booking-specific. Enter 6 digits to auto-verify.",
  submitPending: "Verifying...",
  submit: "Verify handover & start agency job",
  resultReference: "Reference:",
  resultRoute: "Route:",
  resultStatus: "Status:",
  resultSender: "Sender:",
  resultRecipient: "Recipient:",
  resultPartiesTitle: "Parties",
} as const;

export const agencyLogoutCopy = {
  pending: "Signing out...",
  label: "Sign out",
} as const;

export const AGENCY_ALLOWED_STATUSES = [
  "agency_processing",
  "in_transit",
  "out_for_delivery",
  "delivery_attempted",
  "on_hold",
  "delivered",
] as const;

export type AgencyAllowedStatus = (typeof AGENCY_ALLOWED_STATUSES)[number];

/** Prefilled customer-facing lines per status (edit [brackets] before sending). */
export const AGENCY_STATUS_UPDATE_TEMPLATES: Partial<
  Record<AgencyAllowedStatus, string[]>
> = {
  agency_processing: [
    "Received at agency hub. Sorting and dispatch preparation in progress.",
    "Parcel logged at agency. Next scan: outbound to destination region.",
  ],
  in_transit: [
    "In transit to destination hub. ETA update: [date / time].",
    "Shipment en route to destination city. Tracking will refresh after arrival scan.",
    "Departed origin facility; in network transit — no action needed from recipient yet.",
  ],
  out_for_delivery: [
    "Out for delivery today. Courier may contact recipient if access or OTP is required.",
    "With delivery associate for final mile. Expected attempt today.",
  ],
  delivery_attempted: [
    "Delivery attempted — [reason]. We will retry / await recipient instruction.",
    "Could not complete delivery. Recipient can contact support with Tracking ID for reschedule.",
  ],
  on_hold: [
    "Temporarily on hold: [reason]. We will update when movement resumes.",
    "Awaiting [documents / customs / recipient response]. Shipment is safe at our facility.",
  ],
  delivered: [
    "Delivered successfully to recipient. Thank you for using Quadrato Cargo.",
    "Delivery completed. Signed / handed over as per local process.",
  ],
};

/** Extra templates when route is international (customs / linehaul wording). */
export const AGENCY_INTERNATIONAL_STATUS_TEMPLATES: Partial<
  Record<AgencyAllowedStatus, string[]>
> = {
  agency_processing: [
    "International shipment received at export hub. Commercial invoice and customs paperwork under review.",
    "Parcel accepted for international processing; awaiting export clearance / flight allocation.",
  ],
  in_transit: [
    "International linehaul — departed origin country; in transit toward destination region. ETA: [date].",
    "Air / sea segment in progress. Tracking updates after arrival at destination gateway.",
    "Export cleared; shipment moving on international network to recipient country.",
  ],
  out_for_delivery: [
    "Cleared destination customs; out for local delivery. Duties/taxes: [if applicable].",
    "Final mile in destination country — courier may contact recipient for ID or duties.",
  ],
  on_hold: [
    "On hold at border / customs: [reason]. Recipient may need to provide documents or pay duties.",
    "Awaiting destination customs release or airline handling — shipment is secure.",
  ],
  delivered: [
    "International delivery completed — handed over in destination country per local procedure.",
  ],
};

export const agencyJobControlsCopy = {
  quickUpdatesHeading: "Quick updates",
  quickUpdatesIntro:
    "Handover, status, customer message (and international macro if applicable) save with the button below.",
  timelineWorkspaceHeading: "Timeline",
  timelineWorkspaceIntro: "Per-step edits for public Track — save each card separately.",
  stickySaveHint: "Save status & message",
  shipmentDetailsTitle: "Shipment",
  shipmentDetailsBlurb: "From the booking (read-only). Customer-facing text is in Quick updates.",
  step1Title: "Accept handover",
  step1Blurb: "6-digit OTP from the courier — completes automatically or use the button.",
  otpFieldLabel: "Agency OTP",
  otpPlaceholder: "••••••",
  accepting: "Accepting…",
  acceptHandover: "Accept handover",
  handoverDone:
    "Handover accepted — processing under your hub. Status updates keep this booking linked to your agency account.",
  addressMissing:
    'Add your hub address under Hub profile (/agency/hub) so it shows here and stays consistent on every job.',
  trackingCityLabel: "City on public tracking:",
  trackingCitySuffix: " — customers see this city on the timeline, not your full street address.",
  trackingCityMissing:
    "Add your hub city under Hub profile so domestic and international timeline routes show the correct origin (e.g. Rajkot → Quadrato Cargo).",
  step2Title: "Status & customer message",
  bookingStatusPrefix: "Booking status (from system / admin):",
  internationalBadge: "International",
  statusOutsideAgencyMenu:
    "This step is before or outside the agency menu; after you accept handover, choose the next status below to align with tracking.",
  cancelledMessage: {
    beforeStrong: "This booking is ",
    strong: "cancelled",
    afterStrong: ". Status updates are managed by admin only.",
  },
  mustAcceptFirst:
    "Accept the courier handover (Step 1) before saving status or customer updates. That keeps milestones in order and avoids overwriting the booking by mistake.",
  agencyStatusLabel: "Agency status",
  intlStageLabel: "International Track — active macro card",
  intlStageAuto: "Auto (from shipment status)",
  intlStageHint: "0–11 = timeline cards. Use Auto unless you need a fixed macro.",
  customerUpdateLabel: "Customer update (tracking + courier-visible context)",
  customerUpdatePlaceholder:
    "Tap a template or write instructions for the customer. Replace [brackets] with real details before saving.",
  savePending: "Saving…",
  save: "Save status & customer update",
} as const;
