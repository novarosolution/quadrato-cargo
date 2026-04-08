export type AgencyHubIdentity = {
  displayName: string;
  agencyAddress: string | null;
  agencyPhone: string | null;
  /** City label for customer timeline; full street stays internal. */
  agencyCity: string | null;
};
