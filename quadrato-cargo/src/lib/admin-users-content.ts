/**
 * Admin Users area — copy in one place (list, detail, forms).
 */
export const adminUsersCopy = {
  listEyebrow: "Directory",
  listTitle: "Users",
  listLead:
    "Customers register on the site. Create staff, couriers, and agencies here; link bookings from",
  listLeadBookingsLabel: "Bookings",
  createCollapsibleTitle: "Create accounts",
  createCollapsibleDesc: "Team, courier, agency.",
  filterPlaceholder: "Name or email…",
  tableViewEdit: "Open",
  detailEyebrow: "User",
  detailBack: "All users",
  detailSectionProfile: "Profile & sign-in",
  detailProfileHint:
    "Name, email, role, and password. Delete unlinks guest bookings and removes the account.",
  detailInactiveBanner:
    "Inactive — cannot sign in. Enable Active below and save.",
  detailBookingsAsCustomer: "Bookings",
  detailBookingsCourierNote: "Rare for courier accounts.",
  detailAssignedJobs: "Assigned jobs",
  detailAssignedHint: "From dispatch in",
  detailAssignedBookingsLabel: "Bookings",
  detailNoBookings: "None linked.",
  detailNoJobs: "None assigned.",
  editRoleHint: "Staff → /admin/login · customers → public Log in.",
  editEmailHint: "Updates their sign-in address.",
  editAgencyBlockTitle: "Agency hub",
  editAgencyBlockHint: "Shown on /agency and timeline city on Track.",
  editPasswordHint: "Leave blank to keep current. Both fields must match.",
  editSave: "Save",
  editSaving: "Saving…",
  createStaffTitle: "Team account",
  createStaffBlurb: "Sign-in at /admin/login — full admin access (role limits apply).",
  createCourierTitle: "Courier account",
  createCourierBlurb: "Public Log in, then /courier for assigned jobs.",
  createAgencyTitle: "Agency account",
  createAgencyBlurb: "Public Log in, then /agency for handover.",
} as const;
