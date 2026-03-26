export const USER_ROLES = ["customer", "staff", "courier", "agency"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function normalizeUserRole(value: string | null | undefined): UserRole {
  if (value && isUserRole(value)) return value;
  return "customer";
}
