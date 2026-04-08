/**
 * Courier portal — page copy in one place (same idea as agency-content).
 */

export const courierMeta = {
  layoutTitle: "Courier",
  pageTitle: "My deliveries",
} as const;

export const courierPageCopy = {
  pageEyebrow: "Courier",
  headerTitle: "My deliveries",
  dutyTitle: "Duty status",
  dutyBlurb:
    "Turn on duty when you can take new assignments. Turn it off when you are not available — dispatch sees this signal.",
  assignmentsTitle: "Assigned jobs",
  assignmentsBlurb:
    "Open a row to start pickup, enter verification codes, and share handover details with the agency hub.",
  loadErrorTitle: "Unable to load courier assignments",
  loadErrorBlurb:
    "Jobs could not be loaded from the server. Check that the backend is running, then refresh this page.",
  emptyAssignments:
    "No assignments yet. Dispatch assigns bookings from the admin side — check back when you receive a job.",
  footerAgencyPrefix: "Agency handover hub:",
  footerAgencyLinkLabel: "/agency",
} as const;

export const courierIntroBullets = [
  "Use Duty status so dispatch knows when you are available.",
  "Open a job to complete pickup steps and get the OTP to give the agency at handover.",
  "Agency partners update tracking after they accept your handover.",
] as const;
